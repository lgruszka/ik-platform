import type { Matrix3, Matrix4, Vec3 } from "@/lib/types";

export function rotX(a: number): Matrix4 {
  const c = Math.cos(a), s = Math.sin(a);
  return [
    [1, 0, 0, 0],
    [0, c, -s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1],
  ] as const;
}

export function rotY(a: number): Matrix4 {
  const c = Math.cos(a), s = Math.sin(a);
  return [
    [c, 0, s, 0],
    [0, 1, 0, 0],
    [-s, 0, c, 0],
    [0, 0, 0, 1],
  ] as const;
}

export function rotZ(a: number): Matrix4 {
  const c = Math.cos(a), s = Math.sin(a);
  return [
    [c, -s, 0, 0],
    [s, c, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Convert roll/pitch/yaw (Z·Y·X intrinsic, i.e. Rz(yaw)·Ry(pitch)·Rx(roll)) to rotation matrix. */
export function rpyToMatrix(roll: number, pitch: number, yaw: number): Matrix3 {
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  return [
    [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
    [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
    [-sp, cp * sr, cp * cr],
  ] as const;
}

/** Inverse of rpyToMatrix. Returns (roll, pitch, yaw). */
export function matrixToRpy(R: Matrix3): Vec3 {
  const sp = -R[2][0];
  if (Math.abs(sp) > 0.99999) {
    // Gimbal lock: pitch ≈ ±π/2, roll + yaw indistinguishable — pick roll = 0.
    const pitch = Math.sign(sp) * Math.PI / 2;
    const yaw = Math.atan2(-R[0][1], R[1][1]);
    return [0, pitch, yaw] as const;
  }
  const pitch = Math.asin(sp);
  const roll = Math.atan2(R[2][1], R[2][2]);
  const yaw = Math.atan2(R[1][0], R[0][0]);
  return [roll, pitch, yaw] as const;
}
