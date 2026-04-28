"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useMounted } from "@/lib/hooks";
import { OptimizationContourBackground, makeProjector } from "./optimization-2d-base";
import { cost, type Pt2 } from "./optimization-2d-utils";

type Simplex = [Pt2, Pt2, Pt2];

type IterState = {
  simplex: Simplex;
  costs: [number, number, number];
  operation: string; // "reflect", "expand", "contract", "shrink", "accept", "start"
};

function sortSimplex(s: Simplex): IterState {
  const cs: [Pt2, number][] = s.map((p) => [p, cost(p)]);
  cs.sort((a, b) => a[1] - b[1]);
  return {
    simplex: [cs[0][0], cs[1][0], cs[2][0]] as Simplex,
    costs: [cs[0][1], cs[1][1], cs[2][1]],
    operation: "start",
  };
}

function nelderMeadStep(state: IterState): IterState {
  const [best, mid, worst] = state.simplex;
  const [, , fWorst] = state.costs;
  const ALPHA = 1.0, GAMMA = 2.0, RHO = 0.5, SIGMA = 0.5;
  const centroid: Pt2 = { x: (best.x + mid.x) / 2, y: (best.y + mid.y) / 2 };
  // Reflection
  const reflected: Pt2 = {
    x: centroid.x + ALPHA * (centroid.x - worst.x),
    y: centroid.y + ALPHA * (centroid.y - worst.y),
  };
  const fR = cost(reflected);
  const fBest = state.costs[0], fMid = state.costs[1];
  if (fR < fBest) {
    // Expansion
    const expanded: Pt2 = {
      x: centroid.x + GAMMA * (reflected.x - centroid.x),
      y: centroid.y + GAMMA * (reflected.y - centroid.y),
    };
    const fE = cost(expanded);
    const newWorst = fE < fR ? expanded : reflected;
    const op = fE < fR ? "expand" : "reflect";
    return sortSimplexWithOp([best, mid, newWorst], op);
  }
  if (fR < fMid) {
    return sortSimplexWithOp([best, mid, reflected], "reflect");
  }
  // Contraction
  const contracted: Pt2 = {
    x: centroid.x + RHO * (worst.x - centroid.x),
    y: centroid.y + RHO * (worst.y - centroid.y),
  };
  const fC = cost(contracted);
  if (fC < fWorst) {
    return sortSimplexWithOp([best, mid, contracted], "contract");
  }
  // Shrink
  const newMid: Pt2 = {
    x: best.x + SIGMA * (mid.x - best.x),
    y: best.y + SIGMA * (mid.y - best.y),
  };
  const newWorst: Pt2 = {
    x: best.x + SIGMA * (worst.x - best.x),
    y: best.y + SIGMA * (worst.y - best.y),
  };
  return sortSimplexWithOp([best, newMid, newWorst], "shrink");
}

function sortSimplexWithOp(s: Simplex, op: string): IterState {
  const sorted = sortSimplex(s);
  return { ...sorted, operation: op };
}

export function NelderMeadVisualization() {
  const mounted = useMounted();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const initial: Simplex = [
    { x: -2, y: -2 },
    { x: -1, y: -2.5 },
    { x: -2.5, y: -1 },
  ];

  const history = useMemo(() => {
    const out: IterState[] = [sortSimplex(initial)];
    for (let i = 0; i < 30; i++) {
      const next = nelderMeadStep(out[out.length - 1]);
      out.push(next);
      // przerwij gdy simpleks bardzo mały
      const span = Math.max(
        Math.hypot(next.simplex[0].x - next.simplex[1].x, next.simplex[0].y - next.simplex[1].y),
        Math.hypot(next.simplex[0].x - next.simplex[2].x, next.simplex[0].y - next.simplex[2].y),
      );
      if (span < 0.05) break;
    }
    return out;
  }, []);

  const maxStep = history.length - 1;

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, maxStep]);

  const W = 560, H = 440;
  const pad = { l: 40, r: 24, t: 20, b: 36 };
  const proj = makeProjector(pad.l, pad.t, W - pad.l - pad.r, H - pad.t - pad.b);

  const current = history[step];
  const prev = step > 0 ? history[step - 1] : null;

  const opLabels: Record<string, { label: string; color: string }> = {
    start: { label: "Start", color: "#64748b" },
    reflect: { label: "Reflection (odbicie)", color: "#3b82f6" },
    expand: { label: "Expansion (rozszerzenie)", color: "#10b981" },
    contract: { label: "Contraction (kontrakcja)", color: "#f59e0b" },
    shrink: { label: "Shrink (zwijanie)", color: "#ef4444" },
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={step >= maxStep && !playing}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {playing ? "■ pauza" : step >= maxStep ? "✓ koniec" : "▶ odtwórz"}
          </button>
          <button
            onClick={() => { setStep(0); setPlaying(false); }}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
          >
            ↻ reset
          </button>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)] disabled:opacity-50"
          >
            ← wstecz
          </button>
          <button
            onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
            disabled={step >= maxStep}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)] disabled:opacity-50"
          >
            dalej →
          </button>
          <span className="text-xs font-mono text-[var(--muted)]">
            iteracja {step}/{maxStep}
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{
              background: opLabels[current.operation]?.color + "20",
              color: opLabels[current.operation]?.color,
            }}
          >
            {opLabels[current.operation]?.label ?? current.operation}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <OptimizationContourBackground width={W} height={H} pad={pad} />

          {/* Historyczne simpleksy (cieniste) */}
          {mounted && history.slice(0, step).map((s, i) => {
            const opacity = 0.05 + Math.min(0.2, (i / Math.max(1, step)) * 0.15);
            return (
              <polygon
                key={i}
                points={s.simplex.map((p) => `${proj.sx(p.x)},${proj.sy(p.y)}`).join(" ")}
                fill="#a855f7"
                opacity={opacity}
                stroke="#a855f7"
                strokeWidth={0.5}
              />
            );
          })}

          {/* Aktualny simpleks — wypełniony */}
          {mounted && (
            <>
              <polygon
                points={current.simplex.map((p) => `${proj.sx(p.x)},${proj.sy(p.y)}`).join(" ")}
                fill="#a855f7"
                fillOpacity={0.25}
                stroke="#a855f7"
                strokeWidth={2}
              />
              {/* Wierzchołki: best (zielony), middle (żółty), worst (czerwony) */}
              {(["#10b981", "#f59e0b", "#ef4444"] as const).map((color, i) => (
                <g key={i}>
                  <circle
                    cx={proj.sx(current.simplex[i].x)}
                    cy={proj.sy(current.simplex[i].y)}
                    r={6}
                    fill={color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <text
                    x={proj.sx(current.simplex[i].x) + 8}
                    y={proj.sy(current.simplex[i].y) + 4}
                    fontSize={10}
                    fontFamily="monospace"
                    fill={color}
                    fontWeight={700}
                  >
                    {i === 0 ? "best" : i === 1 ? "mid" : "worst"}
                  </text>
                </g>
              ))}
            </>
          )}

          {/* Strzałka pokazująca operację (od starego najgorszego do nowego punktu) */}
          {mounted && prev && step > 0 && current.operation !== "start" && current.operation !== "shrink" && (
            <line
              x1={proj.sx(prev.simplex[2].x)}
              y1={proj.sy(prev.simplex[2].y)}
              x2={proj.sx(current.simplex[current.simplex.findIndex((p) => p.x !== prev.simplex[0].x && p.x !== prev.simplex[1].x) >= 0
                  ? current.simplex.findIndex((p) => p.x !== prev.simplex[0].x && p.x !== prev.simplex[1].x)
                  : 2].x)}
              y2={proj.sy(current.simplex[current.simplex.findIndex((p) => p.x !== prev.simplex[0].x && p.x !== prev.simplex[1].x) >= 0
                  ? current.simplex.findIndex((p) => p.x !== prev.simplex[0].x && p.x !== prev.simplex[1].x)
                  : 2].y)}
              stroke={opLabels[current.operation]?.color ?? "#94a3b8"}
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          )}
        </svg>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 text-xs">
        <p className="font-semibold mb-1">Najlepszy wierzchołek: <span className="font-mono text-[var(--accent)]">f({current.simplex[0].x.toFixed(3)}, {current.simplex[0].y.toFixed(3)}) = {current.costs[0].toFixed(4)}</span></p>
        <p className="text-[var(--muted)]">
          Trójkąt fioletowy to <strong>aktualny simpleks</strong> (3 wierzchołki w 2D, w n-D byłoby n+1).
          Każda iteracja zastępuje najgorszy wierzchołek (czerwony) nowym punktem,
          generowanym przez jedną z czterech operacji: <span className="text-[#3b82f6]">reflection</span>,{" "}
          <span className="text-[#10b981]">expansion</span>,{" "}
          <span className="text-[#f59e0b]">contraction</span>,{" "}
          <span className="text-[#ef4444]">shrink</span>.
          Zielona kropka po prawej to minimum globalne <code>x* = (2, 1)</code>.
        </p>
      </div>
    </div>
  );
}
