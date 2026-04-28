import type { Matrix3, Matrix4, Vec3 } from "@/lib/types";

export const IDENTITY4: Matrix4 = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
] as const;

export const IDENTITY3: Matrix3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
] as const;

export function mul4(A: Matrix4, B: Matrix4): Matrix4 {
  const R: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += A[i][k] * B[k][j];
      R[i][j] = s;
    }
  }
  return R as unknown as Matrix4;
}

export function mulMany(...Ts: Matrix4[]): Matrix4 {
  return Ts.reduce((acc, T) => mul4(acc, T), IDENTITY4);
}

/** Fast inverse of a rigid-body (SE(3)) homogeneous transform.
 *  Uses T^-1 = [R^T  -R^T·p; 0 1] — valid only when the 3x3 block is orthogonal. */
export function invSE3(T: Matrix4): Matrix4 {
  const r00 = T[0][0], r01 = T[0][1], r02 = T[0][2];
  const r10 = T[1][0], r11 = T[1][1], r12 = T[1][2];
  const r20 = T[2][0], r21 = T[2][1], r22 = T[2][2];
  const px = T[0][3], py = T[1][3], pz = T[2][3];
  const tx = -(r00 * px + r10 * py + r20 * pz);
  const ty = -(r01 * px + r11 * py + r21 * pz);
  const tz = -(r02 * px + r12 * py + r22 * pz);
  return [
    [r00, r10, r20, tx],
    [r01, r11, r21, ty],
    [r02, r12, r22, tz],
    [0, 0, 0, 1],
  ] as const;
}

export function translation(x: number, y: number, z: number): Matrix4 {
  return [
    [1, 0, 0, x],
    [0, 1, 0, y],
    [0, 0, 1, z],
    [0, 0, 0, 1],
  ] as const;
}

export function extractRotation(T: Matrix4): Matrix3 {
  return [
    [T[0][0], T[0][1], T[0][2]],
    [T[1][0], T[1][1], T[1][2]],
    [T[2][0], T[2][1], T[2][2]],
  ] as const;
}

export function extractPosition(T: Matrix4): Vec3 {
  return [T[0][3], T[1][3], T[2][3]] as const;
}

export function composeSE3(R: Matrix3, p: Vec3): Matrix4 {
  return [
    [R[0][0], R[0][1], R[0][2], p[0]],
    [R[1][0], R[1][1], R[1][2], p[1]],
    [R[2][0], R[2][1], R[2][2], p[2]],
    [0, 0, 0, 1],
  ] as const;
}

export function formatMatrix(T: Matrix4 | Matrix3, digits = 3): string {
  return (T as readonly (readonly number[])[])
    .map((row) => row.map((v) => v.toFixed(digits).padStart(digits + 4)).join("  "))
    .join("\n");
}
