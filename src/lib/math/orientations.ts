import type { Matrix3, Vec3 } from "@/lib/types";

/**
 * Konwersje między pięcioma reprezentacjami orientacji w 3D:
 *   - macierz rotacji  R ∈ SO(3) (3×3, ortogonalna, det = +1)
 *   - kąty Eulera RPY  (roll, pitch, yaw) — konwencja ZYX intrinsic
 *   - axis-angle       (k̂ jednostkowa oś, θ kąt)
 *   - wektor rotacji   r = θ·k̂  ∈ ℝ³
 *   - kwaternion jedn. q = (w, x, y, z) z ‖q‖ = 1
 *
 * Wszystkie wzory są standardowe; wybrałem implementacje numerycznie stabilne
 * (Shepperd dla R→q, obsługa θ ≈ 0 i θ ≈ π osobno).
 */

export type Quaternion = readonly [number, number, number, number]; // (w, x, y, z)
export type AxisAngle = { axis: Vec3; angle: number };

const EPS = 1e-9;

// ============================================================================
// Macierz ↔ axis-angle
// ============================================================================

/** Wzór Rodriguesa: R = I + sin(θ)·[k]× + (1−cos(θ))·[k]×². */
export function axisAngleToMatrix(axis: Vec3, angle: number): Matrix3 {
  const n = Math.hypot(axis[0], axis[1], axis[2]);
  if (n < EPS) {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ] as const;
  }
  const kx = axis[0] / n, ky = axis[1] / n, kz = axis[2] / n;
  const c = Math.cos(angle), s = Math.sin(angle);
  const C = 1 - c;
  return [
    [c + kx*kx*C,    kx*ky*C - kz*s, kx*kz*C + ky*s],
    [ky*kx*C + kz*s, c + ky*ky*C,    ky*kz*C - kx*s],
    [kz*kx*C - ky*s, kz*ky*C + kx*s, c + kz*kz*C   ],
  ] as const;
}

/** Wyciągnij oś i kąt z macierzy rotacji. Obsługuje przypadki θ ≈ 0 i θ ≈ π. */
export function matrixToAxisAngle(R: Matrix3): AxisAngle {
  const trace = R[0][0] + R[1][1] + R[2][2];
  const cosTheta = (trace - 1) / 2;
  // numeryczne ograniczenie do [-1, 1]
  const c = Math.max(-1, Math.min(1, cosTheta));
  const theta = Math.acos(c);

  if (theta < EPS) {
    // Brak rotacji — oś nieokreślona, ustalmy umownie z
    return { axis: [0, 0, 1] as const, angle: 0 };
  }
  if (Math.abs(Math.PI - theta) < 1e-4) {
    // Bliski π — wzór z (R+I)/2 dla stabilności
    const xx = (R[0][0] + 1) / 2;
    const yy = (R[1][1] + 1) / 2;
    const zz = (R[2][2] + 1) / 2;
    let kx = Math.sqrt(Math.max(0, xx));
    let ky = Math.sqrt(Math.max(0, yy));
    let kz = Math.sqrt(Math.max(0, zz));
    // Wybierz znaki na podstawie pozadiagonalnych (większa wartość → wiarygodniejsza)
    if (xx >= yy && xx >= zz) {
      ky = Math.sign(R[0][1] + R[1][0]) * ky || ky;
      kz = Math.sign(R[0][2] + R[2][0]) * kz || kz;
    } else if (yy >= zz) {
      kx = Math.sign(R[0][1] + R[1][0]) * kx || kx;
      kz = Math.sign(R[1][2] + R[2][1]) * kz || kz;
    } else {
      kx = Math.sign(R[0][2] + R[2][0]) * kx || kx;
      ky = Math.sign(R[1][2] + R[2][1]) * ky || ky;
    }
    const n = Math.hypot(kx, ky, kz) || 1;
    return { axis: [kx / n, ky / n, kz / n] as const, angle: Math.PI };
  }
  const f = 1 / (2 * Math.sin(theta));
  return {
    axis: [
      f * (R[2][1] - R[1][2]),
      f * (R[0][2] - R[2][0]),
      f * (R[1][0] - R[0][1]),
    ] as const,
    angle: theta,
  };
}

// ============================================================================
// Wektor rotacji ↔ macierz / axis-angle
// ============================================================================

/** Wektor rotacji r = θ·k̂ ∈ ℝ³. Długość = kąt obrotu, kierunek = oś. */
export function rotationVectorToMatrix(r: Vec3): Matrix3 {
  const theta = Math.hypot(r[0], r[1], r[2]);
  if (theta < EPS) {
    return [[1,0,0],[0,1,0],[0,0,1]] as const;
  }
  return axisAngleToMatrix([r[0]/theta, r[1]/theta, r[2]/theta], theta);
}

export function matrixToRotationVector(R: Matrix3): Vec3 {
  const { axis, angle } = matrixToAxisAngle(R);
  return [axis[0] * angle, axis[1] * angle, axis[2] * angle] as const;
}

// ============================================================================
// Macierz ↔ kwaternion
// ============================================================================

/** Macierz → kwaternion (algorytm Shepperd'a — wybiera wariant bazujący na
 *  największym elemencie diagonali, dla stabilności numerycznej). */
export function matrixToQuaternion(R: Matrix3): Quaternion {
  const t = R[0][0] + R[1][1] + R[2][2];
  if (t > 0) {
    const s = 2 * Math.sqrt(t + 1);
    return [
      0.25 * s,
      (R[2][1] - R[1][2]) / s,
      (R[0][2] - R[2][0]) / s,
      (R[1][0] - R[0][1]) / s,
    ] as const;
  }
  if (R[0][0] > R[1][1] && R[0][0] > R[2][2]) {
    const s = 2 * Math.sqrt(1 + R[0][0] - R[1][1] - R[2][2]);
    return [
      (R[2][1] - R[1][2]) / s,
      0.25 * s,
      (R[0][1] + R[1][0]) / s,
      (R[0][2] + R[2][0]) / s,
    ] as const;
  }
  if (R[1][1] > R[2][2]) {
    const s = 2 * Math.sqrt(1 + R[1][1] - R[0][0] - R[2][2]);
    return [
      (R[0][2] - R[2][0]) / s,
      (R[0][1] + R[1][0]) / s,
      0.25 * s,
      (R[1][2] + R[2][1]) / s,
    ] as const;
  }
  const s = 2 * Math.sqrt(1 + R[2][2] - R[0][0] - R[1][1]);
  return [
    (R[1][0] - R[0][1]) / s,
    (R[0][2] + R[2][0]) / s,
    (R[1][2] + R[2][1]) / s,
    0.25 * s,
  ] as const;
}

export function quaternionToMatrix(q: Quaternion): Matrix3 {
  const [w, x, y, z] = q;
  const n = w*w + x*x + y*y + z*z;
  if (n < EPS) return [[1,0,0],[0,1,0],[0,0,1]] as const;
  // normalizacja "w locie" — żeby nie było wymogu jednostkowego q na wejściu
  const s = 2 / n;
  const wx = w*x*s, wy = w*y*s, wz = w*z*s;
  const xx = x*x*s, xy = x*y*s, xz = x*z*s;
  const yy = y*y*s, yz = y*z*s, zz = z*z*s;
  return [
    [1 - (yy + zz), xy - wz,       xz + wy      ],
    [xy + wz,       1 - (xx + zz), yz - wx      ],
    [xz - wy,       yz + wx,       1 - (xx + yy)],
  ] as const;
}

// ============================================================================
// Axis-angle ↔ kwaternion (bezpośrednio, bez przejścia przez macierz)
// ============================================================================

export function axisAngleToQuaternion(axis: Vec3, angle: number): Quaternion {
  const n = Math.hypot(axis[0], axis[1], axis[2]);
  if (n < EPS) return [1, 0, 0, 0] as const;
  const half = angle / 2;
  const s = Math.sin(half) / n;
  return [Math.cos(half), axis[0]*s, axis[1]*s, axis[2]*s] as const;
}

export function quaternionToAxisAngle(q: Quaternion): AxisAngle {
  const [w, x, y, z] = q;
  const n = Math.hypot(x, y, z);
  if (n < EPS) return { axis: [0, 0, 1] as const, angle: 0 };
  const angle = 2 * Math.atan2(n, w);
  return { axis: [x / n, y / n, z / n] as const, angle };
}

// ============================================================================
// Kompozycja rotacji
// ============================================================================

/** Iloczyn kwaternionów: q1 · q2 (kompozycja: najpierw q2, potem q1). */
export function quaternionMultiply(q1: Quaternion, q2: Quaternion): Quaternion {
  const [w1, x1, y1, z1] = q1;
  const [w2, x2, y2, z2] = q2;
  return [
    w1*w2 - x1*x2 - y1*y2 - z1*z2,
    w1*x2 + x1*w2 + y1*z2 - z1*y2,
    w1*y2 - x1*z2 + y1*w2 + z1*x2,
    w1*z2 + x1*y2 - y1*x2 + z1*w2,
  ] as const;
}

export function quaternionConjugate(q: Quaternion): Quaternion {
  return [q[0], -q[1], -q[2], -q[3]] as const;
}

export function quaternionNorm(q: Quaternion): number {
  return Math.hypot(q[0], q[1], q[2], q[3]);
}

export function quaternionNormalize(q: Quaternion): Quaternion {
  const n = quaternionNorm(q);
  if (n < EPS) return [1, 0, 0, 0] as const;
  return [q[0]/n, q[1]/n, q[2]/n, q[3]/n] as const;
}

// ============================================================================
// SLERP — sferyczna interpolacja liniowa kwaternionów
// ============================================================================

/** Interpolacja po krótszej drodze na sferze 4D, gładka i o stałej prędkości
 *  kątowej. Standardowy sposób interpolacji orientacji w grafice i robotyce. */
export function quaternionSlerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
  let dot = q1[0]*q2[0] + q1[1]*q2[1] + q1[2]*q2[2] + q1[3]*q2[3];
  let q2Adj: Quaternion = q2;
  // Jeśli iloczyn skalarny ujemny — odbijemy q2, żeby iść po krótszej drodze
  if (dot < 0) {
    q2Adj = [-q2[0], -q2[1], -q2[2], -q2[3]] as const;
    dot = -dot;
  }
  if (dot > 0.9995) {
    // Bardzo blisko siebie — interpolacja liniowa + normalizacja (nlerp)
    return quaternionNormalize([
      q1[0] + t*(q2Adj[0] - q1[0]),
      q1[1] + t*(q2Adj[1] - q1[1]),
      q1[2] + t*(q2Adj[2] - q1[2]),
      q1[3] + t*(q2Adj[3] - q1[3]),
    ] as const);
  }
  const theta0 = Math.acos(dot);
  const theta = theta0 * t;
  const sinTheta0 = Math.sin(theta0);
  const s1 = Math.cos(theta) - dot * Math.sin(theta) / sinTheta0;
  const s2 = Math.sin(theta) / sinTheta0;
  return [
    s1*q1[0] + s2*q2Adj[0],
    s1*q1[1] + s2*q2Adj[1],
    s1*q1[2] + s2*q2Adj[2],
    s1*q1[3] + s2*q2Adj[3],
  ] as const;
}
