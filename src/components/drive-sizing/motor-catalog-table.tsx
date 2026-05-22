"use client";

import { useMemo } from "react";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { PICK_AND_PLACE_SCENARIOS } from "@/lib/dynamics/pick-and-place-scenarios";
import { MOTOR_CATALOG, SIZE_CLASS_LABEL } from "@/lib/drive-sizing/motor-catalog";
import { useMounted } from "@/lib/hooks";

/**
 * Tabela 6 modeli silnik+przekładnia z parametrami i automatyczną sugestią
 * dla których napędów ES5 dany model się wpasowuje (na podstawie scenariusza
 * "pick-place" + payload 2 kg + marginesu 1.5×).
 *
 * Pokazuje, że dobór nie jest „jeden silnik dla całego robota" tylko zwykle
 * 2–3 różne klasy: małe dla nadgarstka, średnie dla łokcia, duże dla barku.
 */

const SAFETY = 1.5;
const REFERENCE_PAYLOAD = 2.0; // kg

export function MotorCatalogTable() {
  const mounted = useMounted();

  // Wyliczamy "wymagania" τ_peak, τ_rms, q̇_peak per napęd dla referencyjnego scenariusza
  const requirements = useMemo(() => {
    if (!mounted) return null;
    const scenario = PICK_AND_PLACE_SCENARIOS.find((s) => s.id === "pick-place")!;
    const modInertia = ES5_INERTIA.map((l, i) =>
      i === 5 ? { ...l, m: l.m + REFERENCE_PAYLOAD } : l,
    );
    const N = 150;
    const tauArr: number[][] = [[], [], [], [], [], []];
    const qdArr: number[][] = [[], [], [], [], [], []];
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const { q, qd, qdd } = scenario.trajectory(t);
      const r = solveInverseDynamics(ES5, modInertia, q, qd, qdd);
      r.torques.forEach((t, j) => { tauArr[j].push(Math.abs(t)); });
      qd.forEach((w, j) => { qdArr[j].push(Math.abs(w)); });
    }
    return tauArr.map((ts, j) => {
      const qds = qdArr[j];
      return {
        joint: j,
        tauPeak: Math.max(...ts),
        tauRms: Math.sqrt(ts.reduce((s, t) => s + t * t, 0) / ts.length),
        qdPeak: Math.max(...qds),
      };
    });
  }, [mounted]);

  if (!mounted || !requirements) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-6 text-xs text-[var(--muted)] text-center">
        …obliczanie dopasowań…
      </div>
    );
  }

  // Dla każdej kombinacji znajdź napędy ES5 które mieszczą wszystkie 3 wymagania z marginesem
  const fitsForCombo = MOTOR_CATALOG.map((combo) => {
    const fits = requirements
      .map((req) => {
        const tauPeakOk = combo.tauPeak >= req.tauPeak * SAFETY;
        const tauContOk = combo.tauCont >= req.tauRms * SAFETY;
        const qdOk = combo.qdMax >= req.qdPeak * SAFETY;
        return tauPeakOk && tauContOk && qdOk ? req.joint + 1 : null;
      })
      .filter((x): x is number => x !== null);
    return { comboId: combo.id, fits };
  });

  return (
    <div className="space-y-3 not-prose">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--panel-border)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <th className="text-left px-3 py-2">silnik + przekładnia</th>
              <th className="text-left px-3 py-2">klasa</th>
              <th className="text-right px-3 py-2">τ_cont</th>
              <th className="text-right px-3 py-2">τ_peak</th>
              <th className="text-right px-3 py-2">q̇_max</th>
              <th className="text-right px-3 py-2">P_nom</th>
              <th className="text-right px-3 py-2">cena</th>
              <th className="text-left px-3 py-2">pasuje do τ_i (ES5)</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
            {MOTOR_CATALOG.map((c, i) => {
              const fits = fitsForCombo[i].fits;
              return (
                <tr key={c.id}>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-[var(--foreground)]">{c.motor}</div>
                    <div className="text-[10px] text-[var(--muted)]">+ {c.gearbox} ({c.reduction}:1)</div>
                  </td>
                  <td className="px-3 py-2 text-[var(--muted)]">{SIZE_CLASS_LABEL[c.sizeClass]}</td>
                  <td className="text-right px-3 py-2 tabular-nums">{c.tauCont} Nm</td>
                  <td className="text-right px-3 py-2 tabular-nums">{c.tauPeak} Nm</td>
                  <td className="text-right px-3 py-2 tabular-nums">{c.qdMax.toFixed(2)}</td>
                  <td className="text-right px-3 py-2 tabular-nums">{c.power} W</td>
                  <td className="text-right px-3 py-2 tabular-nums text-[var(--muted)]">{c.priceEur} €</td>
                  <td className="px-3 py-2">
                    {fits.length === 0 ? (
                      <span className="text-red-600 dark:text-red-400 font-semibold">— żaden</span>
                    ) : (
                      <span className="font-semibold">
                        {fits.map((f) => `τ_${f}`).join(", ")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--muted)]">
        <strong>Kolumna „pasuje do τ_i":</strong> dla referencyjnego scenariusza
        pick-and-place z payloadem 2 kg, lista napędów ES5 (numer τ_1…τ_6), dla
        których ten model mieści wszystkie 3 wymagania (τ_peak, τ_rms, q̇_peak) z
        marginesem ≥{SAFETY}×. Zwróć uwagę: małe silniki <em>(klasa S)</em> nie
        mieszczą się dla osi 1–2 (za małe momenty), a duże <em>(klasa L)</em>
        są overkillem dla nadgarstka (drogie, ciężkie — dorzucają własną masę
        do końcówki, co rekursywnie zwiększa wymagania dla osi pod nimi).
        Klasyczne rozwiązanie cobota: <strong>3 różne klasy</strong> — L dla osi 1+2,
        M dla 3+4, S dla 5+6.
      </p>
    </div>
  );
}
