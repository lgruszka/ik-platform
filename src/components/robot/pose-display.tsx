"use client";

import { useMemo } from "react";
import { useRobotStore } from "@/lib/store";
import { forwardKinematics } from "@/lib/robots";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import { matrixToRpy } from "@/lib/math/rotations";
import { deg } from "@/lib/utils";

export function PoseDisplay() {
  const { robot, joints } = useRobotStore();
  const pose = useMemo(() => forwardKinematics(robot, joints), [robot, joints]);
  const p = extractPosition(pose);
  const rpy = matrixToRpy(extractRotation(pose));

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <h3 className="text-sm font-semibold mb-3">Poza efektora (T₀⁶)</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-sm tabular-nums">
        <div>
          <div className="text-xs text-[var(--muted)] mb-1">Pozycja [m]</div>
          <div>x = {p[0].toFixed(4)}</div>
          <div>y = {p[1].toFixed(4)}</div>
          <div>z = {p[2].toFixed(4)}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted)] mb-1">Orientacja RPY [°]</div>
          <div>R = {deg(rpy[0]).toFixed(2)}</div>
          <div>P = {deg(rpy[1]).toFixed(2)}</div>
          <div>Y = {deg(rpy[2]).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
