"use client";

import { useTargetStore } from "@/lib/target-store";
import { useRobotStore } from "@/lib/store";
import { forwardKinematics } from "@/lib/robots";
import { deg, rad } from "@/lib/utils";

export function TargetPoseInput() {
  const { pose, setPose } = useTargetStore();
  const { robot, joints } = useRobotStore();

  const snapshot = () => {
    const T = forwardKinematics(robot, joints);
    useTargetStore.getState().setMatrix(T);
  };

  const setPos = (i: 0 | 1 | 2, v: number) => {
    const next = [...pose.position] as [number, number, number];
    next[i] = v;
    setPose({ position: next });
  };

  const setRpy = (i: 0 | 1 | 2, vDeg: number) => {
    const next = [...pose.rpy] as [number, number, number];
    next[i] = rad(vDeg);
    setPose({ rpy: next });
  };

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 min-w-0">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-semibold truncate">
          Poza docelowa <span className="font-mono font-normal text-[var(--muted)]">T*</span>
        </h3>
        <button
          onClick={snapshot}
          className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] hover:underline shrink-0"
        >
          zrzut
        </button>
      </div>

      <div className="text-xs text-[var(--muted)] mb-1">Pozycja [m]</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(["x", "y", "z"] as const).map((ax, i) => (
          <label key={ax} className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-xs text-[var(--muted)] shrink-0">{ax}</span>
            <input
              type="number"
              step={0.01}
              value={pose.position[i].toFixed(3)}
              onChange={(e) => setPos(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
              className="min-w-0 w-full bg-[var(--code-bg)] rounded px-1.5 py-1 font-mono tabular-nums text-xs"
            />
          </label>
        ))}
      </div>

      <div className="text-xs text-[var(--muted)] mb-1">Orientacja RPY [°]</div>
      <div className="grid grid-cols-3 gap-2">
        {(["R", "P", "Y"] as const).map((ax, i) => (
          <label key={ax} className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-xs text-[var(--muted)] shrink-0">{ax}</span>
            <input
              type="number"
              step={1}
              value={deg(pose.rpy[i]).toFixed(1)}
              onChange={(e) => setRpy(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
              className="min-w-0 w-full bg-[var(--code-bg)] rounded px-1.5 py-1 font-mono tabular-nums text-xs"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
