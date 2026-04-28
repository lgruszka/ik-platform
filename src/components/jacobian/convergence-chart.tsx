"use client";

import type { IterationTrace } from "@/lib/solvers/jacobian-solvers";

type Series = { name: string; color: string; trace: IterationTrace[] };

type Props = {
  series: Series[];
  height?: number;
  width?: number;
  metric: "lin" | "ang" | "both";
};

export function ConvergenceChart({ series, height = 260, width = 640, metric }: Props) {
  const pad = { l: 56, r: 12, t: 14, b: 36 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const allPts = series.flatMap((s) =>
    s.trace.map((t, i) => ({
      x: t.iter,
      y:
        metric === "lin"
          ? t.errLin
          : metric === "ang"
            ? t.errAng
            : Math.hypot(t.errLin, t.errAng),
      series: s.name,
    })),
  );

  const xMax = Math.max(1, ...allPts.map((p) => p.x));
  const yPositive = allPts.filter((p) => p.y > 0).map((p) => p.y);
  const yMin = yPositive.length ? Math.min(...yPositive) : 1e-8;
  const yMax = yPositive.length ? Math.max(...yPositive) : 1;
  const logYMin = Math.log10(yMin);
  const logYMax = Math.log10(yMax);

  const xScale = (x: number) => pad.l + (x / xMax) * plotW;
  const yScale = (y: number) => {
    if (y <= 0) return pad.t + plotH;
    const ly = Math.log10(y);
    return pad.t + ((logYMax - ly) / Math.max(1e-6, logYMax - logYMin)) * plotH;
  };

  // Y ticks at integer log decades
  const yTicks: number[] = [];
  for (let k = Math.floor(logYMin); k <= Math.ceil(logYMax); k++) {
    yTicks.push(Math.pow(10, k));
  }

  const xTicks = 5;

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid */}
        <g stroke="#e5e7eb" strokeWidth={0.5}>
          {yTicks.map((y) => (
            <line key={y} x1={pad.l} y1={yScale(y)} x2={pad.l + plotW} y2={yScale(y)} />
          ))}
          {Array.from({ length: xTicks + 1 }, (_, i) => i / xTicks).map((f) => (
            <line
              key={f}
              x1={pad.l + f * plotW}
              y1={pad.t}
              x2={pad.l + f * plotW}
              y2={pad.t + plotH}
            />
          ))}
        </g>
        {/* Axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="#94a3b8" />
        <line
          x1={pad.l}
          y1={pad.t + plotH}
          x2={pad.l + plotW}
          y2={pad.t + plotH}
          stroke="#94a3b8"
        />
        {/* Y tick labels */}
        {yTicks.map((y) => (
          <text
            key={y}
            x={pad.l - 6}
            y={yScale(y) + 3}
            fontSize={9}
            fontFamily="monospace"
            fill="#64748b"
            textAnchor="end"
          >
            {y.toExponential(0)}
          </text>
        ))}
        {/* X tick labels */}
        {Array.from({ length: xTicks + 1 }, (_, i) => i / xTicks).map((f) => (
          <text
            key={f}
            x={pad.l + f * plotW}
            y={pad.t + plotH + 14}
            fontSize={9}
            fontFamily="monospace"
            fill="#64748b"
            textAnchor="middle"
          >
            {Math.round(f * xMax)}
          </text>
        ))}
        {/* Axis labels */}
        <text
          x={pad.l + plotW / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
        >
          iteracje
        </text>
        <text
          x={14}
          y={pad.t + plotH / 2}
          fontSize={10}
          fill="#64748b"
          transform={`rotate(-90 14 ${pad.t + plotH / 2})`}
          textAnchor="middle"
        >
          {metric === "lin" ? "‖Δp‖ [m]" : metric === "ang" ? "ΔR [rad]" : "‖error‖"}
        </text>

        {/* Series */}
        {series.map((s) => {
          const pts = s.trace
            .map((t) => {
              const y =
                metric === "lin"
                  ? t.errLin
                  : metric === "ang"
                    ? t.errAng
                    : Math.hypot(t.errLin, t.errAng);
              if (y <= 0) return null;
              return `${xScale(t.iter)},${yScale(y)}`;
            })
            .filter(Boolean)
            .join(" ");
          return <polyline key={s.name} fill="none" stroke={s.color} strokeWidth={1.6} points={pts} />;
        })}
      </svg>
      {/* Legend */}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5"
              style={{ background: s.color }}
            />
            {s.name}
            <span className="text-[var(--muted)]">· {s.trace.length} iter</span>
          </span>
        ))}
      </div>
    </div>
  );
}
