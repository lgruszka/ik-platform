"use client";

import { useMemo } from "react";
import { useEs5Store } from "@/lib/es5-store";
import { ES5 } from "@/lib/robots/es5";
import { forwardKinematics } from "@/lib/robots/dh";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import { matrixToRpy } from "@/lib/math/rotations";
import { deg, rad } from "@/lib/utils";
import { RobotViewer } from "@/components/robot/robot-viewer";
import { Es5Model } from "@/components/dynamics/es5-model";
import { solveEs5Analytical } from "@/lib/solvers/analytical-es5";
import { useMounted } from "@/lib/hooks";
import type { JointConfig, IKSolution } from "@/lib/types";

/**
 * Interaktywny playground dla IK ES5 — używany w M12.
 *
 * Workflow:
 *  1. Student manipuluje sliderami q₁..q₆.
 *  2. Widget liczy FK (poza TCP) i wyświetla ją obok.
 *  3. Z tej samej pose uruchamia IK i pokazuje wszystkie znalezione rozwiązania.
 *  4. Każde rozwiązanie jest klikalne — załaduj wartości w slidery i zobacz
 *     że robot trafia w to samo miejsce inną drogą.
 *
 * Spodziewane zachowanie: ORYGINALNE q powinno być wśród zwróconych rozwiązań
 * (zawsze przynajmniej jedno z gałęzi z minimum dystansem ≈ 10⁻¹⁵ rad —
 * verified smoke testem).
 */
export function Es5IkPlayground() {
  const mounted = useMounted();
  const { joints, setJoint, setJoints, resetToHome } = useEs5Store();

  const T = useMemo(() => forwardKinematics(ES5, joints), [joints]);
  const p = extractPosition(T);
  const rpy = matrixToRpy(extractRotation(T));
  const solutions = useMemo(
    () => (mounted ? solveEs5Analytical(T) : []),
    [mounted, T],
  );

  return (
    <div className="space-y-4 not-prose">
      {/* 3D + slidery */}
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <RobotViewer height={420}>
          <Es5Model joints={joints} />
        </RobotViewer>
        <div className="space-y-3">
          <JointSlidersPanel
            joints={joints}
            onJointChange={setJoint}
            onReset={resetToHome}
          />
          <PoseDisplayPanel p={p as readonly number[]} rpy={rpy as readonly number[]} />
        </div>
      </div>

      {/* Lista 8 rozwiązań IK */}
      <IkSolutionsList
        solutions={solutions}
        currentJoints={joints}
        onLoad={setJoints}
      />
    </div>
  );
}

function JointSlidersPanel({
  joints, onJointChange, onReset,
}: {
  joints: JointConfig;
  onJointChange: (i: number, v: number) => void;
  onReset: () => void;
}) {
  const labels = ["θ₁", "θ₂", "θ₃", "θ₄", "θ₅", "θ₆"];
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Konfiguracja q [°]
        </h3>
        <button
          onClick={onReset}
          className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)]"
          type="button"
        >
          reset
        </button>
      </div>
      <div className="space-y-1.5">
        {labels.map((name, i) => {
          const lim = ES5.dh[i].limits ?? { min: -Math.PI, max: Math.PI };
          return (
            <div key={i} className="grid grid-cols-[2rem_1fr_4.5rem] items-center gap-2">
              <span className="font-mono text-xs text-[var(--muted)]">{name}</span>
              <input
                type="range"
                min={lim.min}
                max={lim.max}
                step={rad(0.5)}
                value={joints[i]}
                onChange={(e) => onJointChange(i, parseFloat(e.target.value))}
                className="accent-[var(--accent)]"
              />
              <span className="font-mono text-[10px] text-right tabular-nums">
                {deg(joints[i]).toFixed(1)}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PoseDisplayPanel({
  p, rpy,
}: { p: readonly number[]; rpy: readonly number[] }) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--muted)]">
        Poza efektora (z FK)
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs tabular-nums">
        <div>
          <div className="text-[10px] text-[var(--muted)] mb-0.5">Pozycja [m]</div>
          <div>x = {p[0].toFixed(4)}</div>
          <div>y = {p[1].toFixed(4)}</div>
          <div>z = {p[2].toFixed(4)}</div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--muted)] mb-0.5">Orientacja RPY [°]</div>
          <div>R = {deg(rpy[0]).toFixed(2)}</div>
          <div>P = {deg(rpy[1]).toFixed(2)}</div>
          <div>Y = {deg(rpy[2]).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

function IkSolutionsList({
  solutions, currentJoints, onLoad,
}: {
  solutions: IKSolution[];
  currentJoints: JointConfig;
  onLoad: (joints: JointConfig) => void;
}) {
  const wrap = (a: number) => {
    let v = a;
    while (v > Math.PI) v -= 2 * Math.PI;
    while (v < -Math.PI) v += 2 * Math.PI;
    return v;
  };

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--panel-border)] flex items-center justify-between bg-[var(--code-bg)]">
        <p className="text-sm font-semibold">
          Rozwiązania IK z aktualnej pose: <span className="font-mono text-[var(--accent)]">{solutions.length}</span>
          <span className="text-xs text-[var(--muted)] font-normal ml-2">
            (maks. 8 — shoulder × elbow × wrist)
          </span>
        </p>
        <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">
          kliknij żeby załadować
        </p>
      </div>
      {solutions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[var(--muted)] text-center">
          Brak rozwiązań — pose poza zasięgiem albo geometryczna degeneracja.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--panel-border)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <th className="text-left px-3 py-2">gałąź</th>
                {["θ₁", "θ₂", "θ₃", "θ₄", "θ₅", "θ₆"].map((l) => (
                  <th key={l} className="text-right px-2 py-2">{l}</th>
                ))}
                <th className="text-right px-3 py-2" title="L2-odległość od aktualnego q (z wrappingiem)">|Δq|</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
              {solutions.map((s, i) => {
                let dist = 0;
                for (let k = 0; k < 6; k++) {
                  const d = wrap(s.joints[k] - currentJoints[k]);
                  dist += d * d;
                }
                dist = Math.sqrt(dist);
                const isMatch = dist < 1e-3;
                return (
                  <tr
                    key={i}
                    className={`cursor-pointer hover:bg-[var(--code-bg)] ${isMatch ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}`}
                    onClick={() => onLoad(s.joints)}
                  >
                    <td className="px-3 py-1.5">
                      <span className="text-[10px]">
                        <BranchBadge label="S" value={s.branch?.shoulder ?? "-"} />
                        <BranchBadge label="E" value={s.branch?.elbow ?? "-"} />
                        <BranchBadge label="W" value={s.branch?.wrist ?? "-"} />
                      </span>
                    </td>
                    {Array.from({ length: 6 }, (_, k) => (
                      <td key={k} className="text-right px-2 py-1.5 tabular-nums">
                        {deg(s.joints[k]).toFixed(1)}°
                      </td>
                    ))}
                    <td className="text-right px-3 py-1.5 tabular-nums">
                      {isMatch ? (
                        <span className="text-emerald-600 font-semibold">✓ ten</span>
                      ) : (
                        <span className="text-[var(--muted)]">{dist.toFixed(2)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-[var(--muted)] px-4 py-2 border-t border-[var(--panel-border)]">
        <strong>S</strong>=shoulder (left/right), <strong>E</strong>=elbow (up/down),{" "}
        <strong>W</strong>=wrist (flip/noflip). Wiersz w kolorze zielonym to gałąź odpowiadająca
        aktualnemu q. Klikając inny wiersz załadujesz tę konfigurację —{" "}
        zobaczysz że robot trafia w to samo miejsce <em>inną drogą</em>.
      </p>
    </div>
  );
}

function BranchBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-block bg-[var(--code-bg)] text-[var(--muted)] px-1.5 py-0.5 rounded mr-1">
      <span className="text-[var(--accent)] font-semibold">{label}:</span>
      {value.slice(0, 5)}
    </span>
  );
}
