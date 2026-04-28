/** Smoke test for optimization solvers. */
import { PUMA560 } from "@/lib/robots/puma560";
import { forwardKinematics } from "@/lib/robots/dh";
import { solveByOptimization } from "./optimization";
import type { JointConfig } from "@/lib/types";

const cases: { name: string; q: JointConfig; seed: JointConfig }[] = [
  { name: "close seed",
    q: [0.2, -1.2, 1.4, 0.1, 0.3, 0],
    seed: [0, -1.3, 1.5, 0, 0.1, 0] },
  { name: "far seed",
    q: [0.8, -0.5, 1.8, 0.7, 0.6, 0.4],
    seed: [0, -1.5, 1.5, 0, 0, 0] },
];

for (const c of cases) {
  const T = forwardKinematics(PUMA560, c.q);
  console.log(`\n=== ${c.name} ===`);
  for (const m of ["nelder-mead", "gradient"] as const) {
    const r = solveByOptimization(PUMA560, T, c.seed, m);
    console.log(
      `  ${m.padEnd(15)} iter=${String(r.iterations).padStart(5)} residual=${r.residual!.toExponential(2)} ` +
      `time=${r.timeMs!.toFixed(1)}ms ${r.success ? "OK" : "FAIL"}`,
    );
  }
}
