import type { IKSolution, JointConfig, Matrix4, RobotModel } from "@/lib/types";
import { forwardKinematics } from "@/lib/robots/dh";
import { geometricJacobian, manipulability } from "@/lib/math/jacobian";
import { poseTwistError, errorNorms } from "@/lib/math/twist";
import {
  dampedGram,
  matvec,
  solveLinearSystem,
  transpose,
  vnorm,
} from "@/lib/math/linalg";

export type JacobianMethod = "transpose" | "pinv" | "dls" | "sdls";

export type JacobianSolverOptions = {
  method: JacobianMethod;
  maxIter?: number;
  tolLin?: number;                  // position tolerance [m]
  tolAng?: number;                  // orientation tolerance [rad]
  stepSize?: number;                // α multiplier on Δq (default 1.0 for pinv/dls)
  lambda?: number;                  // DLS damping
  lambdaMax?: number;               // SDLS max per-component step
};

export type IterationTrace = {
  iter: number;
  q: number[];
  errLin: number;
  errAng: number;
  w: number;  // manipulability
  dqNorm: number;
};

export type JacobianSolution = IKSolution & {
  trace: IterationTrace[];
  method: JacobianMethod;
};

/**
 * Solve IK iteratively via a Jacobian-based update rule. Converged when both
 * position error < tolLin and orientation error < tolAng.
 *
 * Update rules:
 *   transpose:  Δq = α · Jᵀ · e
 *   pinv:       Δq = J⁺ · e                  (via J·Jᵀ or JᵀJ)
 *   dls:        Δq = Jᵀ · (J·Jᵀ + λ²I)⁻¹ · e (Levenberg-Marquardt)
 *   sdls:       per-component damping by Buss-Kim 2005 (simplified variant)
 */
export function solveIterative(
  robot: RobotModel,
  target: Matrix4,
  seed: JointConfig,
  options: JacobianSolverOptions,
): JacobianSolution {
  const maxIter = options.maxIter ?? 100;
  const tolLin = options.tolLin ?? 1e-4;
  const tolAng = options.tolAng ?? 1e-3;
  const alpha = options.stepSize ?? 1.0;
  const lambda = options.lambda ?? 0.1;

  const q: number[] = [...seed];
  const trace: IterationTrace[] = [];
  const t0 = performance.now();

  let iter = 0;
  let success = false;
  for (iter = 0; iter <= maxIter; iter++) {
    const Tcur = forwardKinematics(robot, q as unknown as JointConfig);
    const e = poseTwistError(Tcur, target);
    const { lin, ang } = errorNorms(e);
    const J = geometricJacobian(robot, q as unknown as JointConfig);
    const w = manipulability(J);

    if (lin < tolLin && ang < tolAng) {
      trace.push({ iter, q: q.slice(), errLin: lin, errAng: ang, w, dqNorm: 0 });
      success = true;
      break;
    }
    if (iter === maxIter) {
      trace.push({ iter, q: q.slice(), errLin: lin, errAng: ang, w, dqNorm: 0 });
      break;
    }

    let dq: number[];
    const Jt = transpose(J);
    switch (options.method) {
      case "transpose": {
        // Δq = α · (Jᵀe) with adaptive α = <JJᵀe, e> / ‖JJᵀe‖² (Wampler 1986)
        const JtE = matvec(Jt, e);
        const JJtE = matvec(J, JtE);
        const num = e.reduce((s, v, i) => s + v * JJtE[i], 0);
        const den = JJtE.reduce((s, v) => s + v * v, 0) + 1e-12;
        const aStar = alpha * (num / den);
        dq = JtE.map((v) => aStar * v);
        break;
      }
      case "pinv": {
        // Δq = Jᵀ · (JJᵀ)⁻¹ · e ; fall back to tiny-λ DLS if J·Jᵀ is singular.
        try {
          const JJt = dampedGram(J, 0);
          const y = solveLinearSystem(JJt, e);
          dq = matvec(Jt, y).map((v) => alpha * v);
        } catch {
          const M = dampedGram(J, 1e-4);
          const y = solveLinearSystem(M, e);
          dq = matvec(Jt, y).map((v) => alpha * v);
        }
        break;
      }
      case "dls": {
        // Δq = Jᵀ · (JJᵀ + λ²I)⁻¹ · e
        const M = dampedGram(J, lambda);
        const y = solveLinearSystem(M, e);
        dq = matvec(Jt, y).map((v) => alpha * v);
        break;
      }
      case "sdls": {
        // Adaptive DLS (Levenberg-Marquardt style): damping scales with the
        // current residual norm — large damping far from the target, tiny near
        // it. Combined with a per-joint step cap this makes the solver both
        // robust at singularities and precise near convergence.
        const eNorm = Math.hypot(...e);
        const lamEff = Math.max(lambda, 0.05 * eNorm);
        const M = dampedGram(J, lamEff);
        const y = solveLinearSystem(M, e);
        dq = matvec(Jt, y).map((v) => alpha * v);
        const cap = options.lambdaMax ?? 0.3;
        const dqn = Math.max(...dq.map(Math.abs));
        if (dqn > cap) dq = dq.map((v) => (v * cap) / dqn);
        break;
      }
    }

    const dqNorm = vnorm(dq);
    trace.push({ iter, q: q.slice(), errLin: lin, errAng: ang, w, dqNorm });
    for (let i = 0; i < 6; i++) q[i] += dq[i];
  }

  const final = trace[trace.length - 1];
  return {
    joints: q as unknown as JointConfig,
    success,
    residual: Math.hypot(final.errLin, final.errAng),
    iterations: final.iter,
    timeMs: performance.now() - t0,
    trace,
    method: options.method,
  };
}
