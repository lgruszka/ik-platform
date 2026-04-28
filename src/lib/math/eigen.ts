/**
 * Minimal 3×3 symmetric eigen-decomposition via Jacobi rotations.
 * Good accuracy, small code — suitable for visualising manipulability
 * ellipsoids derived from the position block of the Jacobian.
 */

type M3 = number[][];

function identity3(): M3 { return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; }

export function jacobiEigen3(A: M3, maxSweeps = 50, tol = 1e-12): { values: number[]; vectors: M3 } {
  const a: M3 = A.map((r) => r.slice());
  const V: M3 = identity3();
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    // Find largest off-diagonal
    let p = 0, q = 1;
    let maxOff = Math.abs(a[0][1]);
    if (Math.abs(a[0][2]) > maxOff) { p = 0; q = 2; maxOff = Math.abs(a[0][2]); }
    if (Math.abs(a[1][2]) > maxOff) { p = 1; q = 2; maxOff = Math.abs(a[1][2]); }
    if (maxOff < tol) break;

    const app = a[p][p], aqq = a[q][q], apq = a[p][q];
    const theta = (aqq - app) / (2 * apq);
    const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;

    a[p][p] = app - t * apq;
    a[q][q] = aqq + t * apq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let i = 0; i < 3; i++) {
      if (i !== p && i !== q) {
        const aip = a[i][p], aiq = a[i][q];
        a[i][p] = c * aip - s * aiq;
        a[p][i] = a[i][p];
        a[i][q] = s * aip + c * aiq;
        a[q][i] = a[i][q];
      }
    }
    for (let i = 0; i < 3; i++) {
      const vip = V[i][p], viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = s * vip + c * viq;
    }
  }
  const values = [a[0][0], a[1][1], a[2][2]];
  // Sort descending
  const idx = [0, 1, 2].sort((x, y) => values[y] - values[x]);
  const sortedVals = idx.map((i) => values[i]);
  const sortedVecs: M3 = [
    [V[0][idx[0]], V[0][idx[1]], V[0][idx[2]]],
    [V[1][idx[0]], V[1][idx[1]], V[1][idx[2]]],
    [V[2][idx[0]], V[2][idx[1]], V[2][idx[2]]],
  ];
  return { values: sortedVals, vectors: sortedVecs };
}
