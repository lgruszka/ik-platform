"use client";

import { useState, useMemo } from "react";
import { useMounted } from "@/lib/hooks";
import { fk2R, ik2R, makeRng, gauss } from "./robot-2r-utils";

const TARGET = { x: 1.2, y: 0.7 };

/**
 * Demo IKFlow na manipulatorze planarnym 2R: pokazujemy, jak sieć
 * z losowego szumu generuje wiele różnych poprawnych rozwiązań.
 * Każdy sample to robot wyświetlony w pozie odpowiadającej innemu
 * losowaniu szumu — wszystkie trafiają w ten sam cel TCP.
 */
export function IKFlow2RDemo() {
  const [seed, setSeed] = useState(1);
  const mounted = useMounted();

  const samples = useMemo(() => {
    if (!mounted) return [];
    const rng = makeRng(seed);
    const sols = ik2R(TARGET.x, TARGET.y);
    if (!sols) return [];
    const out: { q1: number; q2: number; branch: "up" | "down"; z: [number, number] }[] = [];
    for (let i = 0; i < 12; i++) {
      const z = gauss(rng);
      // „Sieć" symulowana: znak z[0] wybiera gałąź, z[1] dodaje mały szum
      // wokół prawdziwego rozwiązania (resztkowy błąd uczenia)
      const branch: "up" | "down" = z[0] > 0 ? "up" : "down";
      const [q1Ref, q2Ref] = sols[branch];
      const q1 = q1Ref + z[1] * 0.04;
      const q2 = q2Ref + z[0] * 0.03;
      out.push({ q1, q2, branch, z });
    }
    return out;
  }, [seed, mounted]);

  const upCount = samples.filter((s) => s.branch === "up").length;
  const downCount = samples.length - upCount;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90"
          >
            🎲 wylosuj 12 nowych próbek
          </button>
          <span className="text-xs font-mono text-[var(--muted)]">
            seed = {seed}
          </span>
          <span className="ml-auto text-xs font-mono">
            <span className="text-[#10b981] font-semibold">{upCount}</span> elbow up · <span className="text-[#a855f7] font-semibold">{downCount}</span> elbow down
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          Cel TCP <span className="font-mono">(x, y) = ({TARGET.x.toFixed(1)}, {TARGET.y.toFixed(1)})</span> — czerwona kropka.
          Każdy mały robot poniżej to <strong>jeden sample</strong> z (uproszczonej) sieci IKFlow: bierzemy losowy gaussowski szum z, „sieć" przekształca go w parę kątów (q₁, q₂). Wszystkie roboty trafiają w ten sam cel, ale używają różnych gałęzi rozwiązania.
        </p>
        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 italic">
          ⚠ Uwaga: w tym demie „sieć" to skrót — używamy znaku z₁ żeby przypisać gałąź. Prawdziwa wytrenowana sieć IKFlow uczy się tych granic <strong>sama</strong> z danych. Czytaj wyjaśnienie pod demem.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {!mounted && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]" style={{ aspectRatio: "1 / 1" }} />
        ))}
        {mounted && samples.map((s, i) => (
          <Robot2RTile key={`${seed}-${i}`} q1={s.q1} q2={s.q2} branch={s.branch} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

function Robot2RTile({
  q1, q2, branch, index,
}: { q1: number; q2: number; branch: "up" | "down"; index: number }) {
  const W = 160, H = 160;
  const cx = W / 2, cy = H / 2 + 20;
  const scale = 50; // pikseli na 1 jednostkę długości ogniwa

  const pose = fk2R(q1, q2);
  const baseColor = branch === "up" ? "#10b981" : "#a855f7";

  // konwersja matematycznych XY na SVG (Y w dół)
  const px = (x: number) => cx + x * scale;
  const py = (y: number) => cy - y * scale;

  return (
    <div
      className="rounded-lg overflow-hidden border-2 bg-white"
      style={{ borderColor: baseColor, aspectRatio: "1 / 1" }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* podpis sample */}
        <text x={6} y={14} fontSize={10} fontFamily="monospace" fill={baseColor} fontWeight={700}>
          #{index} {branch}
        </text>

        {/* osie */}
        <line x1={20} y1={cy} x2={W - 20} y2={cy} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={cx} y1={20} x2={cx} y2={H - 10} stroke="#e5e7eb" strokeWidth={1} />

        {/* cel TCP */}
        <circle cx={px(1.2)} cy={py(0.7)} r={5} fill="#ef4444" stroke="white" strokeWidth={1} />

        {/* ramię (baza → łokieć) */}
        <line
          x1={px(pose.base.x)} y1={py(pose.base.y)}
          x2={px(pose.elbow.x)} y2={py(pose.elbow.y)}
          stroke="#52525b" strokeWidth={4} strokeLinecap="round"
        />
        {/* przedramię (łokieć → koniec) */}
        <line
          x1={px(pose.elbow.x)} y1={py(pose.elbow.y)}
          x2={px(pose.tip.x)} y2={py(pose.tip.y)}
          stroke="#71717a" strokeWidth={3.5} strokeLinecap="round"
        />

        {/* baza */}
        <circle cx={px(0)} cy={py(0)} r={5} fill="#1f2937" />
        {/* łokieć */}
        <circle cx={px(pose.elbow.x)} cy={py(pose.elbow.y)} r={4} fill={baseColor} />
        {/* koniec ramienia */}
        <circle cx={px(pose.tip.x)} cy={py(pose.tip.y)} r={4} fill={baseColor} stroke="white" strokeWidth={1} />
      </svg>
    </div>
  );
}
