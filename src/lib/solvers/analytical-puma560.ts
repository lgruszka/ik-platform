import { PUMA_A2, PUMA_A3, PUMA_D3, PUMA_D4 } from "@/lib/robots/puma560";
import { extractPosition, extractRotation, invSE3, mul4 } from "@/lib/math/matrix";
import type { IKBranch, IKSolution, JointConfig, Matrix4 } from "@/lib/types";

export type AnalyticalOptions = {
  /** If the target pose describes the *tool tip*, pass the tool→frame-6 offset
   *  so the solver backs off to the wrist frame before decoupling. */
  toolOffset?: Matrix4;
  /** Numerical tolerance for degenerate geometry checks. */
  eps?: number;
};

/**
 * Closed-form IK for Puma560 (modified DH, Craig convention).
 *
 * The solver exploits Pieper's condition: the last three joint axes (4, 5, 6)
 * intersect at a single point — the wrist centre — so the 6-DOF problem
 * factors into a 3-DOF positional problem (q₁, q₂, q₃) driving the wrist
 * centre onto the target point, followed by a 3-DOF orientation problem
 * (q₄, q₅, q₆) matching the rotation R₀⁶ via the residual matrix R₃⁶.
 *
 * Returns up to eight solutions:
 *   - shoulder ∈ {left, right}  — sign of the horizontal radial reach ρ
 *   - elbow    ∈ {up, down}     — sign of sin(ψ) in the law-of-cosines step
 *   - wrist    ∈ {noflip, flip} — sign of sin(q₅) in the wrist decomposition
 *
 * At the wrist singularity (q₅ ≈ 0 or π), wrist branches collapse and only one
 * representative solution per (shoulder, elbow) pair is returned, with q₄ = 0.
 */
export function solvePuma560Analytical(
  target: Matrix4,
  options: AnalyticalOptions = {},
): IKSolution[] {
  const eps = options.eps ?? 1e-6;

  // Pieper step: for Puma with Craig DH, d₆ = 0 ⇒ wrist centre coincides with
  // origin of frame 6. When the caller specifies a tool offset, back it off.
  const T06 = options.toolOffset
    ? mul4(target, invSE3(options.toolOffset))
    : target;

  const R = extractRotation(T06);
  const [px, py, pz] = extractPosition(T06);
  const r11 = R[0][0], r12 = R[0][1], r13 = R[0][2];
  const r21 = R[1][0], r22 = R[1][1], r23 = R[1][2];
  const r31 = R[2][0], r32 = R[2][1], r33 = R[2][2];

  const solutions: IKSolution[] = [];
  const r_xy_sq = px * px + py * py;
  const discQ1 = r_xy_sq - PUMA_D3 * PUMA_D3;
  if (discQ1 < -eps) return [];
  const rho_abs = Math.sqrt(Math.max(0, discQ1));
  const phi = Math.atan2(py, px);

  // Constants for the law-of-cosines step on the elbow:
  const L = Math.sqrt(PUMA_A3 * PUMA_A3 + PUMA_D4 * PUMA_D4);
  const beta = Math.atan2(PUMA_D4, PUMA_A3);

  for (const rhoSign of [+1, -1] as const) {
    const rho = rhoSign * rho_abs;
    const q1 = phi - Math.atan2(PUMA_D3, rho);
    const shoulder: IKBranch["shoulder"] = rhoSign > 0 ? "right" : "left";

    const K =
      (rho * rho + pz * pz - PUMA_A2 * PUMA_A2 - PUMA_A3 * PUMA_A3 - PUMA_D4 * PUMA_D4) /
      (2 * PUMA_A2);
    const disc = L * L - K * K;
    if (disc < -eps) continue;
    const sqrtD = Math.sqrt(Math.max(0, disc));

    for (const elbowSign of [+1, -1] as const) {
      const q3 = Math.atan2(elbowSign * sqrtD, K) - beta;
      const elbow: IKBranch["elbow"] = elbowSign > 0 ? "up" : "down";

      const c3 = Math.cos(q3), s3 = Math.sin(q3);
      const M = PUMA_A2 + PUMA_A3 * c3 - PUMA_D4 * s3;
      const N = PUMA_A3 * s3 + PUMA_D4 * c3;
      const denom = M * M + N * N;
      if (denom < eps) continue;
      // System:  M·c₂ − N·s₂ = ρ        ⇒  c₂ = (Mρ − N p_z) / (M²+N²)
      //          N·c₂ + M·s₂ = −p_z     ⇒  s₂ = (−M p_z − Nρ) / (M²+N²)
      const c2 = (M * rho - N * pz) / denom;
      const s2 = (-M * pz - N * rho) / denom;
      const q2 = Math.atan2(s2, c2);

      const c1 = Math.cos(q1), s1 = Math.sin(q1);
      const c23 = Math.cos(q2 + q3), s23 = Math.sin(q2 + q3);

      // R₀³ (derived symbolically for Puma Craig DH):
      //   [[ c₁c₂₃, -c₁s₂₃, -s₁],
      //    [ s₁c₂₃, -s₁s₂₃,  c₁],
      //    [ -s₂₃,  -c₂₃,    0 ]]
      // R₃⁶ = R₀³ᵀ · R₀⁶
      const R36_00 =  c1 * c23 * r11 + s1 * c23 * r21 - s23 * r31;
      const R36_01 =  c1 * c23 * r12 + s1 * c23 * r22 - s23 * r32;
      const R36_02 =  c1 * c23 * r13 + s1 * c23 * r23 - s23 * r33;
      const R36_10 = -c1 * s23 * r11 - s1 * s23 * r21 - c23 * r31;
      const R36_11 = -c1 * s23 * r12 - s1 * s23 * r22 - c23 * r32;
      const R36_12 = -c1 * s23 * r13 - s1 * s23 * r23 - c23 * r33;
      const R36_20 = -s1 * r11 + c1 * r21;
      const R36_21 = -s1 * r12 + c1 * r22;
      const R36_22 = -s1 * r13 + c1 * r23;

      // For Puma (Craig) the wrist rotation has the symbolic form:
      //   R₃⁶[1][2] = cos(q₅)
      //   R₃⁶[1][0] =  sin(q₅) cos(q₆)
      //   R₃⁶[1][1] = −sin(q₅) sin(q₆)
      //   R₃⁶[0][2] = −cos(q₄) sin(q₅)
      //   R₃⁶[2][2] =  sin(q₄) sin(q₅)
      const sq5_abs = Math.hypot(R36_10, R36_11);
      const cq5 = R36_12;

      if (sq5_abs < eps) {
        // Wrist singularity q₅ ≈ 0 (or π). Only q₄+q₆ is determined.
        // Convention: q₄ = 0, q₆ = atan2(−R₃⁶[0][1], R₃⁶[0][0]).
        const q5 = Math.atan2(0, cq5); // 0 or ±π
        const q4 = 0;
        // At q₅ = 0:  R₃⁶[0][0] = cos(q₄+q₆),  R₃⁶[0][1] = −sin(q₄+q₆)
        const q6 = Math.atan2(-R36_01, R36_00);
        solutions.push({
          joints: [q1, q2, q3, q4, q5, q6] as JointConfig,
          branch: { shoulder, elbow, wrist: "noflip" },
          success: true,
          residual: 0,
        });
        continue;
      }

      for (const wristSign of [+1, -1] as const) {
        const sq5 = wristSign * sq5_abs;
        const q5 = Math.atan2(sq5, cq5);
        // atan2(a·w, b·w) for w ∈ {±1} maps the other branch to the opposite half-plane.
        const q4 = Math.atan2(wristSign * R36_22, -wristSign * R36_02);
        const q6 = Math.atan2(-wristSign * R36_11, wristSign * R36_10);
        const wrist: IKBranch["wrist"] = wristSign > 0 ? "noflip" : "flip";
        solutions.push({
          joints: [q1, q2, q3, q4, q5, q6] as JointConfig,
          branch: { shoulder, elbow, wrist },
          success: true,
          residual: 0,
        });
      }
    }
  }

  return solutions;
}

/** Pick the solution whose joint vector is closest (Euclidean, angle-wrapped) to `seed`. */
export function pickClosestSolution(
  solutions: IKSolution[],
  seed: JointConfig,
): IKSolution | null {
  if (solutions.length === 0) return null;
  let best = solutions[0];
  let bestDist = Infinity;
  for (const s of solutions) {
    let d = 0;
    for (let i = 0; i < 6; i++) {
      let delta = s.joints[i] - seed[i];
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      d += delta * delta;
    }
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}
