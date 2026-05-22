"use client";

import { useMemo, useState } from "react";
import { useEs5Store } from "@/lib/es5-store";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { useMounted } from "@/lib/hooks";
import type { JointConfig } from "@/lib/types";

/**
 * Stacked bar chart pokazujący rozkład τ_i = τ_grav + τ_dyn dla 6 napędów ES5.
 *
 * Suwak `velocityScale` przemnaża cały wektor q̇ aktualnego stanu — pozwala
 * studentowi w czasie rzeczywistym zobaczyć jak rośnie udział dynamiki
 * względem statyki. Przy v=0 widać samą grawitację, przy v=3 (≈max prędkość
 * przemysłowa) wkład dynamiczny często dominuje nad grawitacyjnym dla
 * niektórych napędów.
 */
export function TorqueDecompositionChart() {
  const mounted = useMounted();
  const { joints, qDot, qDdot } = useEs5Store();
  const [velocityScale, setVelocityScale] = useState(1);

  const data = useMemo(() => {
    if (!mounted) return null;
    const scaledQDot = qDot.map((v) => v * velocityScale);
    const scaledQDdot = qDdot.map((v) => v * velocityScale * velocityScale); // ~q̈ rośnie z q̇²
    const full = solveInverseDynamics(ES5, ES5_INERTIA, joints, scaledQDot, scaledQDdot);
    const stat = solveInverseDynamics(
      ES5, ES5_INERTIA, joints,
      [0,0,0,0,0,0] as unknown as number[],
      [0,0,0,0,0,0] as unknown as number[],
    );
    return full.torques.map((t, i) => ({
      total: t,
      grav: stat.torques[i],
      dyn: t - stat.torques[i],
    }));
  }, [mounted, joints, qDot, qDdot, velocityScale]);

  if (!mounted || !data) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-6 text-xs text-[var(--muted)] text-center">
        …obliczanie rozkładu momentów…
      </div>
    );
  }

  // Skala wykresu — symetryczna wokół zera, do max|τ_total|
  const maxAbs = Math.max(0.1, ...data.map((d) => Math.abs(d.total)));
  const yScale = 110 / maxAbs; // pikseli na 1 Nm w jedną stronę

  const W = 540;
  const H = 280;
  const barWidth = 50;
  const barGap = 30;
  const totalBars = 6 * barWidth + 5 * barGap;
  const x0 = (W - totalBars) / 2;
  const baselineY = H / 2 + 10;

  const r = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 my-4 not-prose">
      <div className="flex items-center justify-between mb-3 gap-3">
        <p className="font-semibold text-sm">
          Rozkład τᵢ = τ_grawit + τ_dynam dla 6 napędów ES5
        </p>
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="vel-scale" className="text-[var(--muted)]">
            skala q̇:
          </label>
          <input
            id="vel-scale"
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={velocityScale}
            onChange={(e) => setVelocityScale(Number(e.target.value))}
            className="w-32"
          />
          <span className="font-mono tabular-nums w-10 text-right">
            {velocityScale.toFixed(1)}×
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-[var(--panel-border)] bg-white">
        {/* Linia bazowa (zero) */}
        <line x1={20} y1={baselineY} x2={W - 20} y2={baselineY}
              stroke="#94a3b8" strokeWidth={1.5} />
        <text x={16} y={baselineY + 4} textAnchor="end" fontSize={10} fontFamily="monospace" fill="#64748b">0</text>

        {/* Linie pomocnicze co 5 Nm */}
        {[-2, -1, 1, 2].map((mult) => {
          const val = mult * Math.ceil(maxAbs / 3);
          const y = baselineY - val * yScale;
          if (y < 10 || y > H - 10) return null;
          return (
            <g key={mult}>
              <line x1={20} y1={r(y)} x2={W - 20} y2={r(y)}
                    stroke="#e2e8f0" strokeWidth={1} strokeDasharray="2 3" />
              <text x={16} y={r(y) + 3} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#94a3b8">
                {val > 0 ? `+${val}` : val}
              </text>
            </g>
          );
        })}

        {/* Słupki — dla każdego ogniwa stacked: grav (czerwony) + dyn (niebieski) */}
        {data.map((d, i) => {
          const x = x0 + i * (barWidth + barGap);
          const gravH = Math.abs(d.grav) * yScale;
          const dynH = Math.abs(d.dyn) * yScale;
          const gravUp = d.grav >= 0;
          const dynUp = d.dyn >= 0;
          // Slupki narastają — grawitacja od baseline, dyn dalej w tym samym kierunku
          // ale gdy mają różne znaki — rysujemy każdy z osobna z baseline
          return (
            <g key={i}>
              {/* Grav */}
              <rect
                x={x}
                y={r(gravUp ? baselineY - gravH : baselineY)}
                width={barWidth}
                height={r(gravH)}
                fill="#fca5a5"
                stroke="#ef4444"
                strokeWidth={1}
              />
              {/* Dyn — kiedy ten sam znak: na top, kiedy inny: z baseline w przeciwną stronę */}
              {d.grav * d.dyn >= 0 ? (
                <rect
                  x={x}
                  y={r(gravUp ? baselineY - gravH - dynH : baselineY + gravH)}
                  width={barWidth}
                  height={r(dynH)}
                  fill="#93c5fd"
                  stroke="#3b82f6"
                  strokeWidth={1}
                />
              ) : (
                <rect
                  x={x}
                  y={r(dynUp ? baselineY - dynH : baselineY)}
                  width={barWidth}
                  height={r(dynH)}
                  fill="#93c5fd"
                  stroke="#3b82f6"
                  strokeWidth={1}
                />
              )}

              {/* Etykieta osi (numer napędu) */}
              <text x={r(x + barWidth / 2)} y={H - 18} textAnchor="middle"
                    fontSize={11} fontFamily="monospace" fontWeight={600} fill="#0f172a">
                τ_{i + 1}
              </text>
              {/* Wartość total nad/pod słupkiem */}
              <text
                x={r(x + barWidth / 2)}
                y={r(d.total >= 0 ? baselineY - Math.max(gravH, gravH + dynH) - 5 : baselineY + Math.max(gravH, gravH + dynH) + 12)}
                textAnchor="middle"
                fontSize={10}
                fontFamily="monospace"
                fontWeight={600}
                fill="#0f172a"
              >
                {d.total.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Tytuł osi Y */}
        <text x={10} y={20} fontSize={10} fontFamily="monospace" fill="#64748b">
          τ [Nm]
        </text>
      </svg>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: "#fca5a5", border: "1px solid #ef4444" }} />
          <span><strong>τ_grawit</strong> (statyka)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: "#93c5fd", border: "1px solid #3b82f6" }} />
          <span><strong>τ_dynam</strong> (bezwładność + Coriolisa)</span>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] mt-3 mb-0">
        Suwak <strong>skala q̇</strong> przemnaża cały aktualny wektor prędkości
        (i kwadratowo q̈, bo dla typowych trajektorii q̈ ∝ q̇²). Przy{" "}
        <strong>0×</strong> widzisz <em>czystą statykę</em> — same momenty grawitacyjne
        (τ₂ zwykle dominuje, dźwiga ramię). Przesuń w prawo: <em>wkład dynamiki</em>{" "}
        rośnie i przy ~3× zwykle przewyższa statykę w niektórych napędach. To jest
        powód, dla którego pomijanie modelu dynamiki w sterowniku daje akceptowalne
        wyniki tylko dla bardzo wolnych ruchów.
      </p>
    </div>
  );
}
