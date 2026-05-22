"use client";

import { useMemo, useState } from "react";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { PICK_AND_PLACE_SCENARIOS as SCENARIOS } from "@/lib/dynamics/pick-and-place-scenarios";
import { useMounted } from "@/lib/hooks";

/**
 * Cztery metryki konstrukcyjne napędu wyliczone z trajektorii (q,q̇,q̈) → τ(t).
 * Te liczby są dokładnie tym, co wpisuje się w pole "wymagania" przy zamówieniu
 * silnika+przekładni — krzyżuje się je z katalogiem (Maxon, Kollmorgen,
 * Harmonic Drive) szukając najmniejszego napędu spełniającego wszystkie 4.
 *
 *   τ_peak  = max |τᵢ(t)|                           — moment szczytowy
 *   τ_rms   = sqrt((1/T) ∫ τᵢ²(t) dt)               — moment ciągły (termika)
 *   q̇_peak  = max |q̇ᵢ(t)|                          — prędkość maksymalna
 *   P_peak  = max |τᵢ(t) · q̇ᵢ(t)|                   — moc szczytowa
 *
 * Komponent samodzielnie liczy trajektorię (nie korzysta z TorqueChart-state),
 * żeby student mógł porównać metryki dla różnych scenariuszy niezależnie
 * od tego, co aktualnie pokazuje wykres τ(t).
 */

type Metrics = {
  tauPeak: number;     // Nm
  tauRms: number;      // Nm
  qdPeak: number;      // rad/s
  pPeak: number;       // W
  pAvg: number;        // W (średnia po cyklu, dla energii)
  energy: number;      // J (∫|P|dt)
};

const SAFETY_FACTOR = 1.5;

const COLORS = ["#0ea5e9", "#10b981", "#f97316", "#a855f7", "#f59e0b", "#ef4444"];

export function DriveSizingMetrics() {
  const mounted = useMounted();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[1].id); // pick-place domyślnie
  const [payload, setPayload] = useState(2.0); // kg

  const result = useMemo(() => {
    if (!mounted) return null;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
    const N = 200; // gęstość próbkowania trajektorii — więcej niż TorqueChart, dla dokładnego RMS
    const dt = scenario.duration / N;

    const modInertia = ES5_INERTIA.map((l, i) =>
      i === 5 ? { ...l, m: l.m + payload } : l,
    );

    // Per napęd: zbieramy τ(t) i q̇(t)
    const tauSeries: number[][] = [[], [], [], [], [], []];
    const qdSeries: number[][] = [[], [], [], [], [], []];

    for (let k = 0; k < N; k++) {
      const tau = k / (N - 1);
      const { q, qd, qdd } = scenario.trajectory(tau);
      const r = solveInverseDynamics(ES5, modInertia, q, qd, qdd);
      r.torques.forEach((t, j) => {
        tauSeries[j].push(t);
        qdSeries[j].push(qd[j]);
      });
    }

    // Wylicz 4 metryki per napęd
    const metrics: Metrics[] = tauSeries.map((taus, j) => {
      const qds = qdSeries[j];
      let tauPeak = 0;
      let qdPeak = 0;
      let pPeak = 0;
      let tauSq = 0;
      let pSumAbs = 0;
      let energy = 0;
      for (let k = 0; k < taus.length; k++) {
        const t = Math.abs(taus[k]);
        const w = Math.abs(qds[k]);
        const p = Math.abs(taus[k] * qds[k]);
        if (t > tauPeak) tauPeak = t;
        if (w > qdPeak) qdPeak = w;
        if (p > pPeak) pPeak = p;
        tauSq += taus[k] * taus[k];
        pSumAbs += p;
        energy += p * dt; // ∫|P|dt (suma elektryczna, zwykle większa od pracy mechanicznej)
      }
      const tauRms = Math.sqrt(tauSq / taus.length);
      const pAvg = pSumAbs / taus.length;
      return { tauPeak, tauRms, qdPeak, pPeak, pAvg, energy };
    });

    return { metrics, duration: scenario.duration };
  }, [mounted, scenarioId, payload]);

  if (!mounted || !result) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-6 text-xs text-[var(--muted)] text-center">
        …obliczanie metryk doboru napędów…
      </div>
    );
  }

  // Wartości referencyjne — żeby paski miały sens wizualny
  const maxTauPeak = Math.max(...result.metrics.map((m) => m.tauPeak));
  const maxQdPeak = Math.max(...result.metrics.map((m) => m.qdPeak));
  const maxPPeak = Math.max(...result.metrics.map((m) => m.pPeak));

  // Który napęd jest „krytyczny" (najwyższe wykorzystanie)?
  const criticalIdx = result.metrics.reduce(
    (best, m, i, all) => (m.tauPeak > all[best].tauPeak ? i : best),
    0,
  );

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
                <option key={s.id} value={s.id}>{s.label} · {s.duration}s</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 ml-auto">
            <span className="text-[var(--muted)]">payload [kg]:</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={payload}
              onChange={(e) => setPayload(parseFloat(e.target.value))}
              className="w-32 accent-[var(--accent)]"
            />
            <span className="font-mono tabular-nums w-10 text-right">{payload.toFixed(1)}</span>
          </label>
        </div>
      </div>

      {/* Tabela 4 metryk per napęd */}
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--panel-border)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <th className="text-left px-3 py-2 w-12">napęd</th>
              <th className="text-right px-3 py-2" title="Moment szczytowy — max |τ(t)|. Decyduje o saturacji silnika i krzywej T-N.">
                τ_peak [Nm]
              </th>
              <th className="text-right px-3 py-2" title="Moment skuteczny (RMS) — sqrt((1/T)·∫τ²dt). Decyduje o termice silnika (I²R).">
                τ_rms [Nm]
              </th>
              <th className="text-right px-3 py-2" title="Prędkość kątowa maks. — max |q̇(t)|. Decyduje o przekładni (ω_silnika = q̇·n).">
                q̇_peak [rad/s]
              </th>
              <th className="text-right px-3 py-2" title="Moc szczytowa — max |τ·q̇|. Decyduje o driverze i zasilaczu.">
                P_peak [W]
              </th>
              <th className="text-right px-3 py-2" title="Energia cyklu — ∫|P|dt. Dla zasilania bateryjnego.">
                E_cyklu [J]
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
            {result.metrics.map((m, i) => {
              const isCritical = i === criticalIdx;
              return (
                <tr key={i} className={isCritical ? "bg-amber-50/60 dark:bg-amber-950/20" : ""}>
                  <td className="px-3 py-1.5">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: COLORS[i] }} />
                    τ_{i + 1}
                    {isCritical && <span className="ml-2 text-[9px] uppercase font-semibold text-amber-700 dark:text-amber-300">krytyczny</span>}
                  </td>
                  <td className="text-right px-3 py-1.5 tabular-nums">
                    <BarCell value={m.tauPeak} max={maxTauPeak} color="#ef4444" />
                    {m.tauPeak.toFixed(2)}
                  </td>
                  <td className="text-right px-3 py-1.5 tabular-nums text-[var(--muted)]">
                    {m.tauRms.toFixed(2)}
                  </td>
                  <td className="text-right px-3 py-1.5 tabular-nums">
                    <BarCell value={m.qdPeak} max={maxQdPeak} color="#0ea5e9" />
                    {m.qdPeak.toFixed(2)}
                  </td>
                  <td className="text-right px-3 py-1.5 tabular-nums">
                    <BarCell value={m.pPeak} max={maxPPeak} color="#a855f7" />
                    {m.pPeak.toFixed(1)}
                  </td>
                  <td className="text-right px-3 py-1.5 tabular-nums text-[var(--muted)]">
                    {m.energy.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Karta sugerowanych specyfikacji dla krytycznego napędu */}
      <SuggestedSpecs metrics={result.metrics[criticalIdx]} criticalIdx={criticalIdx} />

      <p className="text-xs text-[var(--muted)]">
        <strong>Jak to czytać:</strong> dla każdego napędu (wiersz) cztery liczby
        decydują o doborze silnika+przekładni z katalogu. Wiersz z żółtym tłem to{" "}
        <em>napęd krytyczny</em> — najwyższe wymagane <code>τ_peak</code>, zwykle
        dyktuje wybór całej rodziny napędów (resztę przeskalujemy w dół). Najedź
        na nagłówek kolumny żeby zobaczyć co dana metryka ogranicza w katalogu.
        Zmiana payloadu pokaże jak rośnie wymagana specyfikacja — kluczowe przy
        rozważaniu „czy ten silnik wytrzyma jak będziemy nosić cięższy chwytak".
      </p>
    </div>
  );
}

function BarCell({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / Math.max(max, 1e-6)) * 100);
  return (
    <span
      className="inline-block w-12 h-1.5 rounded-sm mr-2 align-middle"
      style={{
        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
      }}
    />
  );
}

function SuggestedSpecs({ metrics, criticalIdx }: { metrics: Metrics; criticalIdx: number }) {
  const reqTauPeak = metrics.tauPeak * SAFETY_FACTOR;
  const reqTauCont = metrics.tauRms * SAFETY_FACTOR;
  const reqQdMax = metrics.qdPeak * SAFETY_FACTOR;
  const reqPPeak = metrics.pPeak * SAFETY_FACTOR;

  return (
    <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm">
      <p className="font-semibold mb-2">
        Minimalna specyfikacja silnika+przekładni dla napędu krytycznego (τ_{criticalIdx + 1}){" "}
        <span className="font-normal text-xs text-[var(--muted)]">— z marginesem bezpieczeństwa {SAFETY_FACTOR}×</span>
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">τ_peak (po przekładni):</span>
          <span className="tabular-nums font-semibold">≥ {reqTauPeak.toFixed(1)} Nm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">τ_cont (po przekładni):</span>
          <span className="tabular-nums font-semibold">≥ {reqTauCont.toFixed(1)} Nm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">q̇_max (po przekładni):</span>
          <span className="tabular-nums font-semibold">≥ {reqQdMax.toFixed(2)} rad/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">P_peak (driver+PSU):</span>
          <span className="tabular-nums font-semibold">≥ {reqPPeak.toFixed(0)} W</span>
        </div>
      </div>
      <p className="text-xs text-[var(--muted)] mt-2 mb-0">
        Te liczby należy <em>krzyżować z katalogiem</em>: dla silnika obrotowego
        z planowaną przekładnią o przełożeniu <em>n</em>, wymagane parametry
        wejściowe na wał silnika to <code>τ_peak/n</code>, <code>τ_cont/n</code>,
        <code>q̇_max·n</code>. Pełny przykład z konkretnym modelem Maxon+Harmonic
        Drive — w <a href="/modules/11-drive-sizing" className="underline text-[var(--accent)]">module 11 (Dobór napędów)</a>.
      </p>
    </div>
  );
}
