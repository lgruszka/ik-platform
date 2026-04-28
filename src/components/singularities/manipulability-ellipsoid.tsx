"use client";

import { useMemo } from "react";
import { Vector3, Quaternion, Matrix4 as TMatrix4 } from "three";
import { useRobotStore } from "@/lib/store";
import { geometricJacobian } from "@/lib/math/jacobian";
import { jacobiEigen3 } from "@/lib/math/eigen";
import { forwardKinematics } from "@/lib/robots";
import { extractPosition } from "@/lib/math/matrix";

/**
 * Renders the position-velocity manipulability ellipsoid at the end effector.
 * Semi-axes = singular values of J_pos; principal directions = eigenvectors
 * of J_p · J_pᵀ. Scale-controlled so it fits alongside the robot.
 */
export function ManipulabilityEllipsoid({ scale = 0.5 }: { scale?: number }) {
  const { robot, joints } = useRobotStore();
  const data = useMemo(() => {
    const J = geometricJacobian(robot, joints);
    const Jp = [J[0], J[1], J[2]];
    const n = Jp[0].length;
    const M: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let s = 0;
        for (let k = 0; k < n; k++) s += Jp[i][k] * Jp[j][k];
        M[i][j] = s;
      }
    }
    const { values, vectors } = jacobiEigen3(M);
    const axes = values.map((v) => Math.sqrt(Math.max(0, v)));
    const T = forwardKinematics(robot, joints);
    const p = extractPosition(T);

    // Build a quaternion from the eigenvector matrix (columns)
    const basis = new TMatrix4().makeBasis(
      new Vector3(vectors[0][0], vectors[1][0], vectors[2][0]),
      new Vector3(vectors[0][1], vectors[1][1], vectors[2][1]),
      new Vector3(vectors[0][2], vectors[1][2], vectors[2][2]),
    );
    const q = new Quaternion().setFromRotationMatrix(basis);
    return { p: new Vector3(p[0], p[1], p[2]), q, axes };
  }, [robot, joints]);

  return (
    <group position={data.p} quaternion={data.q}>
      <mesh scale={[data.axes[0] * scale, data.axes[1] * scale, data.axes[2] * scale]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="#a855f7" transparent opacity={0.18} wireframe={false} />
      </mesh>
      <mesh scale={[data.axes[0] * scale, data.axes[1] * scale, data.axes[2] * scale]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshBasicMaterial color="#a855f7" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
