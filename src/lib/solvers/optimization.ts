import type { IKSolution, JointConfig, Matrix4, RobotModel } from "@/lib/types";
import { forwardKinematics } from "@/lib/robots/dh";
import { poseTwistError, errorNorms } from "@/lib/math/twist";
import { geometricJacobian } from "@/lib/math/jacobian";
import { matvec, transpose, vnorm } from "@/lib/math/linalg";

export type CostWeights = {
  /** Position error weight (applied to ‖Δp‖²). */
  lin: number;
  /** Orientation error weight (applied to ‖ω‖²). */
  ang: number;
  /** Penalty factor for violating joint limits (quadratic). */
  jointPenalty: number;
  /** Attraction toward `seed` (regularisation) — zero for pure IK. */
  seedAttraction?: number;
};

export const DEFAULT_WEIGHTS: CostWeights = {
  lin: 1.0,
  ang: 0.2,
  jointPenalty: 10.0,
  seedAttraction: 0,
};

export type CostFunction = (q: number[]) => number;

/** Build a scalar cost function for IK: weighted squared twist error + limits. */
export function buildIKCost(
  robot: RobotModel,
  target: Matrix4,
  seed: JointConfig,
  weights: CostWeights = DEFAULT_WEIGHTS,
): CostFunction {
  return (q: number[]) => {
    const T = forwardKinematics(robot, q as unknown as JointConfig);
    const e = poseTwistError(T, target);
    const lin2 = e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
    const ang2 = e[3] * e[3] + e[4] * e[4] + e[5] * e[5];
    let cost = weights.lin * lin2 + weights.ang * ang2;

    // Joint limits penalty
    for (let i = 0; i < robot.dh.length; i++) {
      const lim = robot.dh[i].limits;
      if (!lim) continue;
      if (q[i] < lim.min) {
        const d = lim.min - q[i];
        cost += weights.jointPenalty * d * d;
      } else if (q[i] > lim.max) {
        const d = q[i] - lim.max;
        cost += weights.jointPenalty * d * d;
      }
    }

    // Seed attraction
    if (weights.seedAttraction && weights.seedAttraction > 0) {
      let dq2 = 0;
      for (let i = 0; i < q.length; i++) {
        let delta = q[i] - seed[i];
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        dq2 += delta * delta;
      }
      cost += weights.seedAttraction * dq2;
    }
    return cost;
  };
}

/** Nelder-Mead downhill simplex. Classic coefficients (α=1, γ=2, ρ=0.5, σ=0.5). */
export type NelderMeadOptions = {
  maxIter?: number;
  tol?: number;
  initialStep?: number;
};

export type OptTrace = {
  iter: number;
  q: number[];
  cost: number;
};

export function nelderMead(
  cost: CostFunction,
  x0: number[],
  options: NelderMeadOptions = {},
): { x: number[]; fx: number; iter: number; trace: OptTrace[] } {
  const n = x0.length;
  const maxIter = options.maxIter ?? 2000;
  const tol = options.tol ?? 1e-8;
  const step = options.initialStep ?? 0.1;
  const alpha = 1.0, gamma = 2.0, rho = 0.5, sigma = 0.5;

  let simplex: number[][] = [x0.slice()];
  for (let i = 0; i < n; i++) {
    const v = x0.slice();
    v[i] += step;
    simplex.push(v);
  }
  let values = simplex.map(cost);
  const trace: OptTrace[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    // Sort by cost ascending
    const idx = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
    simplex = idx.map((i) => simplex[i]);
    values = idx.map((i) => values[i]);

    const best = values[0];
    const worst = values[n];
    const secondWorst = values[n - 1];
    trace.push({ iter, q: simplex[0].slice(), cost: best });

    // Convergence: range of values tiny
    if (worst - best < tol) {
      return { x: simplex[0], fx: best, iter, trace };
    }

    // Centroid of all but worst
    const centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) centroid[j] += simplex[i][j] / n;
    }

    // Reflection
    const reflected = centroid.map((c, i) => c + alpha * (c - simplex[n][i]));
    const fR = cost(reflected);
    if (best <= fR && fR < secondWorst) {
      simplex[n] = reflected;
      values[n] = fR;
      continue;
    }
    // Expansion
    if (fR < best) {
      const expanded = centroid.map((c, i) => c + gamma * (reflected[i] - c));
      const fE = cost(expanded);
      if (fE < fR) { simplex[n] = expanded; values[n] = fE; }
      else         { simplex[n] = reflected; values[n] = fR; }
      continue;
    }
    // Contraction
    const contracted = centroid.map((c, i) => c + rho * (simplex[n][i] - c));
    const fC = cost(contracted);
    if (fC < worst) { simplex[n] = contracted; values[n] = fC; continue; }
    // Shrink
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < n; j++) {
        simplex[i][j] = simplex[0][j] + sigma * (simplex[i][j] - simplex[0][j]);
      }
      values[i] = cost(simplex[i]);
    }
  }
  return { x: simplex[0], fx: values[0], iter: maxIter, trace };
}

/** Steepest-descent with Armijo backtracking line search. */
export type GradientDescentOptions = {
  maxIter?: number;
  tol?: number;
  initialStep?: number;
  armijoC?: number;
  backtrack?: number;
};

export function gradientDescent(
  robot: RobotModel,
  target: Matrix4,
  cost: CostFunction,
  x0: number[],
  options: GradientDescentOptions = {},
): { x: number[]; fx: number; iter: number; trace: OptTrace[] } {
  const maxIter = options.maxIter ?? 500;
  const tol = options.tol ?? 1e-10;
  const armijoC = options.armijoC ?? 1e-4;
  const backtrack = options.backtrack ?? 0.5;
  let alpha = options.initialStep ?? 0.5;

  const x = x0.slice();
  let fx = cost(x);
  const trace: OptTrace[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    trace.push({ iter, q: x.slice(), cost: fx });
    if (fx < tol) return { x, fx, iter, trace };

    // Gradient via Jacobian at current q: ∇(½‖e‖²) = −Jᵀe (position+orient parts, with weights)
    const J = geometricJacobian(robot, x as unknown as JointConfig);
    const T = forwardKinematics(robot, x as unknown as JointConfig);
    const e = poseTwistError(T, target);
    // weighted error for gradient
    // For cost = w_lin·|e_lin|² + w_ang·|e_ang|², ∇ = -2·Jᵀ·Wᵥ·e
    const W = [1, 1, 1, 0.2, 0.2, 0.2];
    const We = e.map((v, i) => v * W[i]);
    const JtWe = matvec(transpose(J), We);
    const grad = JtWe.map((v) => -2 * v);
    const gNorm = vnorm(grad);
    if (gNorm < 1e-10) return { x, fx, iter, trace };

    const dir = grad.map((v) => -v);
    // Armijo backtracking
    let step = alpha;
    const slope = armijoC * grad.reduce((s, v, i) => s + v * dir[i], 0);
    let nextFx = fx;
    for (let k = 0; k < 25; k++) {
      const xNew = x.map((v, i) => v + step * dir[i]);
      nextFx = cost(xNew);
      if (nextFx <= fx + step * slope) {
        for (let i = 0; i < x.length; i++) x[i] = xNew[i];
        break;
      }
      step *= backtrack;
    }
    if (nextFx >= fx) {
      // No progress — bail
      return { x, fx, iter, trace };
    }
    fx = nextFx;
    alpha = Math.min(1.0, step / backtrack); // allow slight increase next iter
  }
  return { x, fx, iter: maxIter, trace };
}

/** Convenience wrapper producing an IKSolution. */
export function solveByOptimization(
  robot: RobotModel,
  target: Matrix4,
  seed: JointConfig,
  method: "nelder-mead" | "gradient",
  weights: CostWeights = DEFAULT_WEIGHTS,
): IKSolution & { trace: OptTrace[]; method: string } {
  const cost = buildIKCost(robot, target, seed, weights);
  const t0 = performance.now();
  const res =
    method === "nelder-mead"
      ? nelderMead(cost, seed.slice(), { maxIter: 2000, tol: 1e-10, initialStep: 0.1 })
      : gradientDescent(robot, target, cost, seed.slice(), { maxIter: 500, initialStep: 0.5 });
  const T = forwardKinematics(robot, res.x as unknown as JointConfig);
  const e = poseTwistError(T, target);
  const { lin, ang } = errorNorms(e);
  return {
    joints: res.x as unknown as JointConfig,
    success: lin < 1e-3 && ang < 1e-2,
    residual: Math.hypot(lin, ang),
    iterations: res.iter,
    timeMs: performance.now() - t0,
    trace: res.trace,
    method,
  };
}
