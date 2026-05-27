"use client";

import { useMemo, useState } from "react";
import { useEs5Store } from "@/lib/es5-store";
import { ES5 } from "@/lib/robots/es5";
import { forwardKinematics } from "@/lib/robots/dh";
import {
  composeSE3,
  extractPosition,
  extractRotation,
} from "@/lib/math/matrix";
import { matrixToRpy, rpyToMatrix } from "@/lib/math/rotations";
import { deg, rad } from "@/lib/utils";
import { RobotViewer } from "@/components/robot/robot-viewer";
import { Es5Model } from "@/components/dynamics/es5-model";
import { solveEs5Analytical } from "@/lib/solvers/analytical-es5";
import { useMounted } from "@/lib/hooks";
import type { JointConfig, IKSolution, Vec3, Matrix4 } from "@/lib/types";

/**
 * Interaktywny playground dla IK ES5 — używany w M12.
 *
 * Dwa równoległe stany:
 *  - q (joint angles) — w useEs5Store; sterowane sliderami
 *  - target (pose docelowa) — lokalnie; edytowalna inputami lub
 *    snapshotem z FK(q)
 *
 * Solver liczy IK z target i pokazuje wszystkie znalezione rozwiązania.
 * Kliknięcie rozwiązania ładuje je do sliderów (zmienia q, target zostaje).
 * To pokazuje że jeden cel ma do 8 dróg dojścia (shoulder × elbow × wrist).
 */
export function Es5IkPlayground() {
  const mounted = useMounted();
  const { joints, setJoint, setJoints, resetToHome } = useEs5Store();

  // Lokalny stan target — pos (m) + rpy (rad), zsynchronizowany z FK(home) na starcie.
  const initialTarget = useMemo(() => {
    const T = forwardKinematics(ES5, ES5.home);
    return {
      position: extractPosition(T) as Vec3,
      rpy: matrixToRpy(extractRotation(T)) as Vec3,
    };
  }, []);
  const [target, setTarget] = useState(initialTarget);

  // Aktualna FK z q (pokazujemy obok jako "co teraz robot wykonuje").
  const fkCurrent = useMemo(
    () => forwardKinematics(ES5, joints),
    [joints],
  );
  const fkPos = extractPosition(fkCurrent) as Vec3;
  const fkRpy = matrixToRpy(extractRotation(fkCurrent)) as Vec3;

  // Macierz target dla solvera
  const targetMatrix: Matrix4 = useMemo(
    () => composeSE3(rpyToMatrix(target.rpy[0], target.rpy[1], target.rpy[2]), target.position),
    [target],
  );

  // Solver IK — zawsze pracuje na target, nie na FK(q)
  const solutions = useMemo(
    () => (mounted ? solveEs5Analytical(targetMatrix) : []),
    [mounted, targetMatrix],
  );

  // Residuum: jak daleko aktualne q jest od target?
  const residual = useMemo(() => {
    const pErr = Math.hypot(
      fkPos[0] - target.position[0],
      fkPos[1] - target.position[1],
      fkPos[2] - target.position[2],
    );
    return pErr;
  }, [fkPos, target.position]);

  const snapTargetFromFk = () => {
    setTarget({ position: fkPos, rpy: fkRpy });
  };

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
          <TargetInputPanel
            target={target}
            onChange={setTarget}
            onSnapshot={snapTargetFromFk}
            residual={residual}
          />
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

function TargetInputPanel({
  target, onChange, onSnapshot, residual,
}: {
  target: { position: Vec3; rpy: Vec3 };
  onChange: (next: { position: Vec3; rpy: Vec3 }) => void;
  onSnapshot: () => void;
  residual: number;
}) {
  const setPos = (i: 0 | 1 | 2, v: number) => {
    const next = [...target.position] as [number, number, number];
    next[i] = v;
    onChange({ position: next as Vec3, rpy: target.rpy });
  };
  const setRpy = (i: 0 | 1 | 2, vDeg: number) => {
    const next = [...target.rpy] as [number, number, number];
    next[i] = rad(vDeg);
    onChange({ position: target.position, rpy: next as Vec3 });
  };
  const onTarget = residual < 1e-3;
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Pose docelowa <span className="font-mono font-normal text-[var(--muted)] normal-case">T*</span>
        </h3>
        <button
          onClick={onSnapshot}
          className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)]"
          type="button"
          title="Wpisz aktualne FK(q) jako nową pozę docelową"
        >
          ← zrzut FK(q)
        </button>
      </div>

      <div className="text-[10px] text-[var(--muted)] mb-1">Pozycja [m]</div>
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {(["x", "y", "z"] as const).map((ax, i) => (
          <label key={ax} className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-[10px] text-[var(--muted)] shrink-0">{ax}</span>
            <input
              type="number"
              step={0.01}
              value={target.position[i].toFixed(3)}
              onChange={(e) => setPos(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
              className="min-w-0 w-full bg-[var(--code-bg)] rounded px-1.5 py-1 font-mono tabular-nums text-[11px]"
            />
          </label>
        ))}
      </div>

      <div className="text-[10px] text-[var(--muted)] mb-1">Orientacja RPY [°]</div>
      <div className="grid grid-cols-3 gap-1.5">
        {(["R", "P", "Y"] as const).map((ax, i) => (
          <label key={ax} className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-[10px] text-[var(--muted)] shrink-0">{ax}</span>
            <input
              type="number"
              step={1}
              value={deg(target.rpy[i]).toFixed(1)}
              onChange={(e) => setRpy(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
              className="min-w-0 w-full bg-[var(--code-bg)] rounded px-1.5 py-1 font-mono tabular-nums text-[11px]"
            />
          </label>
        ))}
      </div>

      <div
        className={`mt-2.5 rounded px-2 py-1.5 text-[10px] font-mono ${
          onTarget
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        }`}
      >
        {onTarget ? (
          <>✓ TCP na pozie docelowej (|Δp| &lt; 1 mm)</>
        ) : (
          <>
            ⚠ TCP odbiega od T* o {(residual * 1000).toFixed(1)} mm —
            wybierz rozwiązanie poniżej żeby trafić
          </>
        )}
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
          Rozwiązania IK z pozy docelowej: <span className="font-mono text-[var(--accent)]">{solutions.length}</span>
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
          Brak rozwiązań — poza zasięgiem albo geometryczna degeneracja.
          Spróbuj zmienić pozycję lub orientację w panelu po prawej.
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
                        <span className="text-emerald-600 font-semibold">✓ aktywne</span>
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
        <strong>W</strong>=wrist (flip/noflip). Wiersz w kolorze zielonym to gałąź,
        do której aktualnie ustawione są przeguby. Klikając inny wiersz załadujesz
        tę konfigurację — robot trafi w tę samą pozę docelową <em>inną drogą</em>.
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
