"use client";

import { useMemo } from "react";
import { useEs5Store } from "@/lib/es5-store";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { forwardKinematicsFrames } from "@/lib/robots/dh";
import { useMounted } from "@/lib/hooks";
import type { JointConfig } from "@/lib/types";

const G = 9.81;

/**
 * Energia potencjalna całego manipulatora (suma m_i·g·h_Ci) — używana do
 * niezależnego sanity-check dla τ_grav z NE: τᵢ_grav = ∂V/∂qᵢ.
 */
function potentialEnergy(joints: JointConfig): number {
  const frames = forwardKinematicsFrames(ES5, joints);
  let V = 0;
  for (let i = 0; i < ES5_INERTIA.length; i++) {
    const Ti = frames[i + 1];
    const pC = ES5_INERTIA[i].pCom;
    const hz = Ti[2][0] * pC[0] + Ti[2][1] * pC[1] + Ti[2][2] * pC[2] + Ti[2][3];
    V += ES5_INERTIA[i].m * G * hz;
  }
  return V;
}

/** Gradient energii potencjalnej przez centralne różnice. */
function gradV(joints: JointConfig): number[] {
  const h = 1e-5;
  const grad: number[] = [];
  for (let i = 0; i < 6; i++) {
    const qp = [...joints] as number[];
    const qm = [...joints] as number[];
    qp[i] += h;
    qm[i] -= h;
    const dV = potentialEnergy(qp as unknown as JointConfig)
             - potentialEnergy(qm as unknown as JointConfig);
    grad.push(dV / (2 * h));
  }
  return grad;
}

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
    const gradV_q = gradV(joints);
    return {
      full: full.torques,
      gravity: stat.torques,
      dyn: full.torques.map((t, i) => t - stat.torques[i]),
      dVdq: gradV_q,
    };
  }, [mounted, joints, qDot, qDdot]);

  if (!mounted || !result) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 font-mono text-xs">
        <div className="text-[var(--muted)]">…wyznaczanie momentów napędowych…</div>
      </div>
    );
  }

  // Sanity check: czy τ_grav z NE zgadza się z gradientem energii potencjalnej?
  // Dla statyki zachodzi τᵢ_grav = ∂V/∂qᵢ. Liczona maksymalna różnica względem
  // wartości — jeśli > 1e-3 to coś jest nie tak z implementacją NE.
  const maxResidual = Math.max(
    ...result.gravity.map((t, i) => Math.abs(t - result.dVdq[i])),
  );

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 font-mono text-xs space-y-1">
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr] gap-x-3 text-[var(--muted)] text-[10px] uppercase tracking-wider mb-1">
        <span>i</span>
        <span className="text-right">τᵢ całkowite [Nm]</span>
        <span className="text-right">τ_grawit. [Nm]</span>
        <span className="text-right">τ_dynam. [Nm]</span>
        <span className="text-right" title="Niezależne wyliczenie τ_grav z gradientu energii potencjalnej">∂V/∂qᵢ [Nm]</span>
      </div>
      {result.full.map((tau, i) => (
        <div key={i} className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr] gap-x-3">
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
          <span className="text-right tabular-nums text-[var(--muted)]">
            {result.dVdq[i].toFixed(3)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--panel-border)]">
        <p className="text-[10px] text-[var(--muted)] leading-tight">
          Rozkład: τᵢ = τ_grawit. + τ_dynam. Ostatnia kolumna to <em>niezależne</em>{" "}
          wyliczenie τ_grawit z gradientu energii potencjalnej V(q) przez centralne różnice —
          dla statycznej dynamiki musi się zgadzać z τ_grawit z NE.
        </p>
        <span
          className={`text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded ${
            maxResidual < 1e-3
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          }`}
          title="Maksymalna różnica |τ_grav - ∂V/∂q| po wszystkich napędach"
        >
          ✓ max |Δ| = {maxResidual.toExponential(1)} Nm
        </span>
      </div>
    </div>
  );
}
