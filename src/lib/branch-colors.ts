import type { IKBranch } from "@/lib/types";

export type BranchKey = `${IKBranch["shoulder"]}-${IKBranch["elbow"]}-${IKBranch["wrist"]}`;

export function branchKey(b: IKBranch): BranchKey {
  return `${b.shoulder}-${b.elbow}-${b.wrist}`;
}

/**
 * 8 distinguishable colours for the 2×2×2 branch tree. Chosen from an
 * accessible (APCA-friendly) palette with meaningful grouping:
 *   - blue / cyan hues      → shoulder right
 *   - amber / magenta hues  → shoulder left
 *   - saturated             → wrist no-flip
 *   - muted                 → wrist flip
 */
export const BRANCH_COLOURS: Record<BranchKey, string> = {
  "right-up-noflip":   "#0ea5e9", // sky
  "right-up-flip":     "#60a5fa", // blue muted
  "right-down-noflip": "#14b8a6", // teal
  "right-down-flip":   "#5eead4", // teal muted
  "left-up-noflip":    "#f59e0b", // amber
  "left-up-flip":      "#fbbf24", // amber muted
  "left-down-noflip":  "#ec4899", // pink
  "left-down-flip":    "#f9a8d4", // pink muted
};

export function branchLabel(b: IKBranch): string {
  const sh = b.shoulder === "right" ? "shoulder R" : "shoulder L";
  const el = b.elbow === "up" ? "elbow ↑" : "elbow ↓";
  const wr = b.wrist === "noflip" ? "wrist □" : "wrist ⟲";
  return `${sh} · ${el} · ${wr}`;
}
