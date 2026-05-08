"use client";

import { useMemo } from "react";
import { useEs5Store } from "@/lib/es5-store";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { useMounted } from "@/lib/hooks";

/**
 * Tablica wartości τ_i wyliczonych z dynamiki odwrotnej dla aktualnego stanu
 * playgroundu ES5 (q, q̇, q̈ z `useEs5Store`). Aktualizowana automatycznie
 * przy każdej zmianie stanu.
 *
 * Pokazuje rozkład τ_i = τ_grawitacyjne + τ_dynamiczne — przez dwa
 * wywołania NE: jedno z aktualnym stanem, drugie z q̇=q̈=0 (sama statyka).
 */
export function TorqueDisplay() {
  const mounted = useMounted();
  const { joints, qDot, qDdot } = useEs5Store();

  const result = useMemo(() => {
    if (!mounted) return null;
    const full = solveInverseDynamics(ES5, ES5_INERTIA, joints, qDot, qDdot);
    const stat = solveInverseDynamics(ES5, ES5_INERTIA, joints, [0,0,0,0,0,0], [0,0,0,0,0,0]);
    return {
      full: full.torques,
      gravity: stat.torques,
      dyn: full.torques.map((t, i) => t - stat.torques[i]),
    };
  }, [mounted, joints, qDot, qDdot]);

  if (!mounted || !result) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 font-mono text-xs">
        <div className="text-[var(--muted)]">…wyznaczanie momentów napędowych…</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 font-mono text-xs space-y-1">
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr] gap-x-3 text-[var(--muted)] text-[10px] uppercase tracking-wider mb-1">
        <span>i</span>
        <span className="text-right">τᵢ całkowite [Nm]</span>
        <span className="text-right">τ_grawit. [Nm]</span>
        <span className="text-right">τ_dynam. [Nm]</span>
      </div>
      {result.full.map((tau, i) => (
        <div key={i} className="grid grid-cols-[3rem_1fr_1fr_1fr] gap-x-3">
          <span className="text-[var(--muted)]">τ_{i + 1}</span>
          <span className="text-right tabular-nums" style={{ color: "var(--accent)" }}>
            {tau.toFixed(3)}
          </span>
          <span className="text-right tabular-nums text-[var(--muted)]">
            {result.gravity[i].toFixed(3)}
          </span>
          <span className="text-right tabular-nums text-[var(--muted)]">
            {result.dyn[i].toFixed(3)}
          </span>
        </div>
      ))}
      <p className="text-[10px] text-[var(--muted)] mt-2 leading-tight">
        Rozkład: τᵢ = τ_grawit. + τ_dynam. (statyka + bezwładność/Coriolisa).
        Statyka liczona przez ponowny NE z q̇=q̈=0.
      </p>
    </div>
  );
}
