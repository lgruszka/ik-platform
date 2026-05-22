"use client";

import { useMemo, useState } from "react";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { PICK_AND_PLACE_SCENARIOS as SCENARIOS } from "@/lib/dynamics/pick-and-place-scenarios";
import { MOTOR_CATALOG } from "@/lib/drive-sizing/motor-catalog";
import { useMounted } from "@/lib/hooks";

/**
 * Interaktywny kalkulator doboru napędu — bierze (scenariusz × payload × wybór
 * silnika z katalogu) i pokazuje czy wybrany silnik mieści 4 metryki z
 * adekwatnym marginesem bezpieczeństwa.
 *
 * Każde z 4 wymagań (τ_peak, τ_cont, q̇_max, P_peak) dostaje kolorową
 * walidację: zielony = mieści z marginesem ≥1.5×, żółty = mieści ale <1.5×,
 * czerwony = nie mieści. Pokazujemy procent wykorzystania, żeby student
 * widział "ten silnik jest 2× za duży" / "ledwo się mieści".
 */

type ChosenJoint = number; // 0..5

const SAFETY_TARGET = 1.5;

export function DriveSizingCalculator() {
  const mounted = useMounted();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[1].id);
  const [payload, setPayload] = useState(2.0);
  const [chosenJoint, setChosenJoint] = useState<ChosenJoint>(1); // domyślnie τ_2 — najtrudniejszy
  const [comboId, setComboId] = useState(MOTOR_CATALOG[1].id); // EC-i 52 — typowy

  const metrics = useMemo(() => {
    if (!mounted) return null;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
    const N = 200;
    const modInertia = ES5_INERTIA.map((l, i) =>
      i === 5 ? { ...l, m: l.m + payload } : l,
    );
    const tauSeries: number[] = [];
    const qdSeries: number[] = [];
    for (let k = 0; k < N; k++) {
      const tau = k / (N - 1);
      const { q, qd, qdd } = scenario.trajectory(tau);
      const r = solveInverseDynamics(ES5, modInertia, q, qd, qdd);
      tauSeries.push(r.torques[chosenJoint]);
      qdSeries.push(qd[chosenJoint]);
    }
    let tauPeak = 0, qdPeak = 0, pPeak = 0, tauSq = 0;
    for (let k = 0; k < N; k++) {
      const t = Math.abs(tauSeries[k]);
      const w = Math.abs(qdSeries[k]);
      const p = Math.abs(tauSeries[k] * qdSeries[k]);
      if (t > tauPeak) tauPeak = t;
      if (w > qdPeak) qdPeak = w;
      if (p > pPeak) pPeak = p;
      tauSq += tauSeries[k] * tauSeries[k];
    }
    return {
      tauPeak,
      tauRms: Math.sqrt(tauSq / N),
      qdPeak,
      pPeak,
    };
  }, [mounted, scenarioId, payload, chosenJoint]);

  const combo = MOTOR_CATALOG.find((c) => c.id === comboId)!;

  if (!mounted || !metrics) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-6 text-xs text-[var(--muted)] text-center">
        …obliczanie kalkulatora doboru…
      </div>
    );
  }

  // Walidacja: dla każdej z 4 metryk policz margines = (capability/requirement)
  const checks = [
    {
      label: "τ_peak (moment szczytowy)",
      requirement: metrics.tauPeak,
      capability: combo.tauPeak,
      unit: "Nm",
    },
    {
      label: "τ_cont (moment ciągły / termika)",
      requirement: metrics.tauRms,
      capability: combo.tauCont,
      unit: "Nm",
    },
    {
      label: "q̇_max (prędkość po przekładni)",
      requirement: metrics.qdPeak,
      capability: combo.qdMax,
      unit: "rad/s",
    },
    {
      label: "P_peak (moc szczytowa)",
      requirement: metrics.pPeak,
      capability: combo.power,
      unit: "W",
    },
  ];

  const allPass = checks.every((c) => c.capability >= c.requirement * SAFETY_TARGET);
  const anyFail = checks.some((c) => c.capability < c.requirement);

  // Procent wykorzystania dla wizualizacji
  const utilizationPct = (c: typeof checks[number]) =>
    Math.min(150, (c.requirement / c.capability) * 100);

  const verdict = anyFail
    ? { color: "#dc2626", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-500", icon: "✗", text: "Niedopasowane — wybierz większy napęd lub przeprojektuj trajektorię" }
    : allPass
    ? { color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-500", icon: "✓", text: `Dobry wybór — wszystkie 4 metryki mieszczą z marginesem ≥${SAFETY_TARGET}×` }
    : { color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-500", icon: "!", text: `Akceptowalne — mieści, ale margines <${SAFETY_TARGET}× w niektórych metrykach (ryzyko przy zmiennej obciążenia/temperaturze)` };

  return (
    <div className="space-y-4 not-prose">
      {/* Konfiguracja zadania */}
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <p className="text-sm font-semibold mb-3">Zdefiniuj zadanie projektowe</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)]">Trajektoria reprezentatywna</span>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1.5 font-mono"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>{s.label} · {s.duration}s</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)]">Payload [kg]</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={payload}
                onChange={(e) => setPayload(parseFloat(e.target.value))}
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="font-mono tabular-nums w-10 text-right">{payload.toFixed(1)}</span>
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)]">Napęd do oszacowania</span>
            <select
              value={chosenJoint}
              onChange={(e) => setChosenJoint(parseInt(e.target.value))}
              className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1.5 font-mono"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <option key={i} value={i}>napęd τ_{i + 1}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Wymagania z dynamiki */}
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] p-3 font-mono text-xs">
        <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
          Wymagania z dynamiki (z NE dla wybranej trajektorii i payloadu)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-[var(--muted)] text-[10px]">τ_peak</p>
            <p className="text-base font-semibold tabular-nums">{metrics.tauPeak.toFixed(2)} Nm</p>
          </div>
          <div>
            <p className="text-[var(--muted)] text-[10px]">τ_rms</p>
            <p className="text-base font-semibold tabular-nums">{metrics.tauRms.toFixed(2)} Nm</p>
          </div>
          <div>
            <p className="text-[var(--muted)] text-[10px]">q̇_peak</p>
            <p className="text-base font-semibold tabular-nums">{metrics.qdPeak.toFixed(2)} rad/s</p>
          </div>
          <div>
            <p className="text-[var(--muted)] text-[10px]">P_peak</p>
            <p className="text-base font-semibold tabular-nums">{metrics.pPeak.toFixed(1)} W</p>
          </div>
        </div>
      </div>

      {/* Wybór napędu z katalogu */}
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-sm font-semibold">Wybierz silnik+przekładnię z katalogu</p>
          <select
            value={comboId}
            onChange={(e) => setComboId(e.target.value)}
            className="bg-[var(--code-bg)] border border-[var(--panel-border)] rounded px-2 py-1.5 font-mono text-xs"
          >
            {MOTOR_CATALOG.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.sizeClass}] {c.motor} + {c.gearbox}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded bg-[var(--code-bg)] px-3 py-2 text-xs font-mono mb-3 text-[var(--muted)]">
          {combo.notes}
          <span className="block mt-1">
            Cena: ~{combo.priceEur} EUR · masa zespołu: {combo.mass} kg · przełożenie: {combo.reduction}:1
          </span>
        </div>

        {/* Walidacja 4 metryk */}
        <div className="space-y-2">
          {checks.map((c) => {
            const utilPct = utilizationPct(c);
            const margin = c.capability / Math.max(c.requirement, 1e-6);
            const pass = c.capability >= c.requirement;
            const passWithMargin = c.capability >= c.requirement * SAFETY_TARGET;
            const barColor = !pass ? "#dc2626" : !passWithMargin ? "#f59e0b" : "#10b981";
            const icon = !pass ? "✗" : !passWithMargin ? "!" : "✓";
            return (
              <div key={c.label} className="rounded border border-[var(--panel-border)] px-3 py-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[11px] font-bold"
                      style={{ backgroundColor: barColor }}
                    >
                      {icon}
                    </span>
                    <span className="font-semibold">{c.label}</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    <span className="text-[var(--muted)]">wymaga </span>
                    <span className="font-semibold">{c.requirement.toFixed(2)}</span>
                    <span className="text-[var(--muted)]"> / dostępne </span>
                    <span className="font-semibold">{c.capability.toFixed(1)}</span>
                    <span className="text-[var(--muted)]"> {c.unit}</span>
                  </span>
                </div>
                {/* Pasek wykorzystania */}
                <div className="relative h-2 bg-[var(--code-bg)] rounded-sm overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-sm"
                    style={{ width: `${Math.min(100, utilPct)}%`, backgroundColor: barColor }}
                  />
                  {/* Marker progu 1/1.5× (czyli 67% — tu jest "mieści z marginesem") */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-[var(--foreground)]/30"
                    style={{ left: `${100 / SAFETY_TARGET}%` }}
                    title={`Próg marginesu ${SAFETY_TARGET}×`}
                  />
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-1">
                  Wykorzystanie: {utilPct.toFixed(0)}% (margines {margin.toFixed(2)}×)
                  {utilPct > 100 && <span className="text-red-600 font-semibold ml-2">— przekroczenie!</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* Werdykt */}
        <div className={`mt-3 rounded-lg border-l-4 ${verdict.border} ${verdict.bg} px-4 py-3 text-sm`}>
          <p className="font-semibold flex items-center gap-2" style={{ color: verdict.color }}>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white" style={{ backgroundColor: verdict.color }}>
              {verdict.icon}
            </span>
            {verdict.text}
          </p>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">
        <strong>Eksperymentuj:</strong> zacznij od scenariusza <em>pick-place</em>,
        payloadu 2 kg, napędu τ_2. Sprawdź który z 6 silników w katalogu daje
        zielony werdykt — i czy zwiększenie payloadu do 5 kg „przewraca" wybór.
        Przełącz na scenariusz <em>aggressive</em> (0.8s) — zobaczysz że napędy
        klasy S (nadgarstek) wcześniej brakuje mocy niż momentu (P_peak czerwony,
        τ_peak żółty). To realna pułapka projektowa — dobiera się silnik wg
        momentu, a w trakcie testów okazuje się że ogranicza moc.
      </p>
    </div>
  );
}
