"use client";

import { useState } from "react";
import {
  EFFICIENCY_COEFFS, REFERENCE_SPEEDS, evalPolynomial,
  type EfficiencyGroup,
} from "@/lib/dynamics/efficiency-coefficients";

/**
 * Sprawność przekładni harmonicznych jako funkcja obciążenia momentu,
 * parametryzowana prędkością obrotową wału wejściowego silnika.
 *
 * Odtworzenie Rys. 6.4 z [Gruszka, dysertacja 2024] — krzywe dla 4 prędkości
 * referencyjnych (500, 1000, 2000, 3500 obr/min) plus możliwość wyboru grupy
 * przegubów (Tab. 6.4 dysertacji).
 */
export function EfficiencyChart() {
  const [group, setGroup] = useState<EfficiencyGroup>("joints123");

  const W = 720, H = 320;
  const pad = { l: 50, r: 20, t: 24, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  // x ∈ [10, 100] %
  const xMin = 10, xMax = 100;
  // y ∈ [0, 100] %  (typowo 20-80%)
  const yMin = 0, yMax = 100;

  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const r = (n: number) => Math.round(n * 100) / 100;

  const SPEED_COLORS: Record<typeof REFERENCE_SPEEDS[number], string> = {
    500: "#0b5ed7",
    1000: "#10b981",
    2000: "#f59e0b",
    3500: "#ef4444",
  };

  // Generujemy 50 punktów dla każdej krzywej
  const xPoints = Array.from({ length: 50 }, (_, k) => xMin + (k / 49) * (xMax - xMin));

  return (
    <div className="space-y-3 not-prose">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3 flex items-center gap-3 text-xs">
        <span className="text-[var(--muted)]">Grupa przegubów:</span>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value as EfficiencyGroup)}
          className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1 font-mono"
        >
          <option value="joints123">Przeguby 1, 3 (Tab. 6.4 b)</option>
          <option value="joint2">Przegub 2 (Tab. 6.4 c)</option>
          <option value="joints456">Przeguby 4, 5, 6 (Tab. 6.4 a)</option>
        </select>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="#fafbfc" stroke="#e5e7eb" />

          {/* Siatka */}
          {[20, 40, 60, 80].map((y) => (
            <line key={`gy${y}`} x1={pad.l} y1={r(sy(y))} x2={pad.l + plotW} y2={r(sy(y))} stroke="#e5e7eb" strokeWidth={0.6} strokeDasharray="3 3" />
          ))}
          {[20, 40, 60, 80].map((x) => (
            <line key={`gx${x}`} x1={r(sx(x))} y1={pad.t} x2={r(sx(x))} y2={pad.t + plotH} stroke="#e5e7eb" strokeWidth={0.6} strokeDasharray="3 3" />
          ))}

          {/* Etykiety osi y */}
          {[0, 20, 40, 60, 80, 100].map((y) => (
            <g key={`ly${y}`}>
              <line x1={pad.l - 4} y1={r(sy(y))} x2={pad.l} y2={r(sy(y))} stroke="#94a3b8" />
              <text x={pad.l - 6} y={r(sy(y)) + 3} fontSize={10} fontFamily="monospace" fill="#64748b" textAnchor="end">
                {y}
              </text>
            </g>
          ))}
          <text x={pad.l - 36} y={pad.t + 8} fontSize={10} fontFamily="monospace" fill="#475569">η [%]</text>

          {/* Etykiety osi x */}
          {[10, 30, 50, 70, 100].map((x) => (
            <g key={`lx${x}`}>
              <line x1={r(sx(x))} y1={pad.t + plotH} x2={r(sx(x))} y2={pad.t + plotH + 4} stroke="#94a3b8" />
              <text x={r(sx(x))} y={pad.t + plotH + 16} fontSize={10} fontFamily="monospace" fill="#64748b" textAnchor="middle">
                {x}
              </text>
            </g>
          ))}
          <text x={pad.l + plotW - 8} y={pad.t + plotH + 32} fontSize={10} fontFamily="monospace" fill="#475569" textAnchor="end">
            obciążenie momentu [%]
          </text>

          {/* Krzywe sprawności dla 4 prędkości */}
          {REFERENCE_SPEEDS.map((speed) => {
            const coeffs = EFFICIENCY_COEFFS[group][speed];
            const points = xPoints.map((x) => {
              const eta = evalPolynomial(coeffs, x);
              const etaClamped = Math.max(0, Math.min(100, eta));
              return `${r(sx(x))},${r(sy(etaClamped))}`;
            }).join(" ");
            return (
              <polyline
                key={speed}
                points={points}
                fill="none"
                stroke={SPEED_COLORS[speed]}
                strokeWidth={2}
              />
            );
          })}

          {/* Legenda */}
          <g transform={`translate(${pad.l + 14}, ${pad.t + 8})`}>
            <rect x={0} y={0} width={130} height={80} fill="white" stroke="#e5e7eb" rx={4} opacity={0.92} />
            <text x={8} y={14} fontSize={10} fontFamily="monospace" fill="#64748b" fontWeight={600}>Prędkość [obr/min]:</text>
            {REFERENCE_SPEEDS.map((speed, i) => (
              <g key={speed} transform={`translate(8, ${28 + i * 12})`}>
                <line x1={0} y1={0} x2={16} y2={0} stroke={SPEED_COLORS[speed]} strokeWidth={2.5} />
                <text x={22} y={3} fontSize={10} fontFamily="monospace" fill="#334155">
                  {speed}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Krzywe sprawności przekładni harmonicznej zgodnie z Rys. 6.4 [Gruszka, dysertacja 2024].
        <strong> Większe obciążenie → wyższa sprawność</strong> (przy małych obciążeniach
        dominują straty stałe — tarcie, prąd magnesujący). <strong>Wyższa prędkość →
        niższa sprawność</strong> (rosną straty cieplne).
        UWAGA: aproksymacja wielomianowa 5. stopnia jest wrażliwa na precyzję
        współczynników — przy ekstrapolacji poza zakres dopasowania (10–80% obciążenia)
        wartości mogą wybuchać.
      </p>
    </div>
  );
}
