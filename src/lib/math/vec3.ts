import type { Matrix3, Vec3 } from "@/lib/types";

/**
 * Drobne helpery wektorowe — bez alokacji obiektów ponad konieczność.
 * Używane przez algorytm Newtona-Eulera i wizualizacje wektorów (ω, v, ε, a, F, M).
 */

export const ZERO3: Vec3 = [0, 0, 0] as const;

export function add3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] as const;
}

export function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] as const;
}

export function neg3(a: Vec3): Vec3 {
  return [-a[0], -a[1], -a[2]] as const;
}

export function scale3(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s] as const;
}

export function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ] as const;
}

export function norm3(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Iloczyn macierzy 3×3 i wektora 3D. */
export function mat3mulVec3(M: Matrix3, v: Vec3): Vec3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ] as const;
}

/** Transponowana macierz 3×3 razy wektor (R^T·v). Używane do transformacji
 *  przeciwnej w Newton-Eulerze: gdy mamy R_{i+1}^i, to do układu (i+1) z (i)
 *  używamy transpozycji. */
export function mat3TmulVec3(M: Matrix3, v: Vec3): Vec3 {
  return [
    M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2],
    M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2],
    M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2],
  ] as const;
}
