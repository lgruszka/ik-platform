import { Matrix4 as ThreeMatrix4, Quaternion, Vector3 } from "three";
import type { Matrix4 } from "@/lib/types";

/** Convert our readonly row-major 4x4 to Three.js Matrix4 (which is column-major internally). */
export function toThreeMatrix(T: Matrix4, target?: ThreeMatrix4): ThreeMatrix4 {
  const m = target ?? new ThreeMatrix4();
  m.set(
    T[0][0], T[0][1], T[0][2], T[0][3],
    T[1][0], T[1][1], T[1][2], T[1][3],
    T[2][0], T[2][1], T[2][2], T[2][3],
    T[3][0], T[3][1], T[3][2], T[3][3],
  );
  return m;
}

export function decomposeFrame(T: Matrix4): {
  position: Vector3;
  quaternion: Quaternion;
} {
  const m = toThreeMatrix(T);
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  m.decompose(position, quaternion, scale);
  return { position, quaternion };
}
