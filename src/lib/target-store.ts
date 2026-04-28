"use client";

import { create } from "zustand";
import type { Matrix4, Pose } from "@/lib/types";
import { rpyToMatrix } from "@/lib/math/rotations";
import { composeSE3, extractPosition, extractRotation } from "@/lib/math/matrix";
import { matrixToRpy } from "@/lib/math/rotations";

function poseToMatrix(p: Pose): Matrix4 {
  return composeSE3(rpyToMatrix(p.rpy[0], p.rpy[1], p.rpy[2]), p.position);
}

function matrixToPose(T: Matrix4): Pose {
  return {
    position: extractPosition(T),
    rpy: matrixToRpy(extractRotation(T)),
  };
}

// Domyślny cel celowo różni się od FK(home) — dzięki temu porównania solverów
// w m03/m04 mają od razu pracę do wykonania (bez konieczności ręcznej zmiany pozycji).
// Pozycja [0.5, 0.15, 0.3] i orientacja rpy = [0, π/2, 0] są w zasięgu Pumy 560.
const initialTarget = composeSE3(
  rpyToMatrix(0, Math.PI / 2, 0),
  [0.5, 0.15, 0.3],
);

type TargetState = {
  target: Matrix4;
  pose: Pose;
  setPose: (p: Partial<Pose>) => void;
  setMatrix: (T: Matrix4) => void;
};

export const useTargetStore = create<TargetState>((set) => ({
  target: initialTarget,
  pose: matrixToPose(initialTarget),
  setPose: (p) =>
    set((s) => {
      const next: Pose = {
        position: p.position ?? s.pose.position,
        rpy: p.rpy ?? s.pose.rpy,
      };
      return { pose: next, target: poseToMatrix(next) };
    }),
  setMatrix: (T) => set({ target: T, pose: matrixToPose(T) }),
}));
