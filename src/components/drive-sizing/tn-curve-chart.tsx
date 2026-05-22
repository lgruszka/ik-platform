"use client";

import { useMemo, useState } from "react";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { PICK_AND_PLACE_SCENARIOS as SCENARIOS } from "@/lib/dynamics/pick-and-place-scenarios";
import { MOTOR_CATALOG } from "@/lib/drive-sizing/motor-catalog";
import { useMounted } from "@/lib/hooks";

/**
 * Wykres krzywej T-N (torque-speed) silnika z naniesionym punktem pracy
 * (ω(t), |τ(t)|) z trajektorii. Każda kropka = jeden moment czasu trajektorii.
 *
 * Obwiednia silnika ma dwie regiony:
 *  - continuous (zielony prostokąt) — można pracować dowolnie długo (termika OK)
 *  - intermittent / peak (pomarańczowy obszar wokół) — krótkotrwałe szczyty (ms)
 *  - poza obwiednią — silnik nie jest w stanie wytworzyć takiego momentu
 *
 * Wszystkie punkty muszą leżeć WEWNĄTRZ obwiedni — to wizualny test doboru.
 */
export function TnCurveChart() {
  const mounted = useMounted();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[1].id);
  const [payload, setPayload] = useState(2.0);
  const [chosenJoint, setChosenJoint] = useState(1);
  const [comboId, setComboId] = useState(MOTOR_CATALOG[1].id);

  const series = useMemo(() => {
    if (!mounted) return null;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
    const modInertia = ES5_INERTIA.map((l, i) =>
      i === 5 ? { ...l, m: l.m + payload } : l,
    );
    const N = 80; // ilość punktów na wykresie
    const points: { tau: number; qd: number }[] = [];
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const { q, qd, qdd } = scenario.trajectory(t);
      const r = solveInverseDynamics(ES5, modInertia, q, qd, qdd);
      points.push({ tau: Math.abs(r.torques[chosenJoint]), qd: Math.abs(qd[chosenJoint]) });
    }
    return points;
  }, [mounted, scenarioId, payload, chosenJoint]);

  const combo = MOTOR_CATALOG.find((c) => c.id === comboId)!;

  if (!mounted || !series) {
    return <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-6 text-xs text-[var(--muted)] text-center">…</div>;
  }

  // Skala
  const tauMax = Math.max(combo.tauPeak * 1.15, ...series.map((p) => p.tau)) * 1.05;
  const qdMax = Math.max(combo.qdMax * 1.15, ...series.map((p) => p.qd)) * 1.05;

  const W = 720, H = 380;
  const pad = { l: 60, r: 20, t: 20, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const r = (n: number) => Math.round(n * 100) / 100;
  const sx = (qd: number) => pad.l + (qd / qdMax) * plotW;
  const sy = (tau: number) => pad.t + (1 - tau / tauMax) * plotH;

  return (
    <div className="space-y-3 not-prose">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-[var(--muted)]">scenariusz</span>
          <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}
                  className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1 font-mono">
            {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label.slice(0, 28)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--muted)]">payload [kg]: {payload.toFixed(1)}</span>
          <input type="range" min={0} max={5} step={0.1} value={payload}
                 onChange={(e) => setPayload(parseFloat(e.target.value))} className="accent-[var(--accent)]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--muted)]">napęd</span>
          <select value={chosenJoint} onChange={(e) => setChosenJoint(parseInt(e.target.value))}
                  className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1 font-mono">
            {Array.from({ length: 6 }, (_, i) => <option key={i} value={i}>τ_{i + 1}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--muted)]">silnik+przekładnia</span>
          <select value={comboId} onChange={(e) => setComboId(e.target.value)}
                  className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1 font-mono">
            {MOTOR_CATALOG.map((c) => <option key={c.id} value={c.id}>{c.motor.slice(0, 24)}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-white overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Pole wykresu */}
          <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="#fafbfc" stroke="#e5e7eb" />

          {/* Peak region — od linii ukośnej (asymptota T-N) w dół do (0, τ_peak) */}
          {(() => {
            // Idealizowana krzywa T-N jako prosta: τ(ω) = τ_peak·(1 - ω/ω_max)
            // Punkty wieloboku peak region:
            const peakPath = `
              M ${r(sx(0))} ${r(sy(combo.tauPeak))}
              L ${r(sx(combo.qdMax))} ${r(sy(0))}
              L ${r(sx(0))} ${r(sy(0))}
              Z
            `;
            return <path d={peakPath} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={0.5} />;
          })()}

          {/* Continuous region — prostokąt (τ_cont × qd_max) wewnątrz peak region */}
          <rect
            x={pad.l}
            y={r(sy(combo.tauCont))}
            width={r(sx(combo.qdMax) - sx(0))}
            height={r(sy(0) - sy(combo.tauCont))}
            fill="#d1fae5"
            stroke="#10b981"
            strokeWidth={1.5}
            fillOpacity={0.7}
          />

          {/* Etykiety regionów */}
          <text x={r(sx(combo.qdMax / 2))} y={r(sy(combo.tauCont / 2))}
                textAnchor="middle" fontSize={11} fontFamily="monospace" fontWeight={600} fill="#047857">
            CONTINUOUS · ciągła
          </text>
          <text x={r(sx(combo.qdMax / 3))} y={r(sy(combo.tauCont + (combo.tauPeak - combo.tauCont) / 2))}
                textAnchor="middle" fontSize={10} fontFamily="monospace" fontWeight={600} fill="#92400e">
            PEAK · krótkotrwała
          </text>

          {/* Punkty pracy z trajektorii */}
          {series.map((p, i) => {
            const tauOk = p.tau <= combo.tauCont;
            const qdOk = p.qd <= combo.qdMax;
            // Czy punkt mieści się w continuous (zielony), peak (pomarańczowy) czy poza obwiednią (czerwony)?
            const inContinuous = tauOk && qdOk;
            // Sprawdź czy w peak region — linia T-N: τ ≤ τ_peak·(1 - qd/qd_max)
            const tnLimit = combo.tauPeak * (1 - p.qd / combo.qdMax);
            const inPeak = !inContinuous && p.tau <= tnLimit && qdOk;
            const color = inContinuous ? "#10b981" : inPeak ? "#f59e0b" : "#dc2626";
            return (
              <circle key={i} cx={r(sx(p.qd))} cy={r(sy(p.tau))} r={3.5}
                      fill={color} stroke="white" strokeWidth={1} />
            );
          })}

          {/* Osie */}
          <line x1={pad.l} y1={pad.t + plotH} x2={pad.l + plotW} y2={pad.t + plotH} stroke="#475569" strokeWidth={1.2} />
          <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="#475569" strokeWidth={1.2} />

          {/* Etykiety τ_cont, τ_peak */}
          <line x1={pad.l - 4} y1={r(sy(combo.tauCont))} x2={pad.l} y2={r(sy(combo.tauCont))} stroke="#10b981" strokeWidth={2} />
          <text x={pad.l - 8} y={r(sy(combo.tauCont)) + 3} textAnchor="end" fontSize={10} fontFamily="monospace" fill="#10b981" fontWeight={600}>
            τ_cont = {combo.tauCont}
          </text>
          <line x1={pad.l - 4} y1={r(sy(combo.tauPeak))} x2={pad.l} y2={r(sy(combo.tauPeak))} stroke="#f59e0b" strokeWidth={2} />
          <text x={pad.l - 8} y={r(sy(combo.tauPeak)) + 3} textAnchor="end" fontSize={10} fontFamily="monospace" fill="#f59e0b" fontWeight={600}>
            τ_peak = {combo.tauPeak}
          </text>

          {/* Etykiety qd_max */}
          <line x1={r(sx(combo.qdMax))} y1={pad.t + plotH} x2={r(sx(combo.qdMax))} y2={pad.t + plotH + 4} stroke="#f59e0b" strokeWidth={2} />
          <text x={r(sx(combo.qdMax))} y={pad.t + plotH + 16} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#f59e0b" fontWeight={600}>
            ω_max = {combo.qdMax.toFixed(2)}
          </text>

          {/* Tytuły osi */}
          <text x={pad.l + plotW / 2} y={H - 8} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#475569">
            prędkość po przekładni q̇ [rad/s]
          </text>
          <text transform={`rotate(-90 ${pad.l - 38} ${pad.t + plotH / 2})`}
                x={pad.l - 38} y={pad.t + plotH / 2} textAnchor="middle"
                fontSize={11} fontFamily="monospace" fill="#475569">
            moment po przekładni τ [Nm]
          </text>

          {/* Legenda */}
          <g transform={`translate(${pad.l + plotW - 145}, ${pad.t + 8})`}>
            <rect x={0} y={0} width={140} height={50} fill="white" stroke="#e5e7eb" rx={3} fillOpacity={0.95} />
            <circle cx={10} cy={12} r={3} fill="#10b981" />
            <text x={18} y={15} fontSize={10} fontFamily="monospace" fill="#0f172a">continuous OK</text>
            <circle cx={10} cy={26} r={3} fill="#f59e0b" />
            <text x={18} y={29} fontSize={10} fontFamily="monospace" fill="#0f172a">peak OK (krótko)</text>
            <circle cx={10} cy={40} r={3} fill="#dc2626" />
            <text x={18} y={43} fontSize={10} fontFamily="monospace" fill="#0f172a">poza obwiednią!</text>
          </g>
        </svg>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Każda kropka = jeden moment trajektorii. <strong>Zielona kropka</strong> = silnik
        może w tej chwili pracować bezterminowo. <strong>Pomarańczowa</strong> = OK krótko
        (ms-sekundy), ale ciągłe przebywanie tu przegrzeje uzwojenia. <strong>Czerwona</strong> =
        silnik nie jest w stanie wytworzyć tego momentu, trajektoria nie zostanie zrealizowana
        (kontroler wyzeruje błąd śledzenia, ale fizycznie wystąpi „cut-off"). Skuteczny dobór
        oznacza że <em>wszystkie</em> kropki są zielone albo żółte — i czas spędzony w żółtym
        regionie nie przekracza stałej czasowej termicznej silnika (zwykle ~30s dla małych BLDC).
      </p>
    </div>
  );
}
