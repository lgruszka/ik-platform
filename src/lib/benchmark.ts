import { PUMA560, forwardKinematics } from "@/lib/robots";
import { solvePuma560Analytical, pickClosestSolution } from "@/lib/solvers/analytical-puma560";
import { solveIterative, type JacobianMethod } from "@/lib/solvers/jacobian-solvers";
import { solveByOptimization } from "@/lib/solvers/optimization";
import { errorNorms, poseTwistError } from "@/lib/math/twist";
import type { JointConfig, Matrix4 } from "@/lib/types";

export type TestCase = {
  id: number;
  qTrue: JointConfig;
  target: Matrix4;
  seed: JointConfig;
};

/**
 * Generate a deterministic benchmark set: random joint configurations within
 * ±0.9 of each joint's limit range, then FK to produce a target pose. Seed is
 * a perturbed version of qTrue — encourages convergence to the same branch.
 */
export function generateBenchmark(n: number, seedBase = 42): TestCase[] {
  const rng = mulberry32(seedBase);
  const cases: TestCase[] = [];
  for (let i = 0; i < n; i++) {
    const qTrue = PUMA560.dh.map((d) => {
      const lim = d.limits ?? { min: -Math.PI, max: Math.PI };
      const span = lim.max - lim.min;
      return lim.min + (0.05 + 0.9 * rng()) * span;
    }) as unknown as JointConfig;
    const target = forwardKinematics(PUMA560, qTrue);
    const seed = qTrue.map((q) => q + (rng() - 0.5) * 0.4) as unknown as JointConfig;
    cases.push({ id: i, qTrue, target, seed });
  }
  return cases;
}

export type SolverId =
  | "analytical"
  | "transpose"
  | "pinv"
  | "dls"
  | "sdls"
  | "nelder-mead"
  | "gradient";

export type PerCaseResult = {
  solver: SolverId;
  caseId: number;
  success: boolean;
  errLin: number;
  errAng: number;
  iterations: number;
  timeMs: number;
};

const TOL_LIN = 1e-3;     // 1 mm
const TOL_ANG = 1e-2;     // ~0.57°

function evalPose(Tcur: Matrix4, target: Matrix4): { errLin: number; errAng: number } {
  const e = poseTwistError(Tcur, target);
  const n = errorNorms(e);
  return { errLin: n.lin, errAng: n.ang };
}

export function runSolverOnCase(solver: SolverId, c: TestCase): PerCaseResult {
  const t0 = performance.now();
  let joints: JointConfig;
  let iter = 0;
  try {
    switch (solver) {
      case "analytical": {
        const sols = solvePuma560Analytical(c.target);
        const picked = pickClosestSolution(sols, c.seed);
        if (!picked) throw new Error("no solution");
        joints = picked.joints;
        iter = 1;
        break;
      }
      case "transpose":
      case "pinv":
      case "dls":
      case "sdls": {
        const r = solveIterative(PUMA560, c.target, c.seed, {
          method: solver as JacobianMethod,
          maxIter: solver === "transpose" ? 2000 : 500,
          tolLin: 1e-4,
          tolAng: 1e-3,
          lambda: 0.03,
        });
        joints = r.joints;
        iter = r.iterations!;
        break;
      }
      case "nelder-mead":
      case "gradient": {
        const r = solveByOptimization(PUMA560, c.target, c.seed, solver);
        joints = r.joints;
        iter = r.iterations!;
        break;
      }
    }
  } catch {
    return {
      solver,
      caseId: c.id,
      success: false,
      errLin: Infinity,
      errAng: Infinity,
      iterations: 0,
      timeMs: performance.now() - t0,
    };
  }
  const timeMs = performance.now() - t0;
  const T = forwardKinematics(PUMA560, joints);
  const { errLin, errAng } = evalPose(T, c.target);
  return {
    solver,
    caseId: c.id,
    success: errLin < TOL_LIN && errAng < TOL_ANG,
    errLin,
    errAng,
    iterations: iter,
    timeMs,
  };
}

export type Aggregate = {
  solver: SolverId;
  n: number;
  successRate: number;
  timeMeanMs: number;
  timeMedianMs: number;
  timeP95Ms: number;
  iterMean: number;
  errLinMedian: number;
  errAngMedian: number;
};

export function aggregate(results: PerCaseResult[]): Aggregate[] {
  const bySolver = new Map<SolverId, PerCaseResult[]>();
  for (const r of results) {
    if (!bySolver.has(r.solver)) bySolver.set(r.solver, []);
    bySolver.get(r.solver)!.push(r);
  }
  const out: Aggregate[] = [];
  for (const [solver, rs] of bySolver.entries()) {
    const times = rs.map((r) => r.timeMs).sort((a, b) => a - b);
    const iters = rs.map((r) => r.iterations);
    const linErrs = rs.map((r) => r.errLin).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
    const angErrs = rs.map((r) => r.errAng).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
    out.push({
      solver,
      n: rs.length,
      successRate: rs.filter((r) => r.success).length / rs.length,
      timeMeanMs: times.reduce((s, x) => s + x, 0) / times.length,
      timeMedianMs: times[Math.floor(times.length / 2)] ?? 0,
      timeP95Ms: times[Math.floor(times.length * 0.95)] ?? 0,
      iterMean: iters.reduce((s, x) => s + x, 0) / iters.length,
      errLinMedian: linErrs.length ? linErrs[Math.floor(linErrs.length / 2)] : Infinity,
      errAngMedian: angErrs.length ? angErrs[Math.floor(angErrs.length / 2)] : Infinity,
    });
  }
  return out;
}

/** Simple deterministic RNG (Mulberry32). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
