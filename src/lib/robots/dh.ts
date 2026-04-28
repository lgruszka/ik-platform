import type { DHParameter, JointConfig, Matrix4, RobotModel } from "@/lib/types";
import { IDENTITY4, mul4, translation } from "@/lib/math/matrix";
import { rotX, rotZ } from "@/lib/math/rotations";

/**
 * Modified DH (Craig) link transform:
 *
 *   T_{i-1}^{i} = Rot_x(αᵢ₋₁) · Trans_x(aᵢ₋₁) · Rot_z(θᵢ) · Trans_z(dᵢ)
 *
 * In closed form:
 *
 *   [ cθ           -sθ           0       aᵢ₋₁    ]
 *   [ sθ·cα        cθ·cα        -sα    -sα·dᵢ   ]
 *   [ sθ·sα        cθ·sα         cα     cα·dᵢ   ]
 *   [ 0            0             0      1        ]
 *
 * where α = αᵢ₋₁, a = aᵢ₋₁, θ, d are the four DH parameters for link i.
 */
export function modifiedDHTransform(alpha: number, a: number, d: number, theta: number): Matrix4 {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  return [
    [ct, -st, 0, a],
    [st * ca, ct * ca, -sa, -sa * d],
    [st * sa, ct * sa, ca, ca * d],
    [0, 0, 0, 1],
  ] as const;
}

/**
 * Standard DH (distal) link transform:
 *
 *   T_{i-1}^{i} = Rot_z(θᵢ) · Trans_z(dᵢ) · Trans_x(aᵢ) · Rot_x(αᵢ)
 */
export function standardDHTransform(alpha: number, a: number, d: number, theta: number): Matrix4 {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  return [
    [ct, -st * ca, st * sa, a * ct],
    [st, ct * ca, -ct * sa, a * st],
    [0, sa, ca, d],
    [0, 0, 0, 1],
  ] as const;
}

export function linkTransform(
  convention: "standard" | "modified",
  p: DHParameter,
  jointValue: number,
): Matrix4 {
  if (p.jointType === "revolute") {
    const theta = p.theta + jointValue + (p.jointOffset ?? 0);
    return convention === "modified"
      ? modifiedDHTransform(p.alpha, p.a, p.d, theta)
      : standardDHTransform(p.alpha, p.a, p.d, theta);
  }
  // prismatic
  const d = p.d + jointValue + (p.jointOffset ?? 0);
  return convention === "modified"
    ? modifiedDHTransform(p.alpha, p.a, d, p.theta)
    : standardDHTransform(p.alpha, p.a, d, p.theta);
}

/**
 * Forward kinematics — returns the sequence of frame transforms:
 *   [T₀⁰, T₀¹, T₀², …, T₀ⁿ, T₀^{tcp}]
 *
 * T₀⁰ is the base-offset transform (useful for robots whose base frame is raised
 * from the world origin). T₀^{tcp} is included only if toolOffset is present.
 */
export function forwardKinematicsFrames(
  robot: RobotModel,
  joints: JointConfig,
): Matrix4[] {
  const frames: Matrix4[] = [];
  let T = robot.baseOffset ?? IDENTITY4;
  frames.push(T);
  for (let i = 0; i < robot.dh.length; i++) {
    const Ti = linkTransform(robot.convention, robot.dh[i], joints[i]);
    T = mul4(T, Ti);
    frames.push(T);
  }
  if (robot.toolOffset) {
    T = mul4(T, robot.toolOffset);
    frames.push(T);
  }
  return frames;
}

/** Convenience: end-effector pose T₀^{tcp}. */
export function forwardKinematics(robot: RobotModel, joints: JointConfig): Matrix4 {
  const frames = forwardKinematicsFrames(robot, joints);
  return frames[frames.length - 1];
}

/**
 * Pośrednie układy współrzędnych łącza — rozbicie modyfikowanej transformacji DH na cztery kroki:
 *   frame_{i-1}  →  (+Rx α)  →  (+Tx a)  →  (+Rz θ)  →  (+Tz d)  →  frame_i
 *
 * Pozwala zwizualizować osobno przesunięcia wzdłuż osi X (długość ogniwa a)
 * i Z (odsadzenie d), co jest kluczowe dla manipulatorów takich jak Puma560,
 * gdzie d₃ i d₄ nie są zerowe. Funkcja zwraca dla każdego łącza i:
 *
 *   - Tprev     = frame_{i-1}              (punkt A — początek ogniwa)
 *   - TafterA   = frame po Rx(α)·Tx(a)     (punkt B — koniec odcinka o długości a_{i-1})
 *   - Tfinal    = frame_i                  (punkt C = B + d_i wzdłuż z po Rz(θ_i))
 *
 * Ponieważ Rz i Tz nie zmieniają kierunku osi Z, B i C leżą na tej samej prostej
 * o kierunku z-układu_i.
 */
export type LinkIntermediates = {
  index: number;
  Tprev: Matrix4;
  TafterA: Matrix4;
  Tfinal: Matrix4;
  aLen: number;
  dLen: number;
  alpha: number;
  theta: number;
};

export function linkIntermediates(robot: RobotModel, joints: JointConfig): LinkIntermediates[] {
  const result: LinkIntermediates[] = [];
  let T: Matrix4 = robot.baseOffset ?? IDENTITY4;
  for (let i = 0; i < robot.dh.length; i++) {
    const dh = robot.dh[i];
    const Tprev = T;
    const TafterRx = mul4(Tprev, rotX(dh.alpha));
    const TafterA = mul4(TafterRx, translation(dh.a, 0, 0));
    const jointValue = dh.jointType === "revolute" ? joints[i] + (dh.jointOffset ?? 0) : 0;
    const theta = dh.theta + jointValue;
    const TafterRz = mul4(TafterA, rotZ(theta));
    const d = dh.jointType === "prismatic" ? dh.d + joints[i] + (dh.jointOffset ?? 0) : dh.d;
    const Tfinal = mul4(TafterRz, translation(0, 0, d));
    result.push({ index: i, Tprev, TafterA, Tfinal, aLen: dh.a, dLen: d, alpha: dh.alpha, theta });
    T = Tfinal;
  }
  return result;
}
