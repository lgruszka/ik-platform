import { PUMA560, forwardKinematics } from "@/lib/robots";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import { matrixToRpy } from "@/lib/math/rotations";
import type { JointConfig } from "@/lib/types";

/** Joint limits used for normalisation. */
export const JOINT_LIMS = PUMA560.dh.map((d) => d.limits ?? { min: -Math.PI, max: Math.PI });

/** Approximate pose extents for normalisation (derived empirically from random sampling). */
export const POSE_NORM = {
  posMin: -0.9, posMax: 0.9,
  rpyMin: -Math.PI, rpyMax: Math.PI,
};

export function normaliseJoints(q: JointConfig): number[] {
  return q.map((v, i) => {
    const lim = JOINT_LIMS[i];
    return (2 * (v - lim.min)) / (lim.max - lim.min) - 1;
  });
}

export function denormaliseJoints(n: number[]): JointConfig {
  return n.map((v, i) => {
    const lim = JOINT_LIMS[i];
    return lim.min + ((v + 1) / 2) * (lim.max - lim.min);
  }) as unknown as JointConfig;
}

export function normalisePose(pos: readonly [number, number, number], rpy: readonly [number, number, number]): number[] {
  const n = (x: number, lo: number, hi: number) => (2 * (x - lo)) / (hi - lo) - 1;
  return [
    n(pos[0], POSE_NORM.posMin, POSE_NORM.posMax),
    n(pos[1], POSE_NORM.posMin, POSE_NORM.posMax),
    n(pos[2], POSE_NORM.posMin, POSE_NORM.posMax),
    n(rpy[0], POSE_NORM.rpyMin, POSE_NORM.rpyMax),
    n(rpy[1], POSE_NORM.rpyMin, POSE_NORM.rpyMax),
    n(rpy[2], POSE_NORM.rpyMin, POSE_NORM.rpyMax),
  ];
}

export type Sample = { x: number[]; y: number[] };

/** Generate (pose, q) pairs by sampling q uniformly in joint limits, then FK. */
export function generateDataset(n: number, seed = 42): Sample[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const out: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const q = JOINT_LIMS.map((lim) => lim.min + rand() * (lim.max - lim.min)) as unknown as JointConfig;
    const T = forwardKinematics(PUMA560, q);
    const p = extractPosition(T);
    const rpy = matrixToRpy(extractRotation(T));
    out.push({ x: normalisePose(p, rpy), y: normaliseJoints(q) });
  }
  return out;
}
