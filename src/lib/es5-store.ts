"use client";

import { create } from "zustand";
import type { JointConfig } from "@/lib/types";
import { ES5 } from "@/lib/robots/es5";

/**
 * Stan przegubów + prędkości + przyspieszeń dla ES5 — używany w modułach
 * dotyczących dynamiki (M9, M10). Oddzielony od `useRobotStore` (Puma560),
 * żeby ES5 i Puma mogły żyć niezależnie.
 */
type Es5State = {
  joints: JointConfig;
  /** Prędkości q̇ — niezerowe pokazują efekty Coriolisa/odśrodkowe w NE. */
  qDot: readonly number[];
  /** Przyspieszenia q̈ — niezerowe odpowiadają za człon bezwładności w NE. */
  qDdot: readonly number[];
  setJoint: (i: number, value: number) => void;
  setJoints: (joints: JointConfig) => void;
  setQDot: (i: number, value: number) => void;
  setQDdot: (i: number, value: number) => void;
  setAllQDot: (qDot: readonly number[]) => void;
  setAllQDdot: (qDdot: readonly number[]) => void;
  resetToHome: () => void;
};

export const useEs5Store = create<Es5State>((set) => ({
  joints: ES5.home,
  qDot:  [0, 0, 0, 0, 0, 0],
  qDdot: [0, 0, 0, 0, 0, 0],
  setJoint: (i, value) =>
    set((s) => {
      const next = [...s.joints] as number[];
      next[i] = value;
      return { joints: next as unknown as JointConfig };
    }),
  setJoints: (joints) => set({ joints }),
  setQDot: (i, value) =>
    set((s) => {
      const next = [...s.qDot];
      next[i] = value;
      return { qDot: next };
    }),
  setQDdot: (i, value) =>
    set((s) => {
      const next = [...s.qDdot];
      next[i] = value;
      return { qDdot: next };
    }),
  setAllQDot: (qDot) => set({ qDot }),
  setAllQDdot: (qDdot) => set({ qDdot }),
  resetToHome: () => set({ joints: ES5.home, qDot: [0,0,0,0,0,0], qDdot: [0,0,0,0,0,0] }),
}));
