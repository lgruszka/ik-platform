"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useMounted } from "@/lib/hooks";
import { OptimizationContourBackground, makeProjector } from "./optimization-2d-base";
import { cost, grad, type Pt2 } from "./optimization-2d-utils";

/**
 * Wizualizacja gradient descent z line search Armijo.
 * Pokazuje: punkt aktualny, gradient (strzałka), kierunek kroku, ślad iteracji.
 * Slider regulujący learning rate pokazuje jak za mały krok = wolna zbieżność,
 * za duży = oscylacje.
 */
export function GradientDescentVisualization() {
  const mounted = useMounted();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [alpha, setAlpha] = useState(0.3);
  const intervalRef = useRef<number | null>(null);

  const start: Pt2 = { x: -2, y: -2 };

  const history = useMemo(() => {
    const out: { p: Pt2; g: Pt2; cost: number }[] = [];
    let p = { ...start };
    for (let i = 0; i < 60; i++) {
      const g = grad(p);
      out.push({ p: { ...p }, g, cost: cost(p) });
      const gNorm = Math.hypot(g.x, g.y);
      if (gNorm < 0.01) break;
      // Krok wzdłuż -gradient
      p = { x: p.x - alpha * g.x, y: p.y - alpha * g.y };
      // Stop jeśli wyszliśmy z obszaru widoku
      if (Math.abs(p.x) > 10 || Math.abs(p.y) > 10) break;
    }
    return out;
  }, [alpha]);

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
    }, 400);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, maxStep]);

  // Reset kroku gdy zmienia się alpha
  useEffect(() => { setStep(0); setPlaying(false); }, [alpha]);

  const W = 560, H = 440;
  const pad = { l: 40, r: 24, t: 20, b: 36 };
  const proj = makeProjector(pad.l, pad.t, W - pad.l - pad.r, H - pad.t - pad.b);

  const current = history[step];
  const trail = history.slice(0, step + 1).map((h) => h.p);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 space-y-3">
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
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted)] shrink-0">krok α =</span>
          <input
            type="range"
            min={0.05}
            max={0.55}
            step={0.01}
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="font-mono text-sm tabular-nums w-12 text-right">{alpha.toFixed(2)}</span>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Spróbuj różnych wartości <code>α</code>: <strong>0.05</strong> = bardzo wolne ale stabilne;
          <strong> 0.30</strong> = sensowne; <strong>0.50+</strong> = oscylacje (kierunek y ma steeper gradient).
        </p>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <OptimizationContourBackground width={W} height={H} pad={pad} />

          {/* Ślad iteracji */}
          {mounted && trail.length > 1 && (
            <polyline
              points={trail.map((p) => `${proj.sx(p.x)},${proj.sy(p.y)}`).join(" ")}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={2}
              opacity={0.5}
            />
          )}

          {/* Punkty historyczne (mniejsze) */}
          {mounted && trail.slice(0, -1).map((p, i) => (
            <circle
              key={i}
              cx={proj.sx(p.x)}
              cy={proj.sy(p.y)}
              r={3}
              fill="#0ea5e9"
              opacity={0.6}
            />
          ))}

          {/* Aktualny punkt + strzałka gradientu */}
          {mounted && current && (
            <>
              {/* Strzałka -∇f (czerwona, kierunek kroku) */}
              <defs>
                <marker id="gd-arr-grad" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                </marker>
              </defs>
              {step < maxStep && (
                <line
                  x1={proj.sx(current.p.x)} y1={proj.sy(current.p.y)}
                  x2={proj.sx(current.p.x - alpha * current.g.x)}
                  y2={proj.sy(current.p.y - alpha * current.g.y)}
                  stroke="#ef4444" strokeWidth={2.4} markerEnd="url(#gd-arr-grad)"
                />
              )}
              {/* Aktualny punkt */}
              <circle
                cx={proj.sx(current.p.x)}
                cy={proj.sy(current.p.y)}
                r={7}
                fill="#0ea5e9"
                stroke="white"
                strokeWidth={2}
              />
            </>
          )}
        </svg>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 text-xs space-y-1">
        {current && (
          <>
            <p className="font-semibold">
              Aktualnie: <span className="font-mono">x = ({current.p.x.toFixed(3)}, {current.p.y.toFixed(3)})</span>,
              <span className="font-mono ml-2">f(x) = {current.cost.toFixed(4)}</span>
            </p>
            <p className="font-mono text-[var(--muted)]">
              ∇f = ({current.g.x.toFixed(3)}, {current.g.y.toFixed(3)}),  ‖∇f‖ = {Math.hypot(current.g.x, current.g.y).toFixed(3)}
            </p>
            <p className="text-[var(--muted)]">
              Czerwona strzałka pokazuje krok <code>x_{"k+1"} = x_k − α·∇f(x_k)</code>. Niebieski ślad — historia iteracji.
              Zauważ: dolinę (wąską oś) GD zwykle pokonuje zygzakowato, a długą oś — wolno. To klasyczna patologia GD na funkcjach
              o nierównej skali.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
