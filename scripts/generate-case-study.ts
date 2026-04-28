/**
 * Generuje wszystkie wartości pośrednie dla konkretnego przypadku IK Pumy560.
 * Wynik można skopiować do docs/case-study-liczbowy.md jako referencję.
 *
 * Uruchomienie:  npx tsx scripts/generate-case-study.ts
 */
import { PUMA560, PUMA_A2, PUMA_A3, PUMA_D3, PUMA_D4, forwardKinematics } from "@/lib/robots";
import { solvePuma560Analytical } from "@/lib/solvers/analytical-puma560";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import { matrixToRpy } from "@/lib/math/rotations";
import type { JointConfig, Matrix4, Matrix3 } from "@/lib/types";

// Wybrany przypadek testowy — rozsądna konfiguracja daleka od singularności.
const Q_TRUE: JointConfig = [
  30 * Math.PI / 180,   // q1 = 30°
  -60 * Math.PI / 180,  // q2 = -60°
  120 * Math.PI / 180,  // q3 = 120°
  20 * Math.PI / 180,   // q4 = 20°
  40 * Math.PI / 180,   // q5 = 40°
  15 * Math.PI / 180,   // q6 = 15°
];

const deg = (rad: number) => (rad * 180) / Math.PI;
const fmt = (x: number, d = 4) => x.toFixed(d);

function formatMatrix(M: Matrix4 | Matrix3, digits = 4, indent = "  "): string {
  const rows = (M as readonly (readonly number[])[]).map((row) =>
    row.map((v) => fmt(v, digits).padStart(digits + 5)).join("  "),
  );
  return rows.map((r) => indent + "| " + r + " |").join("\n");
}

console.log("=".repeat(80));
console.log("CASE STUDY LICZBOWY — IK Puma560 (modified DH, Craig)");
console.log("=".repeat(80));

// ============================================================================
// KROK 0: Dana konfiguracja i obliczenie pozy docelowej
// ============================================================================
console.log("\n--- KROK 0: Dana konfiguracja (z której wyznaczymy T*) ---");
console.log(`q_true = (${Q_TRUE.map((q) => `${deg(q).toFixed(1)}°`).join(", ")})`);
console.log(`       = (${Q_TRUE.map((q) => fmt(q, 4)).join(", ")}) rad`);

const T_target = forwardKinematics(PUMA560, Q_TRUE);
const R_target = extractRotation(T_target);
const p_target = extractPosition(T_target);
const rpy_target = matrixToRpy(R_target);

console.log("\nFK(q_true) → T* :");
console.log(formatMatrix(T_target));

console.log(`\n  p = (${p_target.map((v) => fmt(v, 4)).join(", ")}) [m]`);
console.log(`  RPY = (${rpy_target.map((r) => `${deg(r).toFixed(2)}°`).join(", ")})`);

// ============================================================================
// KROK 0b: T06 (dla Pumy bez narzędzia T06 = T*)
// ============================================================================
console.log("\n--- KROK 0b: Sprowadzenie pozy do układu wrist ---");
console.log("Puma560 ma d6 = 0 i brak narzędzia, więc T06 = T*");
console.log(`  p_wc = p = (${p_target.map((v) => fmt(v, 4)).join(", ")})`);
const [px, py, pz] = p_target;
const R = R_target;
const [r11, r12, r13] = [R[0][0], R[0][1], R[0][2]];
const [r21, r22, r23] = [R[1][0], R[1][1], R[1][2]];
const [r31, r32, r33] = [R[2][0], R[2][1], R[2][2]];

// ============================================================================
// KROK 1+2: q1 — dwie gałęzie shoulder
// ============================================================================
console.log("\n--- KROK 1+2: Wyznaczenie q1 (dwie gałęzie shoulder) ---");
const r_xy_sq = px * px + py * py;
const disc_q1 = r_xy_sq - PUMA_D3 ** 2;
console.log(`  p_x² + p_y² = ${fmt(r_xy_sq, 5)}`);
console.log(`  d3² = ${fmt(PUMA_D3 ** 2, 5)}`);
console.log(`  p_x² + p_y² − d3² = ${fmt(disc_q1, 5)}  (≥ 0 ⇒ osiągalne)`);

const rho_abs = Math.sqrt(Math.max(0, disc_q1));
const phi = Math.atan2(py, px);
console.log(`\n  ρ = ±√(p_x² + p_y² − d3²) = ±${fmt(rho_abs, 4)} m`);
console.log(`  φ = atan2(p_y, p_x) = ${deg(phi).toFixed(3)}°`);

for (const rhoSign of [+1, -1] as const) {
  const rho = rhoSign * rho_abs;
  const q1 = phi - Math.atan2(PUMA_D3, rho);
  const shoulder = rhoSign > 0 ? "right" : "left ";
  console.log(`  ρ = ${fmt(rho, 4).padStart(8)}  →  ${shoulder}  →  q1 = φ − atan2(d3, ρ) = ${deg(q1).toFixed(3)}°`);
}

// ============================================================================
// KROK 3+4: Efektywna długość L, β, K, q3
// ============================================================================
console.log("\n--- KROK 3+4: Efektywna długość L, kąt β, q3 (dwie gałęzie elbow) ---");
const L = Math.sqrt(PUMA_A3 ** 2 + PUMA_D4 ** 2);
const beta = Math.atan2(PUMA_D4, PUMA_A3);
console.log(`  L = √(a3² + d4²) = √(${fmt(PUMA_A3**2, 5)} + ${fmt(PUMA_D4**2, 5)}) = ${fmt(L, 5)} m`);
console.log(`  β = atan2(d4, a3) = atan2(${PUMA_D4}, ${PUMA_A3}) = ${deg(beta).toFixed(3)}°`);

// Gałąź shoulder-right
const rho = +rho_abs;
const K = (rho ** 2 + pz ** 2 - PUMA_A2 ** 2 - PUMA_A3 ** 2 - PUMA_D4 ** 2) / (2 * PUMA_A2);
console.log(`\n  Dla gałęzi shoulder-right (ρ = ${fmt(rho, 4)} m):`);
console.log(`    K = (ρ² + p_z² − a2² − a3² − d4²) / (2·a2)`);
console.log(`      = (${fmt(rho**2, 5)} + ${fmt(pz**2, 5)} − ${fmt(PUMA_A2**2, 5)} − ${fmt(PUMA_A3**2, 5)} − ${fmt(PUMA_D4**2, 5)}) / (2·${PUMA_A2})`);
console.log(`      = ${fmt(K, 5)}`);

const disc = L * L - K * K;
console.log(`    L² − K² = ${fmt(disc, 6)}   (≥ 0 ⇒ osiągalne)`);
const sqrtD = Math.sqrt(Math.max(0, disc));

for (const elbowSign of [+1, -1] as const) {
  const q3 = Math.atan2(elbowSign * sqrtD, K) - beta;
  const elbow = elbowSign > 0 ? "up  " : "down";
  console.log(`    elbow-${elbow}  →  q3 = atan2(${elbowSign > 0 ? "+" : "-"}√(L²−K²), K) − β = ${deg(q3).toFixed(3)}°`);
}

// ============================================================================
// KROK 5: q2 dla gałęzi shoulder-right, elbow-up
// ============================================================================
console.log("\n--- KROK 5: q2 z układu liniowego 2×2 (shoulder-right, elbow-up) ---");
const q1_rightup = phi - Math.atan2(PUMA_D3, rho);
const q3_rightup = Math.atan2(+sqrtD, K) - beta;
const c3 = Math.cos(q3_rightup);
const s3 = Math.sin(q3_rightup);
const M = PUMA_A2 + PUMA_A3 * c3 - PUMA_D4 * s3;
const N = PUMA_A3 * s3 + PUMA_D4 * c3;
const denom = M * M + N * N;
const c2 = (M * rho - N * pz) / denom;
const s2 = (-M * pz - N * rho) / denom;
const q2 = Math.atan2(s2, c2);

console.log(`  c3 = cos(${deg(q3_rightup).toFixed(3)}°) = ${fmt(c3, 5)}`);
console.log(`  s3 = sin(${deg(q3_rightup).toFixed(3)}°) = ${fmt(s3, 5)}`);
console.log(`  M = a2 + a3·c3 − d4·s3 = ${fmt(M, 5)}`);
console.log(`  N = a3·s3 + d4·c3 = ${fmt(N, 5)}`);
console.log(`  M² + N² = ${fmt(denom, 5)}`);
console.log(`  c2 = (M·ρ − N·p_z) / (M² + N²) = ${fmt(c2, 5)}`);
console.log(`  s2 = (−M·p_z − N·ρ) / (M² + N²) = ${fmt(s2, 5)}`);
console.log(`  q2 = atan2(s2, c2) = ${deg(q2).toFixed(3)}°`);

// ============================================================================
// KROK 6: R03 i R36
// ============================================================================
console.log("\n--- KROK 6: Obliczenie R03 i residuum R36 = (R03)ᵀ·R ---");
const c1 = Math.cos(q1_rightup), s1 = Math.sin(q1_rightup);
const c23 = Math.cos(q2 + q3_rightup), s23 = Math.sin(q2 + q3_rightup);
console.log(`  c1 = ${fmt(c1, 5)}, s1 = ${fmt(s1, 5)}`);
console.log(`  c23 = cos(q2+q3) = ${fmt(c23, 5)}`);
console.log(`  s23 = sin(q2+q3) = ${fmt(s23, 5)}`);

const R03: Matrix3 = [
  [c1 * c23, -c1 * s23, -s1],
  [s1 * c23, -s1 * s23, c1],
  [-s23, -c23, 0],
];
console.log("\n  R03 =");
console.log(formatMatrix(R03, 4, "    "));

const R36_00 = c1 * c23 * r11 + s1 * c23 * r21 - s23 * r31;
const R36_01 = c1 * c23 * r12 + s1 * c23 * r22 - s23 * r32;
const R36_02 = c1 * c23 * r13 + s1 * c23 * r23 - s23 * r33;
const R36_10 = -c1 * s23 * r11 - s1 * s23 * r21 - c23 * r31;
const R36_11 = -c1 * s23 * r12 - s1 * s23 * r22 - c23 * r32;
const R36_12 = -c1 * s23 * r13 - s1 * s23 * r23 - c23 * r33;
const R36_20 = -s1 * r11 + c1 * r21;
const R36_21 = -s1 * r12 + c1 * r22;
const R36_22 = -s1 * r13 + c1 * r23;

const R36: Matrix3 = [
  [R36_00, R36_01, R36_02],
  [R36_10, R36_11, R36_12],
  [R36_20, R36_21, R36_22],
];
console.log("\n  R36 =");
console.log(formatMatrix(R36, 4, "    "));

// ============================================================================
// KROK 7: q4, q5, q6 z R36
// ============================================================================
console.log("\n--- KROK 7: q4, q5, q6 z R36 (gałąź wrist noflip) ---");
const sq5_abs = Math.hypot(R36_10, R36_11);
const cq5 = R36_12;
console.log(`  |sin q5| = √(R36[1][0]² + R36[1][1]²) = ${fmt(sq5_abs, 5)}`);
console.log(`  cos q5  = R36[1][2] = ${fmt(cq5, 5)}`);

// wristSign = +1 (noflip)
const sq5 = +sq5_abs;
const q5 = Math.atan2(sq5, cq5);
const q4 = Math.atan2(R36_22, -R36_02);
const q6 = Math.atan2(-R36_11, R36_10);
console.log(`  q5 = atan2(+|sin q5|, cos q5) = ${deg(q5).toFixed(3)}°`);
console.log(`  q4 = atan2(R36[2][2], −R36[0][2]) = ${deg(q4).toFixed(3)}°`);
console.log(`  q6 = atan2(−R36[1][1], R36[1][0]) = ${deg(q6).toFixed(3)}°`);

// ============================================================================
// PODSUMOWANIE: 8 rozwiązań
// ============================================================================
console.log("\n--- PODSUMOWANIE: wszystkie 8 rozwiązań ---");
const all = solvePuma560Analytical(T_target);
console.log(`Liczba rozwiązań: ${all.length}\n`);
console.log("  # | shoulder | elbow | wrist  |   q1    q2    q3    q4    q5    q6  ");
console.log("----+----------+-------+--------+-------------------------------------");
all.forEach((sol, i) => {
  const b = sol.branch!;
  const qs = sol.joints.map((q) => deg(q).toFixed(1).padStart(6)).join(" ");
  console.log(`  ${i + 1} | ${b.shoulder.padEnd(8)} | ${b.elbow.padEnd(5)} | ${b.wrist.padEnd(6)} | ${qs}`);
});

// Weryfikacja
console.log("\n--- WERYFIKACJA: round-trip FK(q_IK) vs T* ---");
const best = all.find(
  (s) =>
    s.branch?.shoulder === "right" && s.branch?.elbow === "up" && s.branch?.wrist === "noflip",
);
if (best) {
  const T_back = forwardKinematics(PUMA560, best.joints);
  const p_back = extractPosition(T_back);
  const err_pos = Math.hypot(p_back[0] - px, p_back[1] - py, p_back[2] - pz);
  console.log(`  Pozycja  — błąd: ${err_pos.toExponential(2)} m`);
  let max_err_rot = 0;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      max_err_rot = Math.max(max_err_rot, Math.abs(T_back[i][j] - T_target[i][j]));
  console.log(`  Orientacja — max |ΔRᵢⱼ|: ${max_err_rot.toExponential(2)}`);
}
