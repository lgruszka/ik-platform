"use client";

import { useMemo } from "react";
import { useRobotStore } from "@/lib/store";
import { PUMA560 } from "@/lib/robots";
import { geometricJacobian, manipulability } from "@/lib/math/jacobian";
import type { JointConfig } from "@/lib/types";
import { deg } from "@/lib/utils";

/**
 * Sweeps one joint across its limits (others held at current values) and plots
 * the manipulability w(q) = √det(J·Jᵀ) along that slice. Useful to see where
 * singularities sit in the reachable range.
 */
export function ManipulabilityProfile({ jointIdx = 4 }: { jointIdx?: number }) {
  const { joints } = useRobotStore();
  const lim = PUMA560.dh[jointIdx].limits ?? { min: -Math.PI, max: Math.PI };

  const samples = useMemo(() => {
    const N = 120;
    const out: { q: number; w: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const q = lim.min + (i / N) * (lim.max - lim.min);
      const qvec = [...joints] as number[];
      qvec[jointIdx] = q;
      const J = geometricJacobian(PUMA560, qvec as unknown as JointConfig);
      out.push({ q, w: manipulability(J) });
    }
    return out;
  }, [joints, jointIdx, lim.min, lim.max]);

  const width = 640, height = 220, pad = { l: 56, r: 12, t: 16, b: 36 };
  const plotW = width - pad.l - pad.r, plotH = height - pad.t - pad.b;
  const wMax = Math.max(...samples.map((s) => s.w), 1e-6);

  const xScale = (q: number) => pad.l + ((q - lim.min) / (lim.max - lim.min)) * plotW;
  const yScale = (w: number) => pad.t + (1 - w / wMax) * plotH;

  const path = samples.map((s, i) => `${i === 0 ? "M" : "L"}${xScale(s.q)},${yScale(s.w)}`).join(" ");
  const currentX = xScale(joints[jointIdx]);

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Manipulacyjność vs q{(jointIdx + 1)}</h3>
        <span className="text-xs font-mono text-[var(--muted)] tabular-nums">
          aktualne: q{jointIdx + 1} = {deg(joints[jointIdx]).toFixed(1)}°
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <g stroke="#e5e7eb" strokeWidth={0.5}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={pad.l} y1={pad.t + f * plotH} x2={pad.l + plotW} y2={pad.t + f * plotH} />
          ))}
        </g>
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="#94a3b8" />
        <line x1={pad.l} y1={pad.t + plotH} x2={pad.l + plotW} y2={pad.t + plotH} stroke="#94a3b8" />
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={pad.l - 6} y={pad.t + (1 - f) * plotH + 3} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="end">
            {(f * wMax).toExponential(1)}
          </text>
        ))}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={pad.l + f * plotW} y={pad.t + plotH + 14} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="middle">
            {deg(lim.min + f * (lim.max - lim.min)).toFixed(0)}°
          </text>
        ))}
        <path d={path} fill="none" stroke="#a855f7" strokeWidth={1.6} />
        <line x1={currentX} y1={pad.t} x2={currentX} y2={pad.t + plotH} stroke="#ef4444" strokeDasharray="3 2" strokeWidth={1} />
        <text x={pad.l + plotW / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#64748b">q{jointIdx + 1} [°]</text>
      </svg>
      <p className="text-xs text-[var(--muted)] mt-1">
        Czerwona linia = bieżąca wartość kąta. Minima funkcji w(q) odpowiadają singularnościom.
      </p>
    </div>
  );
}
