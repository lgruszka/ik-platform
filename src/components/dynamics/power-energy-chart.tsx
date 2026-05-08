"use client";

import { useMemo, useState } from "react";
import { ES5, ES5_INERTIA, ES5_DRIVES } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { robotEnergy } from "@/lib/dynamics/motor-model";
import { useMounted } from "@/lib/hooks";
import type { JointConfig } from "@/lib/types";

/**
 * Wykres mocy chwilowej P(t) (suma 6 napędów) i skumulowanej energii E(t)
 * dla zadanej trajektorii.
 *
 * Pokazuje, jak różne profile prędkości wpływają na zużycie energii — kluczowe
 * dla optymalizacji cyklu transportowego (rozdz. 7-8 [Gruszka, dysertacja]).
 */

type Profile = {
  id: string;
  label: string;
  T: number; // czas trwania [s]
  describe: string;
};

const PROFILES: readonly Profile[] = [
  { id: "fast",     label: "Szybko (T = 1.0 s)",   T: 1.0, describe: "Agresywne przyspieszenia → wysokie τ_dyn → wysoka moc." },
  { id: "medium",   label: "Średnio (T = 2.0 s)",  T: 2.0, describe: "Kompromis między czasem a energią." },
  { id: "slow",     label: "Wolno (T = 4.0 s)",    T: 4.0, describe: "Niskie τ_dyn, ale dłuższe trzymanie pod grawitacją." },
  { id: "very-slow",label: "Bardzo wolno (T = 8.0 s)", T: 8.0, describe: "Dominuje energia statyczna grawitacyjna." },
];

/** Generator trajektorii: q₂ przesuwa się 0 → π/3 → 0 z profilem cosinusowym. */
function buildTrajectory(T: number, dt: number) {
  const N = Math.round(T / dt) + 1;
  const times: number[] = [];
  const qs: JointConfig[] = [];
  const qDots: number[][] = [];
  const qDdots: number[][] = [];

  for (let k = 0; k < N; k++) {
    const t = k * dt;
    times.push(t);
    const tau = t / T;
    const A = Math.PI / 3;
    // Cosine profile sym. wokół T/2: 0 → A → 0
    const cosArg = 2 * Math.PI * tau;
    const ang     = (A / 2) * (1 - Math.cos(cosArg));
    const angDot  = (A / 2) * Math.sin(cosArg) * (2 * Math.PI / T);
    const angDdot = (A / 2) * Math.cos(cosArg) * (2 * Math.PI / T) ** 2;
    qs.push([0, ang, 0, 0, 0, 0] as unknown as JointConfig);
    qDots.push([0, angDot, 0, 0, 0, 0]);
    qDdots.push([0, angDdot, 0, 0, 0, 0]);
  }
  return { times, qs, qDots, qDdots };
}

export function PowerEnergyChart() {
  const mounted = useMounted();
  const [profileId, setProfileId] = useState<string>(PROFILES[1].id);

  const data = useMemo(() => {
    if (!mounted) return null;
    const profile = PROFILES.find((p) => p.id === profileId)!;
    const { times, qs, qDots, qDdots } = buildTrajectory(profile.T, 0.02);

    // Obliczamy τ(t) dla każdego napędu
    const torquesPerJoint: number[][] = [[], [], [], [], [], []];
    const qDotsPerJoint: number[][] = [[], [], [], [], [], []];
    for (let k = 0; k < times.length; k++) {
      const r = solveInverseDynamics(ES5, ES5_INERTIA, qs[k], qDots[k], qDdots[k]);
      r.torques.forEach((t, j) => torquesPerJoint[j].push(t));
      qDots[k].forEach((qd, j) => qDotsPerJoint[j].push(qd));
    }

    // Liczymy moc chwilową i energię
    const energyResult = robotEnergy(ES5_DRIVES, times, torquesPerJoint, qDotsPerJoint);

    // Suma mocy wszystkich napędów w każdej chwili
    const totalPower = times.map((_, k) =>
      energyResult.perJoint.reduce((s, p) => s + p.power[k], 0),
    );

    // Skumulowana energia (trapezoidalna integracja całkowitej mocy)
    const cumEnergy: number[] = [0];
    for (let k = 1; k < times.length; k++) {
      const dt = times[k] - times[k - 1];
      cumEnergy.push(cumEnergy[k - 1] + 0.5 * (totalPower[k - 1] + totalPower[k]) * dt);
    }

    return {
      times, totalPower, cumEnergy,
      totalEnergy: energyResult.totalEnergy,
      duration: profile.T,
      describe: profile.describe,
    };
  }, [mounted, profileId]);

  const W = 720, H = 320;
  const pad = { l: 50, r: 60, t: 24, b: 36 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  let xMax = 1;
  let pMax = 100, eMax = 100;
  if (data) {
    xMax = data.times[data.times.length - 1];
    pMax = Math.max(...data.totalPower, 100) * 1.1;
    eMax = Math.max(...data.cumEnergy, 100) * 1.1;
  }

  const sx = (t: number) => pad.l + (t / xMax) * plotW;
  const syP = (p: number) => pad.t + (1 - p / pMax) * plotH;
  const syE = (e: number) => pad.t + (1 - e / eMax) * plotH;
  const r = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="space-y-3 not-prose">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3 flex items-center gap-3 flex-wrap text-xs">
        <span className="text-[var(--muted)]">Profil prędkości:</span>
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1 font-mono"
        >
          {PROFILES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {data && (
          <span className="ml-auto font-mono">
            Energia całkowita: <strong className="text-[var(--accent)]">{data.totalEnergy.toFixed(2)} J</strong>
          </span>
        )}
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="#fafbfc" stroke="#e5e7eb" />

          {/* Etykiety lewej osi (Power) */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const v = f * pMax;
            return (
              <g key={`lp${f}`}>
                <line x1={pad.l - 4} y1={r(syP(v))} x2={pad.l} y2={r(syP(v))} stroke="#f97316" />
                <text x={pad.l - 6} y={r(syP(v)) + 3} fontSize={10} fontFamily="monospace" fill="#f97316" textAnchor="end">
                  {v.toFixed(0)}
                </text>
              </g>
            );
          })}
          <text x={pad.l - 36} y={pad.t + 8} fontSize={10} fontFamily="monospace" fill="#f97316">P [W]</text>

          {/* Etykiety prawej osi (Energy) */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const v = f * eMax;
            return (
              <g key={`le${f}`}>
                <line x1={pad.l + plotW} y1={r(syE(v))} x2={pad.l + plotW + 4} y2={r(syE(v))} stroke="#10b981" />
                <text x={pad.l + plotW + 6} y={r(syE(v)) + 3} fontSize={10} fontFamily="monospace" fill="#10b981" textAnchor="start">
                  {v.toFixed(0)}
                </text>
              </g>
            );
          })}
          <text x={pad.l + plotW + 6} y={pad.t + 8} fontSize={10} fontFamily="monospace" fill="#10b981">E [J]</text>

          {/* Etykiety osi czasu */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={`tx${f}`}>
              <line x1={r(sx(f * xMax))} y1={pad.t + plotH} x2={r(sx(f * xMax))} y2={pad.t + plotH + 4} stroke="#94a3b8" />
              <text x={r(sx(f * xMax))} y={pad.t + plotH + 16} fontSize={10} fontFamily="monospace" fill="#64748b" textAnchor="middle">
                {(f * xMax).toFixed(2)}
              </text>
            </g>
          ))}
          <text x={pad.l + plotW - 8} y={pad.t + plotH + 30} fontSize={10} fontFamily="monospace" fill="#475569" textAnchor="end">
            t [s]
          </text>

          {data && (
            <>
              {/* Krzywa mocy */}
              <polyline
                points={data.times.map((t, k) => `${r(sx(t))},${r(syP(data.totalPower[k]))}`).join(" ")}
                fill="none"
                stroke="#f97316"
                strokeWidth={2}
              />
              {/* Krzywa energii */}
              <polyline
                points={data.times.map((t, k) => `${r(sx(t))},${r(syE(data.cumEnergy[k]))}`).join(" ")}
                fill="none"
                stroke="#10b981"
                strokeWidth={2}
              />
            </>
          )}

          {/* Legenda */}
          <g transform={`translate(${pad.l + 16}, ${pad.t + 12})`}>
            <rect x={0} y={0} width={150} height={50} fill="white" stroke="#e5e7eb" rx={4} opacity={0.92} />
            <g transform="translate(8, 16)">
              <line x1={0} y1={0} x2={20} y2={0} stroke="#f97316" strokeWidth={2.5} />
              <text x={26} y={3} fontSize={10} fontFamily="monospace" fill="#334155">Moc chwilowa P(t)</text>
            </g>
            <g transform="translate(8, 34)">
              <line x1={0} y1={0} x2={20} y2={0} stroke="#10b981" strokeWidth={2.5} />
              <text x={26} y={3} fontSize={10} fontFamily="monospace" fill="#334155">Energia E(t)</text>
            </g>
          </g>
        </svg>
      </div>

      {data && (
        <p className="text-xs text-[var(--muted)]">
          {data.describe} <strong>Wniosek pedagogiczny:</strong> energia nie jest monotoniczną
          funkcją czasu trajektorii — istnieje optymalne T, dla którego E(T) jest minimalne.
          Zbyt szybko: rosnące τ_dyn → kwadratowo z prędkością → wysokie i² → straty cieplne.
          Zbyt wolno: dłuższe trzymanie pod grawitacją → liniowy wzrost energii statycznej.
          Wyznaczanie tego optimum to temat rozdz. 7–8 dysertacji.
        </p>
      )}
    </div>
  );
}
