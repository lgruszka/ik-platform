"use client";

import { create } from "zustand";
import type { JointConfig, RobotModel } from "@/lib/types";
import { PUMA560 } from "@/lib/robots";

// Domyślna konfiguracja przegubów wybrana tak, by FK ≈ domyślny TCP w target-store
// (pozycja [0.5, 0.15, 0.3] m, orientacja rpy = [0, π/2, 0]). To gałąź
// shoulder=right, elbow=up, wrist=flip z analitycznego IK Pumy 560 — wszystkie
// q_i mieszczą się w fabrycznych limitach przegubów.
const DEFAULT_JOINTS: JointConfig = [
  0.0489, -1.3561, 0.1181, 0.1486, -0.3363, 3.0012,
] as unknown as JointConfig;

type RobotState = {
  robot: RobotModel;
  joints: JointConfig;
  setJoint: (i: number, value: number) => void;
  setJoints: (joints: JointConfig) => void;
  resetToHome: () => void;
};

export const useRobotStore = create<RobotState>((set) => ({
  robot: PUMA560,
  joints: DEFAULT_JOINTS,
  setJoint: (i, value) =>
    set((s) => {
      const next = [...s.joints] as number[];
      next[i] = value;
      return { joints: next as unknown as JointConfig };
    }),
  setJoints: (joints) => set({ joints }),
  resetToHome: () => set((s) => ({ joints: s.robot.home })),
}));
