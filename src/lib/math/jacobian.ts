import { forwardKinematicsFrames } from "@/lib/robots/dh";
import type { JointConfig, RobotModel } from "@/lib/types";
import { zeros } from "./linalg";

/**
 * Geometric Jacobian in the base frame for a serial manipulator with only
 * revolute joints (the Puma case). For each joint j (0-indexed):
 *
 *   J[:, j] = [ ẑ_j × (p_ee − p_j);  ẑ_j ]
 *
 * where ẑ_j is the joint axis direction and p_j a point on the axis line,
 * both in base coordinates. For modified DH (Craig), this is the z-direction
 * and origin of the frame reached AFTER the j-th link transform.
 */
export function geometricJacobian(robot: RobotModel, q: JointConfig): number[][] {
  const frames = forwardKinematicsFrames(robot, q);
  const ee = frames[frames.length - 1];
  const pEE = [ee[0][3], ee[1][3], ee[2][3]];
  const n = robot.dh.length;
  const J = zeros(6, n);

  for (let j = 0; j < n; j++) {
    const F = frames[j + 1];
    const zx = F[0][2], zy = F[1][2], zz = F[2][2];
    const dx = pEE[0] - F[0][3];
    const dy = pEE[1] - F[1][3];
    const dz = pEE[2] - F[2][3];
    if (robot.dh[j].jointType === "revolute") {
      // Linear: z × d
      J[0][j] = zy * dz - zz * dy;
      J[1][j] = zz * dx - zx * dz;
      J[2][j] = zx * dy - zy * dx;
      // Angular: z
      J[3][j] = zx;
      J[4][j] = zy;
      J[5][j] = zz;
    } else {
      // prismatic
      J[0][j] = zx;
      J[1][j] = zy;
      J[2][j] = zz;
      // no contribution to angular
    }
  }
  return J;
}

/**
 * Yoshikawa manipulability w = √det(J·Jᵀ). For a square Jacobian this equals |det J|.
 */
export function manipulability(J: number[][]): number {
  const m = J.length;
  const JJt = zeros(m, m);
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < m; k++) {
      let s = 0;
      for (let r = 0; r < J[0].length; r++) s += J[i][r] * J[k][r];
      JJt[i][k] = s;
    }
  }
  return Math.sqrt(Math.max(0, det(JJt)));
}

function det(A: number[][]): number {
  // LU with partial pivoting — returns product of diagonal of U times sign.
  const n = A.length;
  const M = A.map((r) => r.slice());
  let sign = 1;
  for (let k = 0; k < n; k++) {
    let pivot = k;
    let maxAbs = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > maxAbs) { maxAbs = Math.abs(M[i][k]); pivot = i; }
    }
    if (maxAbs < 1e-15) return 0;
    if (pivot !== k) { [M[k], M[pivot]] = [M[pivot], M[k]]; sign = -sign; }
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / M[k][k];
      for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
    }
  }
  let d = sign;
  for (let i = 0; i < n; i++) d *= M[i][i];
  return d;
}
