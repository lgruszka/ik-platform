/**
 * Minimal dense linear algebra for small matrices (≤ 10×10). Used by the
 * Jacobian-based IK solvers. All functions take plain number[][] — deliberately
 * not using the readonly Matrix4/Matrix3 tuple types, because those are fixed
 * shape.
 */

export function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

export function eye(n: number): number[][] {
  const I = zeros(n, n);
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}

export function clone(A: number[][]): number[][] {
  return A.map((r) => r.slice());
}

export function transpose(A: number[][]): number[][] {
  const m = A.length, n = A[0].length;
  const B = zeros(n, m);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) B[j][i] = A[i][j];
  return B;
}

export function matmul(A: number[][], B: number[][]): number[][] {
  const m = A.length, k = A[0].length, n = B[0].length;
  const C = zeros(m, n);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let r = 0; r < k; r++) s += A[i][r] * B[r][j];
      C[i][j] = s;
    }
  }
  return C;
}

export function matvec(A: number[][], x: number[]): number[] {
  const m = A.length, n = A[0].length;
  const y = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += A[i][j] * x[j];
    y[i] = s;
  }
  return y;
}

export function addInPlace(A: number[][], B: number[][]): number[][] {
  for (let i = 0; i < A.length; i++) for (let j = 0; j < A[0].length; j++) A[i][j] += B[i][j];
  return A;
}

export function scaleAddEye(A: number[][], lambda: number): number[][] {
  for (let i = 0; i < A.length; i++) A[i][i] += lambda;
  return A;
}

export function vnorm(x: number[]): number {
  let s = 0;
  for (const v of x) s += v * v;
  return Math.sqrt(s);
}

/**
 * Solve A·x = b in place using partial-pivoting Gauss-Jordan elimination.
 * Returns x; `A` and `b` are destroyed. Throws if A is singular.
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Augmented [A | b]
  const M = A.map((row, i) => [...row, b[i]]);
  for (let k = 0; k < n; k++) {
    // Partial pivot
    let pivot = k;
    let maxAbs = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > maxAbs) { maxAbs = Math.abs(M[i][k]); pivot = i; }
    }
    if (maxAbs < 1e-15) throw new Error("Matrix is singular to machine precision");
    if (pivot !== k) [M[k], M[pivot]] = [M[pivot], M[k]];
    // Scale pivot row
    const p = M[k][k];
    for (let j = k; j <= n; j++) M[k][j] /= p;
    // Eliminate others
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = M[i][k];
      if (f === 0) continue;
      for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
    }
  }
  return M.map((row) => row[n]);
}

/** Compute A·A^T + λ²·I (symmetric positive definite for λ > 0). */
export function dampedGram(A: number[][], lambda: number): number[][] {
  const m = A.length;
  const AAT = matmul(A, transpose(A));
  for (let i = 0; i < m; i++) AAT[i][i] += lambda * lambda;
  return AAT;
}
