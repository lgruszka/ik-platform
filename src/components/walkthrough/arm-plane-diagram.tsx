"use client";

import { useMemo } from "react";
import { useTargetStore } from "@/lib/target-store";
import { PUMA_A2, PUMA_A3, PUMA_D4, PUMA_D3 } from "@/lib/robots/puma560";
import { solvePuma560Analytical } from "@/lib/solvers";
import { extractPosition } from "@/lib/math/matrix";
import { deg } from "@/lib/utils";

/**
 * Widok 2D planarnego podproblemu 2R w płaszczyźnie ramienia (ρ, z).
 * ρ to promień radialny liczony w obróconym układzie bazy; z — wysokość
 * względem osi obrotu przegubu 1. Rysujemy bark (początek układu {2}),
 * pozycję środka nadgarstka oraz obie gałęzie łokcia (up / down).
 */
export function ArmPlaneDiagram() {
  const { target } = useTargetStore();
  const solutions = useMemo(() => solvePuma560Analytical(target), [target]);

  const [px, py, pz] = extractPosition(target);
  const rhoAbs = Math.sqrt(Math.max(0, px * px + py * py - PUMA_D3 * PUMA_D3));
  const L = Math.sqrt(PUMA_A3 * PUMA_A3 + PUMA_D4 * PUMA_D4);
  const beta = Math.atan2(PUMA_D4, PUMA_A3);

  // Weź gałęzie "shoulder right" dla dwóch wartości elbow
  const right = solutions.filter((s) => s.branch?.shoulder === "right");
  const branchUp = right.find((s) => s.branch?.elbow === "up");
  const branchDown = right.find((s) => s.branch?.elbow === "down");

  type Pose2D = { rhoE: number; zE: number; q2: number; q3: number };
  function projectElbow(sol: typeof right[number] | undefined): Pose2D | null {
    if (!sol) return null;
    const q2 = sol.joints[1];
    const rhoE = PUMA_A2 * Math.cos(q2);
    const zE = -PUMA_A2 * Math.sin(q2);
    return { rhoE, zE, q2, q3: sol.joints[2] };
  }
  const poseUp = projectElbow(branchUp);
  const poseDown = projectElbow(branchDown);

  // Dynamiczna skala: dopasuj widok do wrist centre oraz pozycji łokcia
  const allX = [0, rhoAbs, poseUp?.rhoE ?? 0, poseDown?.rhoE ?? 0];
  const allZ = [0, pz, poseUp?.zE ?? 0, poseDown?.zE ?? 0];
  const rawXMin = Math.min(...allX);
  const rawXMax = Math.max(...allX);
  const rawZMin = Math.min(...allZ);
  const rawZMax = Math.max(...allZ);

  const W = 720, H = 420;
  const pad = { l: 60, r: 30, t: 20, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const plotAspect = plotW / plotH;

  // Startowe zakresy z małym paddingiem
  const minExtent = 0.25;
  const padRatio = 0.12;
  function initialRange(rawMin: number, rawMax: number): [number, number] {
    const rawExtent = rawMax - rawMin;
    const p = Math.max(0.04, rawExtent * padRatio);
    let lo = rawMin - p;
    let hi = rawMax + p;
    if (hi - lo < minExtent) {
      const mid = (lo + hi) / 2;
      lo = mid - minExtent / 2;
      hi = mid + minExtent / 2;
    }
    return [lo, hi];
  }
  let [xMin, xMax] = initialRange(rawXMin, rawXMax);
  let [zMin, zMax] = initialRange(rawZMin, rawZMax);

  // Dopasuj proporcje: rozszerz krótszą oś, żeby dane:aspect == plot:aspect.
  // Dzięki temu skala pozostaje 1:1 (robot nieznieksztalcony), a elementy są
  // wycentrowane w dostępnym obszarze — bez pustych pasów po jednej stronie.
  const xExt = xMax - xMin;
  const zExt = zMax - zMin;
  const dataAspect = xExt / zExt;
  if (dataAspect < plotAspect) {
    // oś X za wąska — rozszerz ją
    const target = zExt * plotAspect;
    const cx = (xMin + xMax) / 2;
    xMin = cx - target / 2;
    xMax = cx + target / 2;
  } else {
    // oś Z za wąska — rozszerz ją
    const target = xExt / plotAspect;
    const cz = (zMin + zMax) / 2;
    zMin = cz - target / 2;
    zMax = cz + target / 2;
  }
  const scale = plotW / (xMax - xMin);  // = plotH / (zMax - zMin)

  const ρToX = (r: number) => pad.l + (r - xMin) * scale;
  const zToY = (z: number) => pad.t + (zMax - z) * scale;   // z-up → SVG y-down
  const shoulderX = ρToX(0);
  const shoulderY = zToY(0);

  // Siatka co 0.1 m
  const gridStepX = 0.1;
  const gridStepZ = 0.1;
  const xTicks: number[] = [];
  for (let x = Math.ceil(xMin * 10) / 10; x <= xMax; x += gridStepX) xTicks.push(Math.round(x * 1000) / 1000);
  const zTicks: number[] = [];
  for (let z = Math.ceil(zMin * 10) / 10; z <= zMax; z += gridStepZ) zTicks.push(Math.round(z * 1000) / 1000);

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]"
      >
        {/* Siatka */}
        <g stroke="#e5e7eb" strokeWidth={0.6}>
          {xTicks.map((x) => (
            <line key={x} x1={ρToX(x)} y1={pad.t} x2={ρToX(x)} y2={pad.t + plotH} />
          ))}
          {zTicks.map((z) => (
            <line key={z} x1={pad.l} y1={zToY(z)} x2={pad.l + plotW} y2={zToY(z)} />
          ))}
        </g>
        {/* Osie */}
        <line x1={pad.l} y1={shoulderY} x2={pad.l + plotW} y2={shoulderY} stroke="#94a3b8" strokeWidth={1} />
        <line x1={shoulderX} y1={pad.t} x2={shoulderX} y2={pad.t + plotH} stroke="#94a3b8" strokeWidth={1} />
        {/* Etykiety osi */}
        <text x={pad.l + plotW - 4} y={shoulderY - 6} fontSize={11} fontFamily="monospace" fill="#64748b" textAnchor="end">ρ [m]</text>
        <text x={shoulderX + 6} y={pad.t + 10} fontSize={11} fontFamily="monospace" fill="#64748b">z [m]</text>

        {/* Podpisy gridu X */}
        {xTicks.filter((_, i) => i % 2 === 0).map((x) => (
          <text key={`lx${x}`} x={ρToX(x)} y={pad.t + plotH + 14} fontSize={9} fontFamily="monospace" fill="#94a3b8" textAnchor="middle">
            {x.toFixed(1)}
          </text>
        ))}
        {zTicks.filter((_, i) => i % 2 === 0).map((z) => (
          <text key={`lz${z}`} x={pad.l - 6} y={zToY(z) + 3} fontSize={9} fontFamily="monospace" fill="#94a3b8" textAnchor="end">
            {z.toFixed(1)}
          </text>
        ))}

        {/* Bark */}
        <circle cx={shoulderX} cy={shoulderY} r={6} fill="#0b5ed7" />
        <text x={shoulderX - 8} y={shoulderY + 18} fontSize={11} fill="#0b5ed7" fontFamily="monospace" textAnchor="end">
          bark (pocz. układu {"{2}"})
        </text>

        {/* Wrist center */}
        <circle cx={ρToX(rhoAbs)} cy={zToY(pz)} r={7} fill="#ef4444" />
        <text x={ρToX(rhoAbs) + 10} y={zToY(pz) + 4} fontSize={11} fill="#ef4444" fontFamily="monospace">
          środek nadgarstka
        </text>
        <text x={ρToX(rhoAbs) + 10} y={zToY(pz) + 20} fontSize={10} fill="#64748b" fontFamily="monospace">
          ρ = {rhoAbs.toFixed(3)} m,  z = {pz.toFixed(3)} m
        </text>

        {/* Odcinek "promień D" od barku do wrist (pomocniczy, liliowy) */}
        <line
          x1={shoulderX} y1={shoulderY}
          x2={ρToX(rhoAbs)} y2={zToY(pz)}
          stroke="#a855f7" strokeWidth={1} strokeDasharray="2 3" opacity={0.6}
        />
        {(() => {
          const midR = rhoAbs / 2;
          const midZ = pz / 2;
          const D = Math.hypot(rhoAbs, pz);
          return (
            <text
              x={ρToX(midR) + 10}
              y={zToY(midZ) - 6}
              fontSize={10}
              fill="#a855f7"
              fontFamily="monospace"
            >
              D = {D.toFixed(3)} m
            </text>
          );
        })()}

        {/* Dwie gałęzie — ramię i przedramię */}
        {[
          { pose: poseUp, color: "#10b981", label: "elbow ↑" },
          { pose: poseDown, color: "#f59e0b", label: "elbow ↓" },
        ].map(({ pose, color, label }, idx) => {
          if (!pose) return null;
          const Ex = ρToX(pose.rhoE);
          const Ey = zToY(pose.zE);
          return (
            <g key={idx}>
              {/* Ramię (długość a₂) */}
              <line x1={shoulderX} y1={shoulderY} x2={Ex} y2={Ey} stroke={color} strokeWidth={4} opacity={0.85} />
              {/* Przedramię (efektywna długość L) — do wrist center */}
              <line x1={Ex} y1={Ey} x2={ρToX(rhoAbs)} y2={zToY(pz)} stroke={color} strokeWidth={4} opacity={0.55} strokeDasharray="6 3" />
              {/* Łokieć */}
              <circle cx={Ex} cy={Ey} r={6} fill={color} />
              <text x={Ex + 8} y={Ey - 6} fontSize={10} fill={color} fontFamily="monospace">
                {label} (q₂ = {deg(pose.q2).toFixed(1)}°, q₃ = {deg(pose.q3).toFixed(1)}°)
              </text>
              {/* Etykieta "a₂" na środku ramienia (tylko dla pierwszej gałęzi, żeby nie dublować) */}
              {idx === 0 && (
                <text
                  x={(shoulderX + Ex) / 2 - 18}
                  y={(shoulderY + Ey) / 2 - 6}
                  fontSize={11}
                  fill="#334155"
                  fontFamily="monospace"
                  fontWeight={600}
                >
                  a₂
                </text>
              )}
              {idx === 0 && (
                <text
                  x={(Ex + ρToX(rhoAbs)) / 2 + 8}
                  y={(Ey + zToY(pz)) / 2 + 4}
                  fontSize={11}
                  fill="#334155"
                  fontFamily="monospace"
                  fontWeight={600}
                >
                  L
                </text>
              )}
            </g>
          );
        })}

        {/* Legenda stałych */}
        <g transform={`translate(${pad.l + 6}, ${pad.t + 6})`}>
          <rect x={0} y={0} width={220} height={74} fill="white" stroke="#e5e7eb" rx={4} />
          <text x={8} y={14} fontSize={10} fontFamily="monospace" fill="#64748b">Stałe DH (Craig, Puma560):</text>
          <text x={8} y={30} fontSize={10} fontFamily="monospace" fill="#334155">a₂ = {PUMA_A2.toFixed(4)} m  (ramię)</text>
          <text x={8} y={44} fontSize={10} fontFamily="monospace" fill="#334155">L = √(a₃²+d₄²) = {L.toFixed(4)} m</text>
          <text x={8} y={58} fontSize={10} fontFamily="monospace" fill="#334155">β = atan2(d₄, a₃) = {deg(beta).toFixed(2)}°</text>
        </g>
      </svg>

      <p className="text-xs text-[var(--muted)]">
        Diagram przedstawia <strong>planarny podproblem 2R</strong>: bark (niebieski)
        i środek nadgarstka (czerwony) leżą w jednej płaszczyźnie pionowej,
        obróconej o q₁ wokół osi bazy. Dwie gałęzie — zielona (elbow up) i
        pomarańczowa (elbow down) — pokazują alternatywne położenia łokcia
        (pełna linia = ramię a₂, linia przerywana = efektywne przedramię L).
        Promień D = odległość bark–wrist (fioletowa przerywana) wchodzi do
        prawa kosinusów w kroku 4.
      </p>
    </div>
  );
}
