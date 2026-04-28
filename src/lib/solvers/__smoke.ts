/**
 * Sanity round-trip: FK(q) → target pose → analytical IK → solution set must
 * contain a q' very close to q (mod 2π). Run with:
 *
 *   npx tsx src/lib/solvers/__smoke.ts
 */
import { PUMA560 } from "@/lib/robots/puma560";
import { forwardKinematics } from "@/lib/robots/dh";
import { solvePuma560Analytical } from "./analytical-puma560";
import type { JointConfig } from "@/lib/types";

function wrap(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function jointDist(a: JointConfig, b: JointConfig): number {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.pow(wrap(a[i] - b[i]), 2);
  return Math.sqrt(s);
}

const cases: JointConfig[] = [
  PUMA560.home,
  [0.3, -1.2, 1.6, 0.4, 0.5, -0.6],
  [-0.8, -0.5, 2.0, 1.0, -0.7, 0.3],
  [1.2, -2.0, 0.8, -0.5, 0.9, 1.5],
  [0, -Math.PI / 2, Math.PI / 2, 0, 0.01, 0], // near wrist singularity
  [0.5, -0.9, 1.1, 0.2, -0.01, 0.8],          // near wrist singularity (flip)
];

let failed = 0;
for (const q of cases) {
  const T = forwardKinematics(PUMA560, q);
  const sols = solvePuma560Analytical(T);
  if (sols.length === 0) {
    console.log("NO SOLUTIONS for q =", q);
    failed++;
    continue;
  }
  const dists = sols.map((s) => jointDist(s.joints, q));
  const best = Math.min(...dists);
  const ok = best < 1e-6;
  console.log(
    `q=[${q.map((x) => x.toFixed(3)).join(", ")}]  #sols=${sols.length}  ` +
      `min|q-q*|=${best.toExponential(2)}  ${ok ? "PASS" : "FAIL"}`,
  );
  if (!ok) failed++;
}
console.log(`\n${failed === 0 ? "ALL PASS" : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
