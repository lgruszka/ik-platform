/**
 * Pomocnicze funkcje dla planarnego manipulatora 2R z dwoma równymi
 * ogniwami (L1 = L2 = 1). Używamy jako prostego przykładu w demach
 * IKFlow i diffusion — wystarczy dwie zmienne (q1, q2), ale jest
 * dokładnie ta sama struktura multi-modalna co u Pumy (elbow up/down).
 */

export const L1 = 1;
export const L2 = 1;

export type Pose2R = {
  base: { x: number; y: number };
  elbow: { x: number; y: number };
  tip: { x: number; y: number };
};

/** Forward kinematics dla 2R. */
export function fk2R(q1: number, q2: number): Pose2R {
  const base = { x: 0, y: 0 };
  const elbow = { x: L1 * Math.cos(q1), y: L1 * Math.sin(q1) };
  const tip = {
    x: elbow.x + L2 * Math.cos(q1 + q2),
    y: elbow.y + L2 * Math.sin(q1 + q2),
  };
  return { base, elbow, tip };
}

/** Inverse kinematics 2R: zwraca dwa rozwiązania (elbow up/down) lub null. */
export function ik2R(x: number, y: number): { up: [number, number]; down: [number, number] } | null {
  const r2 = x * x + y * y;
  const D = (r2 - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  if (Math.abs(D) > 1) return null;
  const q2_up = Math.acos(D);
  const q2_down = -Math.acos(D);
  const phi = Math.atan2(y, x);
  const q1_up = phi - Math.atan2(L2 * Math.sin(q2_up), L1 + L2 * Math.cos(q2_up));
  const q1_down = phi - Math.atan2(L2 * Math.sin(q2_down), L1 + L2 * Math.cos(q2_down));
  return { up: [q1_up, q2_up], down: [q1_down, q2_down] };
}

/** Prosty deterministyczny generator pseudo-losowy (mulberry32). */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Para gaussowskich liczb przez transformację Boxa-Mullera. */
export function gauss(rand: () => number): [number, number] {
  const u = Math.max(1e-6, rand()), v = rand();
  return [
    Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v),
    Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v),
  ];
}
