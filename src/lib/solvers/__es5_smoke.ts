/**
 * Sanity round-trip dla solvera analitycznego ES5: dla każdego q z listy
 * testowych konfiguracji liczymy FK → target, potem IK → set rozwiązań,
 * sprawdzamy że ORYGINALNE q jest w zbiorze (mod 2π).
 *
 *   npx tsx src/lib/solvers/__es5_smoke.ts
 */
import { ES5 } from "@/lib/robots/es5";
import { forwardKinematics } from "@/lib/robots/dh";
import { solveEs5Analytical } from "./analytical-es5";
import type { JointConfig } from "@/lib/types";

function wrap(a: number): number {
  let v = a;
  while (v > Math.PI) v -= 2 * Math.PI;
  while (v < -Math.PI) v += 2 * Math.PI;
  return v;
}

function jointDist(a: JointConfig, b: JointConfig): number {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.pow(wrap(a[i] - b[i]), 2);
  return Math.sqrt(s);
}

const cases: { label: string; q: JointConfig }[] = [
  { label: "home", q: ES5.home },
  { label: "casual A", q: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8] },
  { label: "casual B", q: [-0.5, 0.8, -0.6, 0.4, -0.3, 0.2] },
  { label: "wide", q: [1.2, -0.5, 1.1, -0.7, 0.9, 1.5] },
  { label: "near wrist sing.", q: [0.4, 0.3, 0.4, 0.2, 0.01, 0.5] },
];

let failed = 0;
for (const { label, q } of cases) {
  const T = forwardKinematics(ES5, q);
  const sols = solveEs5Analytical(T);
  if (sols.length === 0) {
    console.log(`[${label}] NO SOLUTIONS`);
    failed++;
    continue;
  }
  const dists = sols.map((s) => jointDist(s.joints, q));
  const best = Math.min(...dists);
  const ok = best < 1e-4;
  console.log(
    `[${label}] q=[${q.map((x) => x.toFixed(3)).join(", ")}]  #sols=${sols.length}  ` +
      `min|q-q*|=${best.toExponential(2)}  ${ok ? "PASS" : "FAIL"}`,
  );
  if (!ok) {
    failed++;
    // Dla diagnozy — najbliższe rozwiązanie z każdej gałęzi
    for (const s of sols) {
      const d = jointDist(s.joints, q);
      console.log(`    branch=${JSON.stringify(s.branch)}  q*=[${s.joints.map((x) => x.toFixed(3)).join(", ")}]  d=${d.toExponential(2)}`);
    }
  }
}
console.log(`\n${failed === 0 ? "ALL PASS" : `${failed}/${cases.length} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
