"use client";

import { useMemo } from "react";
import { useTargetStore } from "@/lib/target-store";
import { usePlaygroundStore } from "@/lib/playground-store";
import { useRobotStore } from "@/lib/store";
import { solvePuma560Analytical } from "@/lib/solvers";
import { forwardKinematics } from "@/lib/robots";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import type { Matrix3 } from "@/lib/types";
import { BRANCH_COLOURS, branchKey, branchLabel } from "@/lib/branch-colors";
import { deg } from "@/lib/utils";

function rotResidual(a: Matrix3, b: Matrix3): number {
  // Frobenius norm of R_a^T R_b - I ≈ 2·sin(θ/2)·√2 for small θ;
  // equivalently trace((R_a^T R_b) - I) = 2 cos(θ) - 1; we use angle directly.
  let trace = 0;
  for (let i = 0; i < 3; i++) {
    for (let k = 0; k < 3; k++) {
      // (R_a^T R_b)[i][i]
    }
  }
  // Compute trace of R_a^T · R_b
  for (let i = 0; i < 3; i++) {
    for (let k = 0; k < 3; k++) {
      trace += a[k][i] * b[k][i];
    }
  }
  const cosTheta = (trace - 1) / 2;
  return Math.acos(Math.max(-1, Math.min(1, cosTheta)));
}

export function ResidualsTable() {
  const { target } = useTargetStore();
  const { robot, setJoints } = useRobotStore();
  const { selectedBranches, toggleBranch } = usePlaygroundStore();

  const rows = useMemo(() => {
    const sols = solvePuma560Analytical(target);
    const targetPos = extractPosition(target);
    const targetRot = extractRotation(target);
    return sols.map((sol) => {
      const Tfk = forwardKinematics(robot, sol.joints);
      const fkPos = extractPosition(Tfk);
      const fkRot = extractRotation(Tfk);
      const posErr = Math.hypot(
        fkPos[0] - targetPos[0],
        fkPos[1] - targetPos[1],
        fkPos[2] - targetPos[2],
      );
      const rotErr = rotResidual(targetRot, fkRot);
      return { sol, posErr, rotErr };
    });
  }, [target, robot]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 text-center text-[var(--muted)]">
        Brak rozwiązań dla zadanej pozy.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--panel-border)]">
            <th className="px-3 py-2 text-left font-mono text-[var(--muted)] uppercase">widoczne</th>
            <th className="px-3 py-2 text-left font-mono text-[var(--muted)] uppercase">gałąź</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">q₁</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">q₂</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">q₃</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">q₄</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">q₅</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">q₆</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">‖Δp‖</th>
            <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">ΔR</th>
            <th className="px-3 py-2 font-mono text-[var(--muted)] uppercase">akcja</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sol, posErr, rotErr }, i) => {
            const key = branchKey(sol.branch!);
            const colour = BRANCH_COLOURS[key];
            const checked = selectedBranches.has(key);
            return (
              <tr key={i} className="border-b border-[var(--panel-border)] last:border-0 font-mono tabular-nums">
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggleBranch(key)}
                    className={`w-4 h-4 rounded-sm border-2 inline-block transition-all ${
                      checked ? "border-transparent" : "border-[var(--panel-border)] opacity-40"
                    }`}
                    style={{ background: checked ? colour : undefined }}
                    aria-label={`toggle ${key}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: colour }} />
                  {branchLabel(sol.branch!)}
                </td>
                {sol.joints.map((q, j) => (
                  <td key={j} className="px-3 py-2 text-right">
                    {deg(q).toFixed(1)}°
                  </td>
                ))}
                <td className="px-3 py-2 text-right text-[10px]">{posErr.toExponential(1)}</td>
                <td className="px-3 py-2 text-right text-[10px]">{rotErr.toExponential(1)}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setJoints(sol.joints)}
                    className="text-[var(--accent)] hover:underline text-xs"
                  >
                    wczytaj →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
