"use client";

import { useMemo, useState } from "react";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { PICK_AND_PLACE_SCENARIOS as SCENARIOS } from "@/lib/dynamics/pick-and-place-scenarios";
import { useMounted } from "@/lib/hooks";

/**
 * Wykres τ_i(t) dla 6 napędów ES5 dla zadanej trajektorii pick-and-place.
 *
 * Trajektoria: ruch sinusoidalny dwóch wybranych przegubów po ścieżce
 * "podnieś-przemieść-odłóż". Można wybrać scenariusz z dropdown-a.
 */

const COLORS = ["#0ea5e9", "#10b981", "#f97316", "#a855f7", "#f59e0b", "#ef4444"];

export function TorqueChart() {
  const mounted = useMounted();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[1].id);
  const [extraMass, setExtraMass] = useState(0); // dodatkowa masa chwytaka [kg]

  const data = useMemo(() => {
    if (!mounted) return null;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
    const N = 100;
    const taus = Array.from({ length: N }, (_, k) => k / (N - 1));

    // Modyfikujemy ostatnie ogniwo o dodaną masę
    const modInertia = ES5_INERTIA.map((l, i) =>
      i === 5 ? { ...l, m: l.m + extraMass } : l,
    );

    const torques: number[][] = [[], [], [], [], [], []];
    for (const tau of taus) {
      const { q, qd, qdd } = scenario.trajectory(tau);
      const result = solveInverseDynamics(ES5, modInertia, q, qd, qdd);
      result.torques.forEach((t, j) => torques[j].push(t));
    }

    return { taus, torques };
  }, [mounted, scenarioId, extraMass]);

  // Skala
  const W = 720, H = 320;
  const pad = { l: 50, r: 20, t: 20, b: 36 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  let yMin = -50, yMax = 50;
  if (data) {
    const allValues = data.torques.flat();
    yMin = Math.min(...allValues, -10);
    yMax = Math.max(...allValues, 10);
    const margin = (yMax - yMin) * 0.1;
    yMin -= margin;
    yMax += margin;
  }

  const sx = (tau: number) => pad.l + tau * plotW;
  const sy = (val: number) => pad.t + (1 - (val - yMin) / (yMax - yMin)) * plotH;

  // Zaokrąglenia żeby uniknąć hydration mismatchu
  const r = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="space-y-3 not-prose">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3 space-y-2">
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">scenariusz:</span>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1 font-mono"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 ml-auto">
            <span className="text-[var(--muted)]">masa chwytaka [kg]:</span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={extraMass}
              onChange={(e) => setExtraMass(parseFloat(e.target.value))}
              className="w-32 accent-[var(--accent)]"
            />
            <span className="font-mono tabular-nums w-10 text-right">{extraMass.toFixed(1)}</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Tło */}
          <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="#fafbfc" stroke="#e5e7eb" />

          {/* Linia τ = 0 */}
          {yMin < 0 && yMax > 0 && (
            <line
              x1={pad.l}
              y1={r(sy(0))}
              x2={pad.l + plotW}
              y2={r(sy(0))}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}

          {/* Etykiety osi y (5 znaczników) */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const v = yMin + f * (yMax - yMin);
            return (
              <g key={f}>
                <line x1={pad.l - 4} y1={r(sy(v))} x2={pad.l} y2={r(sy(v))} stroke="#94a3b8" />
                <text x={pad.l - 6} y={r(sy(v)) + 3} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="end">
                  {v.toFixed(0)}
                </text>
              </g>
            );
          })}
          <text x={pad.l - 36} y={pad.t + 8} fontSize={10} fontFamily="monospace" fill="#475569">τ [Nm]</text>

          {/* Etykiety osi x */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={r(sx(f))} y1={pad.t + plotH} x2={r(sx(f))} y2={pad.t + plotH + 4} stroke="#94a3b8" />
              <text x={r(sx(f))} y={pad.t + plotH + 16} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="middle">
                {(f * 100).toFixed(0)}%
              </text>
            </g>
          ))}
          <text x={pad.l + plotW - 8} y={pad.t + plotH + 30} fontSize={10} fontFamily="monospace" fill="#475569" textAnchor="end">
            t [%T]
          </text>

          {/* Krzywe */}
          {data && data.torques.map((series, j) => {
            const points = series
              .map((t, k) => `${r(sx(data.taus[k]))},${r(sy(t))}`)
              .join(" ");
            return (
              <polyline
                key={j}
                points={points}
                fill="none"
                stroke={COLORS[j]}
                strokeWidth={1.8}
              />
            );
          })}

          {/* Legenda */}
          <g transform={`translate(${pad.l + plotW - 110}, ${pad.t + 8})`}>
            <rect x={0} y={0} width={104} height={104} fill="white" stroke="#e5e7eb" rx={4} />
            {COLORS.map((c, j) => (
              <g key={j} transform={`translate(8, ${12 + j * 14})`}>
                <line x1={0} y1={0} x2={14} y2={0} stroke={c} strokeWidth={2} />
                <text x={20} y={3} fontSize={10} fontFamily="monospace" fill="#334155">τ_{j + 1}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Zauważ: τ₂ (zielony) zwykle dominuje — to przegub trzymający masę całego ramienia plus
        przedramienia plus narzędzia. Przy ruchu tylko q₂ wszystkie pozostałe momenty są małe
        (utrzymują geometrię nadgarstka). Masa chwytaka liniowo skaluje moment grawitacyjny.
      </p>
    </div>
  );
}
