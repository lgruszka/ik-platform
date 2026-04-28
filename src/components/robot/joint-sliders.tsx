"use client";

import { useRobotStore } from "@/lib/store";
import { deg, rad } from "@/lib/utils";

const JOINT_NAMES = ["θ₁", "θ₂", "θ₃", "θ₄", "θ₅", "θ₆"];

export function JointSliders() {
  const { robot, joints, setJoint, resetToHome } = useRobotStore();

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Konfiguracja przegubów</h3>
        <button
          onClick={resetToHome}
          className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)]"
        >
          reset
        </button>
      </div>
      <div className="space-y-3">
        {JOINT_NAMES.map((name, i) => {
          const limits = robot.dh[i].limits ?? { min: -Math.PI, max: Math.PI };
          const value = joints[i];
          return (
            <div key={i} className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-3">
              <span className="font-mono text-sm text-[var(--muted)]">{name}</span>
              <input
                type="range"
                min={limits.min}
                max={limits.max}
                step={rad(0.5)}
                value={value}
                onChange={(e) => setJoint(i, parseFloat(e.target.value))}
                className="accent-[var(--accent)]"
              />
              <span className="font-mono text-xs text-right tabular-nums">
                {deg(value).toFixed(1)}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
