/**
 * Sanity check Jacobian solvers: FK(q) → target; pick nearby seed; iterative
 * solver should converge back to q (or another branch hitting the same pose).
 *   npx tsx src/lib/solvers/__jacobian_smoke.ts
 */
import { PUMA560 } from "@/lib/robots/puma560";
import { forwardKinematics } from "@/lib/robots/dh";
import { solveIterative, type JacobianMethod } from "./jacobian-solvers";
import type { JointConfig } from "@/lib/types";

const methods: JacobianMethod[] = ["transpose", "pinv", "dls", "sdls"];

const cases: { name: string; q: JointConfig; seed: JointConfig }[] = [
  { name: "home + small perturbation",
    q: [0.1, -1.4, 1.5, 0.2, 0.3, -0.1],
    seed: [0, -1.3, 1.4, 0.1, 0.2, 0] },
  { name: "far from seed",
    q: [0.8, -0.5, 1.8, 0.7, 0.6, 0.4],
    seed: [0, -1.5, 1.5, 0, 0, 0] },
  { name: "near wrist singularity",
    q: [0.3, -1.0, 1.3, 0.5, 0.02, -0.2],
    seed: [0.3, -1.0, 1.3, 0, 0.3, 0] },
];

for (const c of cases) {
  const T = forwardKinematics(PUMA560, c.q);
  console.log(`\n=== ${c.name} ===`);
  for (const m of methods) {
    const r = solveIterative(PUMA560, T, c.seed, {
      method: m,
      maxIter: m === "transpose" ? 2000 : 500,
      tolLin: 1e-4,
      tolAng: 1e-3,
      lambda: 0.03,
    });
    const last = r.trace[r.trace.length - 1];
    console.log(
      `  ${m.padEnd(12)} iter=${String(r.iterations).padStart(4)} ` +
      `lin=${last.errLin.toExponential(2)} ang=${last.errAng.toExponential(2)} ` +
      `time=${r.timeMs!.toFixed(1)}ms ${r.success ? "CONVERGED" : "FAILED"}`,
    );
  }
}
