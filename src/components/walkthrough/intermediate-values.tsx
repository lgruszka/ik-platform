"use client";

import { useMemo } from "react";
import { useTargetStore } from "@/lib/target-store";
import { solvePuma560Analytical } from "@/lib/solvers";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import { PUMA_A2, PUMA_A3, PUMA_D3, PUMA_D4 } from "@/lib/robots/puma560";
import { deg } from "@/lib/utils";

/**
 * Shows the intermediate quantities (ρ, K, L, β, M, N, …) the solver computes
 * for the current target pose. Chooses shoulder-right, elbow-up branch for
 * display; purely pedagogical.
 */
export function IntermediateValues() {
  const { target } = useTargetStore();

  const values = useMemo(() => {
    const R = extractRotation(target);
    const [px, py, pz] = extractPosition(target);
    const phi = Math.atan2(py, px);
    const rhoAbs = Math.sqrt(Math.max(0, px * px + py * py - PUMA_D3 * PUMA_D3));
    const rho = rhoAbs; // shoulder right
    const q1 = phi - Math.atan2(PUMA_D3, rho);

    const L = Math.sqrt(PUMA_A3 * PUMA_A3 + PUMA_D4 * PUMA_D4);
    const beta = Math.atan2(PUMA_D4, PUMA_A3);
    const K =
      (rho * rho + pz * pz - PUMA_A2 * PUMA_A2 - PUMA_A3 * PUMA_A3 - PUMA_D4 * PUMA_D4) /
      (2 * PUMA_A2);
    const disc = Math.max(0, L * L - K * K);
    const q3 = Math.atan2(Math.sqrt(disc), K) - beta;

    const c3 = Math.cos(q3), s3 = Math.sin(q3);
    const M = PUMA_A2 + PUMA_A3 * c3 - PUMA_D4 * s3;
    const N = PUMA_A3 * s3 + PUMA_D4 * c3;
    const denom = M * M + N * N;
    const q2 = Math.atan2(
      (-M * pz - N * rho) / denom,
      (M * rho - N * pz) / denom,
    );

    // For showing R04/R06 residuals, use the solver directly
    const sols = solvePuma560Analytical(target);
    const rightUp = sols.find(
      (s) => s.branch?.shoulder === "right" && s.branch?.elbow === "up" && s.branch?.wrist === "noflip",
    );

    return { px, py, pz, R, phi, rhoAbs, rho, q1, L, beta, K, disc, q3, M, N, q2, rightUp };
  }, [target]);

  const fmt = (x: number, d = 4) => x.toFixed(d).padStart(d + 4);

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 font-mono text-xs tabular-nums overflow-x-auto">
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        <span className="text-[var(--muted)]">φ = atan2(p_y, p_x)</span>
        <span>= {deg(values.phi).toFixed(3)}°</span>
        <span className="text-[var(--muted)]">ρ = √(p_x² + p_y² − d₃²)</span>
        <span>= {fmt(values.rhoAbs)} m</span>
        <span className="text-[var(--muted)]">q₁ = φ − atan2(d₃, ρ)</span>
        <span>= {deg(values.q1).toFixed(3)}°</span>
        <span className="text-[var(--muted)]">L = √(a₃² + d₄²)</span>
        <span>= {fmt(values.L)} m</span>
        <span className="text-[var(--muted)]">β = atan2(d₄, a₃)</span>
        <span>= {deg(values.beta).toFixed(3)}°</span>
        <span className="text-[var(--muted)]">K</span>
        <span>= {fmt(values.K)}</span>
        <span className="text-[var(--muted)]">L² − K² (elbow discriminant)</span>
        <span>
          = {fmt(values.disc)}{" "}
          {values.disc < 0 ? <span className="text-red-500">(nieosiągalne)</span> : null}
        </span>
        <span className="text-[var(--muted)]">q₃ (elbow up)</span>
        <span>= {deg(values.q3).toFixed(3)}°</span>
        <span className="text-[var(--muted)]">M = a₂ + a₃c₃ − d₄s₃</span>
        <span>= {fmt(values.M)}</span>
        <span className="text-[var(--muted)]">N = a₃s₃ + d₄c₃</span>
        <span>= {fmt(values.N)}</span>
        <span className="text-[var(--muted)]">q₂</span>
        <span>= {deg(values.q2).toFixed(3)}°</span>
        {values.rightUp && (
          <>
            <span className="text-[var(--muted)]">q₄, q₅, q₆ (z R₃⁶)</span>
            <span>
              = {deg(values.rightUp.joints[3]).toFixed(2)}°, {deg(values.rightUp.joints[4]).toFixed(2)}°, {deg(values.rightUp.joints[5]).toFixed(2)}°
            </span>
          </>
        )}
      </div>
    </div>
  );
}
