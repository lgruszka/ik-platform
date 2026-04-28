"use client";

import { useMemo } from "react";
import { useRobotStore } from "@/lib/store";
import { geometricJacobian, manipulability } from "@/lib/math/jacobian";
import { jacobiEigen3 } from "@/lib/math/eigen";
import { deg } from "@/lib/utils";

export function ManipulabilityDisplay() {
  const { robot, joints } = useRobotStore();

  const metrics = useMemo(() => {
    const J = geometricJacobian(robot, joints);
    const w_full = manipulability(J);
    // Position-only block (3x6) and orientation-only block (3x6)
    const Jp = [J[0], J[1], J[2]];
    const Jo = [J[3], J[4], J[5]];
    const posManip = manipulabilityMN(Jp);
    const oriManip = manipulabilityMN(Jo);

    // Position ellipsoid: eigen of J_p · J_pᵀ (3×3)
    const JpJpt = matmul3x3(Jp);
    const { values, vectors } = jacobiEigen3(JpJpt);
    const axes = values.map(Math.sqrt);   // semi-axis lengths (singular values of Jp)
    const q5abs = Math.abs(joints[4]);
    const nearWristSing = Math.abs(Math.sin(joints[4])) < 0.05;
    // Elbow singularity: when elbow is nearly straight (q3 ≈ 0 or π ± something depending on convention)
    const c3 = Math.cos(joints[2]);
    const nearElbowSing = Math.abs(Math.sin(joints[2])) < 0.05;

    return { w_full, posManip, oriManip, axes, vectors, nearWristSing, nearElbowSing, q5abs };
  }, [robot, joints]);

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 space-y-3">
      <h3 className="text-sm font-semibold">Manipulacyjność w bieżącej konfiguracji</h3>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono tabular-nums">
        <span className="text-[var(--muted)]">w (pełna, Yoshikawa)</span>
        <span>= {metrics.w_full.toExponential(2)}</span>
        <span className="text-[var(--muted)]">w (pozycyjna)</span>
        <span>= {metrics.posManip.toExponential(2)}</span>
        <span className="text-[var(--muted)]">w (orientacyjna)</span>
        <span>= {metrics.oriManip.toExponential(2)}</span>
        <span className="text-[var(--muted)]">osi elipsoidy pozycyjnej</span>
        <span>
          σ = ({metrics.axes.map((v) => v.toFixed(3)).join(", ")})
        </span>
        <span className="text-[var(--muted)]">warunkowanie cond(Jp)</span>
        <span>= {(metrics.axes[0] / Math.max(1e-12, metrics.axes[2])).toExponential(1)}</span>
      </div>
      <div className="text-xs space-y-1 pt-2 border-t border-[var(--panel-border)]">
        {metrics.nearWristSing ? (
          <div className="text-red-500">⚠ singularność nadgarstka: |q₅| = {deg(metrics.q5abs).toFixed(2)}°</div>
        ) : (
          <div className="text-[var(--muted)]">• nadgarstek OK</div>
        )}
        {metrics.nearElbowSing ? (
          <div className="text-red-500">⚠ singularność łokcia: |sin q₃| ≈ 0</div>
        ) : (
          <div className="text-[var(--muted)]">• łokieć OK</div>
        )}
      </div>
    </div>
  );
}

function matmul3x3(A: number[][]): number[][] {
  // A is 3×n, returns A · Aᵀ (3×3)
  const n = A[0].length;
  const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += A[i][k] * A[j][k];
      R[i][j] = s;
    }
  }
  return R;
}

function manipulabilityMN(A: number[][]): number {
  const M = matmul3x3(A);
  const det =
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  return Math.sqrt(Math.max(0, det));
}
