"use client";

import { useState, useMemo } from "react";
import { useMounted } from "@/lib/hooks";
import { fk2R, ik2R, makeRng, gauss } from "./robot-2r-utils";

const TARGET = { x: 1.2, y: 0.7 };
const T_STEPS = 50;
const N_ROBOTS = 6;

/**
 * Demo diffusion na 2R. Slider od 0 do 50: w każdym kroku model
 * robi „mały krok" odszumiania. Sześć równoległych robotów, każdy
 * startuje z innego losowego szumu, wszystkie zmierzają do jednego z
 * dwóch poprawnych rozwiązań IK (elbow up albo down).
 */
export function Diffusion2RDemo() {
  const [step, setStep] = useState(0);
  const mounted = useMounted();
  const t = step / T_STEPS;

  const robots = useMemo(() => {
    if (!mounted) return [];
    const sols = ik2R(TARGET.x, TARGET.y);
    if (!sols) return [];
    const rng = makeRng(7);
    const out: { q1: number; q2: number; branch: "up" | "down" }[] = [];
    for (let i = 0; i < N_ROBOTS; i++) {
      const [zx, zy] = gauss(rng);
      // Punkt startowy (czysty szum) — losowe q1, q2
      const q1Start = zx * 1.2;
      const q2Start = zy * 1.2;
      // Wybór branch zależy od znaku zx
      const branch: "up" | "down" = zx > 0 ? "up" : "down";
      const [q1End, q2End] = sols[branch];
      // Interpolacja z szumu do celu (model diffusion robi to w ~50 krokach)
      const q1 = (1 - t) * q1Start + t * q1End;
      const q2 = (1 - t) * q2Start + t * q2End;
      out.push({ q1, q2, branch });
    }
    return out;
  }, [t, mounted]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="font-mono text-xs text-[var(--muted)]">krok dyfuzji:</span>
          <input
            type="range"
            min={0}
            max={T_STEPS}
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
            style={{ minWidth: 200 }}
          />
          <span className="font-mono text-sm tabular-nums w-20 text-right">
            {step}/{T_STEPS}
          </span>
          <button
            onClick={() => setStep(0)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
          >
            ← szum
          </button>
          <button
            onClick={() => setStep(T_STEPS)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
          >
            cel →
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {step === 0 && "Krok 0: czysty losowy szum. Każdy z sześciu robotów ma losowe (q₁, q₂) — koniec ramienia jest gdzieś w przestrzeni, ale nie na celu."}
          {step > 0 && step < T_STEPS && `Krok ${step}: model usuwa trochę szumu. Roboty stopniowo zmierzają ku swoim poprawnym ułożeniom.`}
          {step === T_STEPS && `Krok ${T_STEPS}: gotowe! Wszystkie końcówki trafiły w cel — niektóre z elbow up (zielone), niektóre z elbow down (fioletowe).`}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {!mounted && Array.from({ length: N_ROBOTS }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]" style={{ aspectRatio: "1 / 1" }} />
        ))}
        {mounted && robots.map((r, i) => (
          <Robot2RDiffusionTile key={i} q1={r.q1} q2={r.q2} branch={r.branch} index={i + 1} t={t} />
        ))}
      </div>
    </div>
  );
}

function Robot2RDiffusionTile({
  q1, q2, branch, index, t,
}: { q1: number; q2: number; branch: "up" | "down"; index: number; t: number }) {
  const W = 160, H = 160;
  const cx = W / 2, cy = H / 2 + 20;
  const scale = 45;

  const pose = fk2R(q1, q2);
  const branchColor = branch === "up" ? "#10b981" : "#a855f7";

  const px = (x: number) => cx + x * scale;
  const py = (y: number) => cy - y * scale;

  // Robot na początku jest „rozmyty" (szum), pod koniec ostry (kolor branchu)
  const noiseColor = "#cbd5e1";
  const armColor = t < 0.1 ? noiseColor : interp(noiseColor, "#52525b", Math.min(1, t * 1.5));
  const forearmColor = t < 0.1 ? noiseColor : interp(noiseColor, "#71717a", Math.min(1, t * 1.5));
  const jointColor = t < 0.5 ? interp(noiseColor, branchColor, t * 2) : branchColor;

  return (
    <div
      className="rounded-lg overflow-hidden border-2 bg-white"
      style={{ borderColor: t < 0.5 ? "#cbd5e1" : branchColor, aspectRatio: "1 / 1", transition: "border-color 200ms" }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <text x={6} y={14} fontSize={10} fontFamily="monospace" fill={t < 0.3 ? "#94a3b8" : branchColor} fontWeight={700}>
          robot #{index}
        </text>

        <line x1={20} y1={cy} x2={W - 20} y2={cy} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={cx} y1={20} x2={cx} y2={H - 10} stroke="#e5e7eb" strokeWidth={1} />

        {/* cel TCP — zawsze widoczny */}
        <circle cx={px(1.2)} cy={py(0.7)} r={5} fill="#ef4444" stroke="white" strokeWidth={1} />

        {/* ramię */}
        <line
          x1={px(pose.base.x)} y1={py(pose.base.y)}
          x2={px(pose.elbow.x)} y2={py(pose.elbow.y)}
          stroke={armColor} strokeWidth={4} strokeLinecap="round"
          opacity={0.5 + t * 0.5}
        />
        <line
          x1={px(pose.elbow.x)} y1={py(pose.elbow.y)}
          x2={px(pose.tip.x)} y2={py(pose.tip.y)}
          stroke={forearmColor} strokeWidth={3.5} strokeLinecap="round"
          opacity={0.5 + t * 0.5}
        />

        <circle cx={px(0)} cy={py(0)} r={5} fill="#1f2937" />
        <circle cx={px(pose.elbow.x)} cy={py(pose.elbow.y)} r={4} fill={jointColor} />
        <circle cx={px(pose.tip.x)} cy={py(pose.tip.y)} r={4} fill={jointColor} stroke="white" strokeWidth={1} />
      </svg>
    </div>
  );
}

// Interpolacja między dwoma kolorami hex
function interp(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
