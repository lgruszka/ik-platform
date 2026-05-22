"use client";

import { useMemo } from "react";
import { useEs5Store } from "@/lib/es5-store";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { solveInverseDynamics } from "@/lib/dynamics/newton-euler";
import { forwardKinematicsFrames } from "@/lib/robots/dh";
import { mat3mulVec3, dot3 } from "@/lib/math/vec3";
import { useMounted } from "@/lib/hooks";
import type { Vec3, Matrix4 } from "@/lib/types";

const G = 9.81;

/**
 * Panel pokazujący trzy wielkości energetyczne live:
 *   T  — energia kinetyczna manipulatora (suma po ogniwach: ½m·|v_C|² + ½ωᵀ·I_C·ω)
 *   V  — energia potencjalna grawitacji (suma po ogniwach: m·g·h_C)
 *   P  — moc mechaniczna wytwarzana przez napędy (∑τᵢ·q̇ᵢ)
 *
 * W rzeczywistej trajektorii powinno zachodzić P = dT/dt + dV/dt (bilans mocy).
 * Tu nie sprawdzamy tego live (bo q̇, q̈ są niezależne w playgroundzie),
 * ale wartości same w sobie pozwalają studentowi zobaczyć skale i intuicję.
 */
export function EnergyPanel() {
  const mounted = useMounted();
  const { joints, qDot, qDdot } = useEs5Store();

  const energy = useMemo(() => {
    if (!mounted) return null;

    // Pozycje środków mas w bazie (dla energii potencjalnej)
    const frames = forwardKinematicsFrames(ES5, joints);
    // frames[0] = base, frames[i+1] = T_0^i (po przegubie i, w układzie ogniwa i)
    // Pozycja środka masy ogniwa i: frames[i+1] · ⁱp_Ci
    const heights: number[] = [];
    const m: number[] = [];
    for (let i = 0; i < ES5_INERTIA.length; i++) {
      const Ti: Matrix4 = frames[i + 1];
      const pC = ES5_INERTIA[i].pCom;
      // Aplikuj transformację 4×4 do wektora 3D (z translacją). Macierze
      // są row-major: trzeci wiersz to składowa Z punktu po transformacji.
      const hz = Ti[2][0] * pC[0] + Ti[2][1] * pC[1] + Ti[2][2] * pC[2] + Ti[2][3];
      heights.push(hz);
      m.push(ES5_INERTIA[i].m);
    }
    const V = heights.reduce((sum, h, i) => sum + m[i] * G * h, 0);
    const totalMass = m.reduce((s, x) => s + x, 0);

    // Energia kinetyczna — z forward sweep wyciągamy v_C i ω dla każdego ogniwa
    const dyn = solveInverseDynamics(ES5, ES5_INERTIA, joints, qDot, qDdot);
    let T = 0;
    for (let i = 0; i < dyn.links.length; i++) {
      const link = dyn.links[i];
      const vC: Vec3 = link.vCom;
      const w: Vec3 = link.omega;
      const I = ES5_INERTIA[i].I;
      // ½ m·|v_C|²  (v_C w układzie lokalnym — norma się zachowuje przy rotacji)
      const linear = 0.5 * ES5_INERTIA[i].m * dot3(vC, vC);
      // ½ ωᵀ·I_C·ω  (oba w układzie lokalnym ogniwa)
      const Iw = mat3mulVec3(I, w);
      const angular = 0.5 * dot3(w, Iw);
      T += linear + angular;
    }

    const P = dyn.torques.reduce((sum, tau, i) => sum + tau * qDot[i], 0);

    return { T, V, P, totalMass, heights, m };
  }, [mounted, joints, qDot, qDdot]);

  if (!mounted || !energy) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 text-xs text-[var(--muted)] text-center">
        …obliczanie energii…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 font-mono text-xs space-y-2">
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1">
        <span className="text-[var(--muted)]">T (energia kinetyczna)</span>
        <span className="text-[var(--muted)] text-[10px] leading-snug self-center">
          ½·Σ m·|v_C|² + ½·Σ ωᵀ·I_C·ω
        </span>
        <span className="text-right tabular-nums" style={{ color: "var(--accent)" }}>
          {energy.T.toFixed(3)} J
        </span>

        <span className="text-[var(--muted)]">V (energia potencjalna)</span>
        <span className="text-[var(--muted)] text-[10px] leading-snug self-center">
          Σ mᵢ·g·hᵢ (h od poziomu bazy)
        </span>
        <span className="text-right tabular-nums" style={{ color: "var(--accent)" }}>
          {energy.V.toFixed(3)} J
        </span>

        <span className="text-[var(--muted)]">P (moc mechaniczna)</span>
        <span className="text-[var(--muted)] text-[10px] leading-snug self-center">
          Σ τᵢ·q̇ᵢ
        </span>
        <span
          className="text-right tabular-nums"
          style={{ color: energy.P >= 0 ? "var(--accent)" : "#9333ea" }}
        >
          {energy.P.toFixed(3)} W
        </span>
      </div>

      <p className="text-[10px] text-[var(--muted)] leading-snug mt-2 mb-0">
        <strong>Bilans mocy (sanity check):</strong> w rzeczywistej trajektorii zachodzi{" "}
        <span className="text-[var(--accent)]">P = dT/dt + dV/dt</span> (zasada zachowania
        energii dla układu konserwatywnego). W playgroundzie q̇ i q̈ są niezależne
        od q, więc nie da się tego sprawdzić punktowo — ale w module 10 (energia napędów)
        bilans jest weryfikowany dla całej trajektorii. <span className="text-[#9333ea]">P&lt;0</span>{" "}
        oznacza, że napędy <em>pochłaniają</em> moc (silnik jako prądnica) — zachodzi
        gdy ruch jest spowalniany przez grawitację.
      </p>
    </div>
  );
}
