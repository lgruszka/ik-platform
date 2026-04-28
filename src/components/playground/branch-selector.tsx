"use client";

import { usePlaygroundStore } from "@/lib/playground-store";
import { BRANCH_COLOURS, type BranchKey } from "@/lib/branch-colors";

const ROWS: { shoulder: "right" | "left"; keys: BranchKey[] }[] = [
  {
    shoulder: "right",
    keys: ["right-up-noflip", "right-up-flip", "right-down-noflip", "right-down-flip"],
  },
  {
    shoulder: "left",
    keys: ["left-up-noflip", "left-up-flip", "left-down-noflip", "left-down-flip"],
  },
];

const COLS = ["elbow ↑ · wrist □", "elbow ↑ · wrist ⟲", "elbow ↓ · wrist □", "elbow ↓ · wrist ⟲"];

export function BranchSelector() {
  const { selectedBranches, toggleBranch, selectAll, selectNone } = usePlaygroundStore();

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Aktywne gałęzie</h3>
        <div className="flex gap-3 text-xs font-mono uppercase tracking-wider">
          <button onClick={selectAll} className="text-[var(--muted)] hover:text-[var(--accent)]">wszystko</button>
          <button onClick={selectNone} className="text-[var(--muted)] hover:text-[var(--accent)]">żadne</button>
        </div>
      </div>
      <div className="grid grid-cols-[4.5rem_repeat(4,minmax(0,1fr))] gap-1 text-xs">
        <div />
        {COLS.map((c) => (
          <div key={c} className="text-center text-[10px] font-mono text-[var(--muted)] pb-1 leading-tight">
            {c}
          </div>
        ))}
        {ROWS.flatMap((row) => [
          <div
            key={`label-${row.shoulder}`}
            className="flex items-center font-mono text-[var(--muted)]"
          >
            {row.shoulder === "right" ? "sh R" : "sh L"}
          </div>,
          ...row.keys.map((k) => {
            const checked = selectedBranches.has(k);
            return (
              <button
                key={k}
                onClick={() => toggleBranch(k)}
                className={`aspect-square rounded-md border-2 transition-all ${
                  checked ? "border-transparent" : "border-[var(--panel-border)] bg-transparent opacity-40"
                }`}
                style={{ background: checked ? BRANCH_COLOURS[k] : undefined }}
                title={k}
              />
            );
          }),
        ])}
      </div>
    </div>
  );
}
