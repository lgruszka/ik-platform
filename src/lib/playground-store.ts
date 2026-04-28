"use client";

import { create } from "zustand";
import type { BranchKey } from "./branch-colors";

type PlaygroundState = {
  selectedBranches: Set<BranchKey>;
  toggleBranch: (key: BranchKey) => void;
  selectAll: () => void;
  selectNone: () => void;
};

const allKeys: BranchKey[] = [
  "right-up-noflip", "right-up-flip",
  "right-down-noflip", "right-down-flip",
  "left-up-noflip", "left-up-flip",
  "left-down-noflip", "left-down-flip",
];

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  selectedBranches: new Set(allKeys),
  toggleBranch: (key) =>
    set((s) => {
      const next = new Set(s.selectedBranches);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { selectedBranches: next };
    }),
  selectAll: () => set({ selectedBranches: new Set(allKeys) }),
  selectNone: () => set({ selectedBranches: new Set() }),
}));
