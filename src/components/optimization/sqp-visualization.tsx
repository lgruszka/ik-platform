"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useMounted } from "@/lib/hooks";
import { OptimizationContourBackground, makeProjector } from "./optimization-2d-base";
import { cost, grad, type Pt2 } from "./optimization-2d-utils";

/**
 * Wizualizacja SQP z aktywnym ograniczeniem nierównościowym.
 * Funkcja kosztu jak w pozostałych demach. Dodatkowo: ograniczenie
 *   g(x, y) = y − x − 0.5 ≤ 0    (cel jest pod tą prostą)
 *
 * Minimum bez ograniczenia: (2, 1) — leży DOKŁADNIE NA granicy y = x + 0.5
 *   (sprawdź: 1 − 2 − 0.5 = -1.5? Nie. Zmieniamy ograniczenie.)
 *
 * Aktywne ograniczenie: y − x ≤ -1, czyli y ≤ x − 1.
 *   Minimum bez: (2, 1) — sprawdź: 1 − 2 = -1, czyli BARDZO blisko granicy.
 *   Z ograniczeniem y ≤ x − 1: minimum nieuzbrojone (2, 1) jest na granicy.
 *
 * Dla pokazu efektu: użyjmy y ≤ -0.5·x + 1.5
 *   Minimum bez: (2, 1) — sprawdź: 1 ≤ -1 + 1.5 = 0.5? NIE (1 > 0.5)
 *   Czyli niespełnione — minimum z ograniczeniem leży na granicy.
 *
 * Trzeba znaleźć: minimum f(x,y) = 0.5(x-2)² + 2(y-1)² podlegające
 *   y = -0.5x + 1.5 (równość).
 *   Wstawiamy: f(x) = 0.5(x-2)² + 2(-0.5x + 1.5 - 1)² = 0.5(x-2)² + 2(0.5 - 0.5x)²
 *           = 0.5(x-2)² + 0.5(1-x)²
 *   df/dx = (x-2) + (-(1-x)) = (x-2) + (x-1) = 2x - 3 = 0 → x = 1.5, y = 0.75
 *
 * Algorytm: projected gradient. W każdym kroku:
 *   1. Oblicz gradient g
 *   2. Jeśli ograniczenie aktywne (y > -0.5x + 1.5 - eps): rzutuj g na linię ograniczenia
 *   3. Krok: x ← x − α·g_proj
 *   4. Jeśli wyszliśmy poza dopuszczalny obszar — rzutuj z powrotem
 */

// Ograniczenie: y ≤ -0.5·x + 1.5  →  g(x, y) = y + 0.5x - 1.5 ≤ 0
function constraint(p: Pt2): number {
  return p.y + 0.5 * p.x - 1.5;
}
// Normalna do ograniczenia (gradient g) — kierunek wzrostu g
const CONSTRAINT_NORMAL: Pt2 = { x: 0.5, y: 1 };
const NORMAL_LEN = Math.hypot(CONSTRAINT_NORMAL.x, CONSTRAINT_NORMAL.y);

// Rzutowanie wektora v na styczną do ograniczenia (usuwamy składową wzdłuż normalnej)
function projectOnConstraint(v: Pt2): Pt2 {
  const dotN = (v.x * CONSTRAINT_NORMAL.x + v.y * CONSTRAINT_NORMAL.y) / (NORMAL_LEN * NORMAL_LEN);
  return {
    x: v.x - dotN * CONSTRAINT_NORMAL.x,
    y: v.y - dotN * CONSTRAINT_NORMAL.y,
  };
}

// Rzutowanie punktu na granicę ograniczenia (najbliższy punkt na linii)
function projectPointOnBoundary(p: Pt2): Pt2 {
  const gv = constraint(p);
  return {
    x: p.x - (gv * CONSTRAINT_NORMAL.x) / (NORMAL_LEN * NORMAL_LEN),
    y: p.y - (gv * CONSTRAINT_NORMAL.y) / (NORMAL_LEN * NORMAL_LEN),
  };
}

export function SQPVisualization() {
  const mounted = useMounted();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start: Pt2 = { x: -2, y: -2 };
  const ALPHA = 0.18;

  const history = useMemo(() => {
    const out: { p: Pt2; g: Pt2; gProj: Pt2 | null; cost: number; active: boolean }[] = [];
    let p = { ...start };
    for (let i = 0; i < 60; i++) {
      const g = grad(p);
      const cVal = constraint(p);
      const isActive = cVal > -0.05; // ograniczenie aktywne (na granicy lub blisko)
      const gProj = isActive ? projectOnConstraint(g) : null;
      const gUsed = gProj ?? g;
      out.push({ p: { ...p }, g, gProj, cost: cost(p), active: isActive });
      const gNorm = Math.hypot(gUsed.x, gUsed.y);
      if (gNorm < 0.01) break;
      let next: Pt2 = { x: p.x - ALPHA * gUsed.x, y: p.y - ALPHA * gUsed.y };
      // Jeśli wyszliśmy poza dopuszczalny obszar, projektujemy na granicę
      if (constraint(next) > 0) {
        next = projectPointOnBoundary(next);
      }
      p = next;
      if (Math.abs(p.x) > 10 || Math.abs(p.y) > 10) break;
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
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, maxStep]);

  const W = 560, H = 440;
  const pad = { l: 40, r: 24, t: 20, b: 36 };
  const proj = makeProjector(pad.l, pad.t, W - pad.l - pad.r, H - pad.t - pad.b);

  const current = history[step];
  const trail = history.slice(0, step + 1).map((h) => h.p);

  // Punkty granicy ograniczenia w obszarze widoku: y = -0.5x + 1.5
  const constraintLine = [
    { x: -3, y: -0.5 * -3 + 1.5 },
    { x: 5, y: -0.5 * 5 + 1.5 },
  ];

  // Konstrukcja zacieniowanego obszaru "niedozwolonego" (g > 0)
  // Zacieniujemy obszar nad linią
  const forbiddenPolygon = [
    { x: -3, y: -0.5 * -3 + 1.5 },
    { x: 5, y: -0.5 * 5 + 1.5 },
    { x: 5, y: 4 },
    { x: -3, y: 4 },
  ];

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
          {current?.active && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700">
              ograniczenie aktywne
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <OptimizationContourBackground width={W} height={H} pad={pad} />

          {/* Obszar niedopuszczalny — zacieniowany */}
          <polygon
            points={forbiddenPolygon.map((p) => `${proj.sx(p.x)},${proj.sy(p.y)}`).join(" ")}
            fill="#ef4444"
            opacity={0.10}
          />
          {/* Granica ograniczenia */}
          <line
            x1={proj.sx(constraintLine[0].x)} y1={proj.sy(constraintLine[0].y)}
            x2={proj.sx(constraintLine[1].x)} y2={proj.sy(constraintLine[1].y)}
            stroke="#ef4444" strokeWidth={2}
          />
          <text
            x={proj.sx(3)} y={proj.sy(0) - 6}
            fontSize={11} fontFamily="monospace" fill="#ef4444" fontWeight={600}
          >
            g(x,y) = y + 0.5x − 1.5 = 0
          </text>
          <text
            x={proj.sx(-1)} y={proj.sy(2.5)}
            fontSize={10} fontFamily="system-ui" fill="#ef4444" fontStyle="italic"
          >
            obszar niedopuszczalny (g &gt; 0)
          </text>

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
          {mounted && trail.slice(0, -1).map((p, i) => (
            <circle
              key={i}
              cx={proj.sx(p.x)}
              cy={proj.sy(p.y)}
              r={3}
              fill="#0ea5e9"
              opacity={0.5}
            />
          ))}

          {/* Aktualny punkt + strzałki */}
          {mounted && current && (
            <>
              <defs>
                <marker id="sqp-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                </marker>
                <marker id="sqp-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#0ea5e9" />
                </marker>
                <marker id="sqp-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#a855f7" />
                </marker>
              </defs>

              {/* Pełny gradient (czerwony, na zewnątrz obszaru = źle) */}
              {step < maxStep && (
                <line
                  x1={proj.sx(current.p.x)} y1={proj.sy(current.p.y)}
                  x2={proj.sx(current.p.x - ALPHA * current.g.x)}
                  y2={proj.sy(current.p.y - ALPHA * current.g.y)}
                  stroke="#ef4444" strokeWidth={1.6}
                  strokeDasharray={current.active ? "4 2" : undefined}
                  opacity={current.active ? 0.5 : 1}
                  markerEnd="url(#sqp-arr-red)"
                />
              )}

              {/* Rzutowany gradient (niebieski, kierunek faktyczny gdy aktywne) */}
              {step < maxStep && current.gProj && (
                <line
                  x1={proj.sx(current.p.x)} y1={proj.sy(current.p.y)}
                  x2={proj.sx(current.p.x - ALPHA * current.gProj.x)}
                  y2={proj.sy(current.p.y - ALPHA * current.gProj.y)}
                  stroke="#a855f7" strokeWidth={2.4}
                  markerEnd="url(#sqp-arr-purple)"
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
              {current.active && <span className="font-mono ml-2 text-amber-600">[ograniczenie aktywne]</span>}
            </p>
            <p className="text-[var(--muted)]">
              <span className="text-[#ef4444]">Czerwona strzałka</span> = pełny kierunek <code>−∇f</code> (jaki
              zrobiłby zwykły GD). Po napotkaniu czerwonej linii (granica ograniczenia){" "}
              <span className="text-[#a855f7]">fioletowa strzałka</span> = kierunek po{" "}
              <strong>rzutowaniu</strong> gradientu na styczną do ograniczenia. Tak właśnie
              SQP/projected gradient utrzymuje punkt w obszarze dopuszczalnym.
              Minimum z ograniczeniem: <code>(1.5, 0.75)</code>, leży na granicy (różne od
              minimum bez ograniczenia <code>(2, 1)</code>).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
