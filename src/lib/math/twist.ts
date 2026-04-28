import type { Matrix3, Matrix4, Vec3 } from "@/lib/types";
import { extractPosition, extractRotation } from "./matrix";

/**
 * Twist error between a current pose and a desired pose, expressed in the
 * base frame. The twist is (linear, angular) — a 6-vector in ℝ⁶.
 *
 * Linear part:  p_desired − p_current
 * Angular part: log( R_desired · R_currentᵀ )  (axis-angle vector)
 *
 * This is the standard "spatial twist" error used by resolved-motion-rate
 * solvers; for small errors it coincides with the first-order approximation
 * e ≈ J(q) · Δq.
 */
export function poseTwistError(Tcur: Matrix4, Tdes: Matrix4): number[] {
  const pC = extractPosition(Tcur);
  const pD = extractPosition(Tdes);
  const Rc = extractRotation(Tcur);
  const Rd = extractRotation(Tdes);
  const Rerr = matmul3(Rd, transpose3(Rc));
  const w = logSO3(Rerr);
  return [pD[0] - pC[0], pD[1] - pC[1], pD[2] - pC[2], w[0], w[1], w[2]];
}

function matmul3(A: Matrix3, B: Matrix3): Matrix3 {
  const R: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      R[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
  return R as unknown as Matrix3;
}

function transpose3(A: Matrix3): Matrix3 {
  return [
    [A[0][0], A[1][0], A[2][0]],
    [A[0][1], A[1][1], A[2][1]],
    [A[0][2], A[1][2], A[2][2]],
  ] as const;
}

/** Logarithm map SO(3) → ℝ³: returns axis·angle vector. */
export function logSO3(R: Matrix3): Vec3 {
  const trace = R[0][0] + R[1][1] + R[2][2];
  const cosT = Math.max(-1, Math.min(1, (trace - 1) / 2));
  const theta = Math.acos(cosT);
  if (Math.abs(theta) < 1e-9) {
    // Near identity — use Taylor series (R − Rᵀ)/2 ≈ [ω]×
    return [
      (R[2][1] - R[1][2]) / 2,
      (R[0][2] - R[2][0]) / 2,
      (R[1][0] - R[0][1]) / 2,
    ] as const;
  }
  if (Math.abs(Math.PI - theta) < 1e-6) {
    // Near π — use (R + I)/2 diagonal for a robust axis extraction
    const axis: Vec3 = [
      Math.sqrt(Math.max(0, (R[0][0] + 1) / 2)),
      Math.sqrt(Math.max(0, (R[1][1] + 1) / 2)),
      Math.sqrt(Math.max(0, (R[2][2] + 1) / 2)),
    ];
    // Fix signs using off-diagonal
    const signed: Vec3 = [
      axis[0] * Math.sign(R[2][1] - R[1][2] || 1),
      axis[1] * Math.sign(R[0][2] - R[2][0] || 1),
      axis[2] * Math.sign(R[1][0] - R[0][1] || 1),
    ];
    return [signed[0] * theta, signed[1] * theta, signed[2] * theta] as const;
  }
  const f = theta / (2 * Math.sin(theta));
  return [
    f * (R[2][1] - R[1][2]),
    f * (R[0][2] - R[2][0]),
    f * (R[1][0] - R[0][1]),
  ] as const;
}

export function errorNorms(e: number[]): { lin: number; ang: number } {
  return {
    lin: Math.hypot(e[0], e[1], e[2]),
    ang: Math.hypot(e[3], e[4], e[5]),
  };
}
