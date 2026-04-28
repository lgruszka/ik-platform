"use client";

import type { OptTrace } from "@/lib/solvers/optimization";

type Series = { name: string; color: string; trace: OptTrace[] };

type Props = {
  series: Series[];
  height?: number;
  width?: number;
};

export function CostChart({ series, height = 260, width = 640 }: Props) {
  const pad = { l: 56, r: 12, t: 14, b: 36 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const allPts = series.flatMap((s) => s.trace);
  const xMax = Math.max(1, ...allPts.map((p) => p.iter));
  const yPositive = allPts.map((p) => p.cost).filter((c) => c > 0);
  const yMin = yPositive.length ? Math.min(...yPositive) : 1e-8;
  const yMax = yPositive.length ? Math.max(...yPositive) : 1;
  const logYMin = Math.log10(Math.max(1e-12, yMin));
  const logYMax = Math.log10(Math.max(yMin * 10, yMax));

  const xScale = (x: number) => pad.l + (x / xMax) * plotW;
  const yScale = (y: number) => {
    const ly = Math.log10(Math.max(1e-12, y));
    return pad.t + ((logYMax - ly) / Math.max(1e-6, logYMax - logYMin)) * plotH;
  };

  const yTicks: number[] = [];
  for (let k = Math.floor(logYMin); k <= Math.ceil(logYMax); k++) yTicks.push(Math.pow(10, k));

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <g stroke="#e5e7eb" strokeWidth={0.5}>
          {yTicks.map((y) => (
            <line key={y} x1={pad.l} y1={yScale(y)} x2={pad.l + plotW} y2={yScale(y)} />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={pad.l + f * plotW} y1={pad.t} x2={pad.l + f * plotW} y2={pad.t + plotH} />
          ))}
        </g>
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="#94a3b8" />
        <line x1={pad.l} y1={pad.t + plotH} x2={pad.l + plotW} y2={pad.t + plotH} stroke="#94a3b8" />
        {yTicks.map((y) => (
          <text key={y} x={pad.l - 6} y={yScale(y) + 3} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="end">
            {y.toExponential(0)}
          </text>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text key={f} x={pad.l + f * plotW} y={pad.t + plotH + 14} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="middle">
            {Math.round(f * xMax)}
          </text>
        ))}
        <text x={pad.l + plotW / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#64748b">iteracje</text>
        <text x={14} y={pad.t + plotH / 2} fontSize={10} fill="#64748b" transform={`rotate(-90 14 ${pad.t + plotH / 2})`} textAnchor="middle">
          koszt J(q)
        </text>

        {series.map((s) => {
          const pts = s.trace
            .map((p) => `${xScale(p.iter)},${yScale(Math.max(1e-12, p.cost))}`)
            .join(" ");
          return <polyline key={s.name} fill="none" stroke={s.color} strokeWidth={1.6} points={pts} />;
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: s.color }} />
            {s.name}
            <span className="text-[var(--muted)]">· {s.trace.length} iter</span>
          </span>
        ))}
      </div>
    </div>
  );
}
