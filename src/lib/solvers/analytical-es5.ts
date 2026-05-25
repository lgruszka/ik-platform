import { ES5, ES5_A3, ES5_A4, ES5_D4, ES5_D6 } from "@/lib/robots/es5";
import { linkTransform } from "@/lib/robots/dh";
import { invSE3, mulMany } from "@/lib/math/matrix";
import type { IKBranch, IKSolution, JointConfig, Matrix4 } from "@/lib/types";

export type Es5Options = {
  /** Numeryczna tolerancja dla degeneracji geometrycznych (singularności). */
  eps?: number;
};

/**
 * Closed-form IK dla robota EasyRobots ES5, zgodnie z Załącznikiem A
 * dysertacji [Gruszka 2024]. ES5 spełnia formę B warunku Piepera
 * (osie q₂, q₃, q₄ wzajemnie równoległe), więc rozwiązanie zamknięte
 * istnieje — choć inną metodą niż dla Pumy z M1.
 *
 * Kolejność wyprowadzania (algebraicznie wymuszona, NIE od indeksu):
 *   θ₁  →  θ₅  →  θ₆  →  T_1_4 (przez mnożenie macierzy)  →  θ₃  →  θ₂  →  θ₄
 *
 * Zwraca do 8 rozwiązań:
 *   - shoulder ∈ {left, right} — wybór gałęzi arcsin dla θ₁
 *   - elbow    ∈ {up, down}    — znak arccos dla θ₃
 *   - wrist    ∈ {flip, noflip}— znak arccos dla θ₅
 *
 * W osobliwości nadgarstka (sin θ₅ ≈ 0) gałęzie wrist degenerują się i
 * zwracane jest po jednym reprezentancie z θ₆ = 0.
 */
export function solveEs5Analytical(
  target: Matrix4,
  options: Es5Options = {},
): IKSolution[] {
  const eps = options.eps ?? 1e-9;

  // Wyciągamy elementy macierzy ⁶T₀ — translacja (px, py, pz) i kolumny rotacji
  const r11 = target[0][0], r12 = target[0][1], r13 = target[0][2];
  const r21 = target[1][0], r22 = target[1][1], r23 = target[1][2];
  // r3i nieużywane jawnie — przyjdą przez mnożenia macierzy
  const px = target[0][3], py = target[1][3];
  // pz nieużywane explicit (uczestniczy w mnożeniach macierzy)

  // === θ₁ (eq. A.6 → A.13) ===
  // Pozycja środka układu 5 w bazie: ⁵p₀ = ⁶p₀ - d₆ · z₆_world
  const p5x = px - ES5_D6 * r13;
  const p5y = py - ES5_D6 * r23;
  const p5xy = Math.sqrt(p5x * p5x + p5y * p5y);

  // sin(θ₁ - α) = d₄/p5xy, α = atan2(p5y, p5x) — klasyczny atan2(y, x)
  if (p5xy < eps) return [];
  const ratio = ES5_D4 / p5xy;
  if (Math.abs(ratio) > 1 + eps) return []; // cel poza zasięgiem
  const ratioClamped = Math.max(-1, Math.min(1, ratio));
  const asinVal = Math.asin(ratioClamped);
  const alpha = Math.atan2(p5y, p5x);

  // Dwie gałęzie θ₁: shoulder
  const theta1Branches: { value: number; shoulder: IKBranch["shoulder"] }[] = [
    { value: alpha + asinVal, shoulder: "right" },
    { value: alpha + Math.PI - asinVal, shoulder: "left" },
  ];

  const solutions: IKSolution[] = [];

  for (const { value: theta1, shoulder } of theta1Branches) {
    const c1 = Math.cos(theta1);
    const s1 = Math.sin(theta1);

    // === θ₅ (eq. A.20 z poprawką znaku) ===
    // Dysertacja: c5 = (-⁶p₀x·s1 + ⁶p₀y·c1 - d4) / d6
    // Nasz model DH (es5.ts) ma odwrotny znak ⁶p₁y vs dysertacja, stąd:
    //   c5 = (px·s1 - py·c1 - d4) / d6
    // Zweryfikowane numerycznie dla q=[0.3,0.4,0.5,0.6,0.7,0.8] daje c5≈0.7648 ≈ cos(0.7) ✓
    const cos5 = (px * s1 - py * c1 - ES5_D4) / ES5_D6;
    if (Math.abs(cos5) > 1 + eps) continue;
    const cos5Clamped = Math.max(-1, Math.min(1, cos5));
    const baseTheta5 = Math.acos(cos5Clamped);

    const wristBranches: { value: number; wrist: IKBranch["wrist"] }[] = [
      { value: baseTheta5, wrist: "noflip" },
      { value: -baseTheta5, wrist: "flip" },
    ];

    for (const { value: theta5, wrist } of wristBranches) {
      const c5 = Math.cos(theta5);
      const s5 = Math.sin(theta5);

      // === θ₆ (eq. A.31 z poprawką znaków dla naszego DH) ===
      // Dysertacja: c6 = (s1·r11 - c1·r21)/s5, s6 = (-s1·r12 + c1·r22)/s5.
      // W naszym modelu DH elementy macierzy ⁶R₁ mają odwrotne znaki w
      // wierszu 2 — zweryfikowane numerycznie. Stąd:
      //   c6 = (-s1·r11 + c1·r21)/s5
      //   s6 = ( s1·r12 - c1·r22)/s5
      let theta6: number;
      if (Math.abs(s5) < eps) {
        theta6 = 0;
      } else {
        const sin6 = (s1 * r12 - c1 * r22) / s5;
        const cos6 = (-s1 * r11 + c1 * r21) / s5;
        theta6 = Math.atan2(sin6, cos6);
      }

      // === Wylicz T_1_4 przez mnożenie macierzy (eq. A.32 z prawidłową kolejnością) ===
      // T_1_4 = (T_0_1)⁻¹ · T_0_6 · (T_5_6)⁻¹ · (T_4_5)⁻¹
      // UWAGA: w dysertacji eq. A.32 ma kolejność (T_4_5)⁻¹·(T_5_6)⁻¹, ale to
      // jest typo. Aby skompensować łańcuch T_0_6 = ...·T_4_5·T_5_6, trzeba
      // najpierw odwrócić T_5_6 (cofnięcie do ogniwa 5), potem T_4_5 (do 4).
      const T_0_1 = linkTransform(ES5.convention, ES5.dh[0], theta1);
      const T_4_5 = linkTransform(ES5.convention, ES5.dh[4], theta5);
      const T_5_6 = linkTransform(ES5.convention, ES5.dh[5], theta6);
      const T_1_4 = mulMany(
        invSE3(T_0_1),
        target,
        invSE3(T_5_6),
        invSE3(T_4_5),
      );
      const p1x_4 = T_1_4[0][3];
      // p1y_4 powinien być stały (≈ -d4 w konwencji) — ignorowany
      const p1z_4 = T_1_4[2][3];

      // === θ₃ (twierdzenie cosinusów w płaszczyźnie x-z układu 1) ===
      // KLUCZ: d₄ wpływa wyłącznie na y-składową ⁴p₁ (przez Rx(π/2) staje się -d₄)
      // i NIE wchodzi do trójkąta bark-łokieć w pionowej płaszczyźnie xz.
      // Stąd zwykły 2R-planarny wzór:
      //   |⁴p₁|²_xz = a₂² + a₃² + 2·a₂·a₃·cos(θ₃)
      //   cos(θ₃) = (p1x² + p1z² - a₂² - a₃²) / (2·a₂·a₃)
      // To uproszczenie względem dysertacji, gdzie d₄ jest mylnie wciągnięte
      // do równań trójkąta — w naszej kalkulacji okazało się niepotrzebne.
      const a2 = ES5_A3; // ramię
      const a3 = ES5_A4; // przedramię (bez offsetu d₄)
      const p1norm2 = p1x_4 * p1x_4 + p1z_4 * p1z_4;
      const cos3 = (p1norm2 - a2 * a2 - a3 * a3) / (2 * a2 * a3);
      if (Math.abs(cos3) > 1 + eps) continue;
      const cos3Clamped = Math.max(-1, Math.min(1, cos3));
      const baseTheta3 = Math.acos(cos3Clamped);

      const elbowBranches: { value: number; elbow: IKBranch["elbow"] }[] = [
        { value: baseTheta3, elbow: "up" },
        { value: -baseTheta3, elbow: "down" },
      ];

      for (const { value: theta3, elbow } of elbowBranches) {
        // === θ₂ — z układu liniowego K·c2 - M·s2 = p1x, K·s2 + M·c2 = p1z ===
        // gdzie K = a₂ + a₃·c3, M = a₃·s3.
        // Rozwiązanie: θ₂ = atan2(K·p1z - M·p1x, K·p1x + M·p1z)
        const c3 = Math.cos(theta3);
        const s3 = Math.sin(theta3);
        const K = a2 + a3 * c3;
        const Mt = a3 * s3;
        const theta2 = Math.atan2(K * p1z_4 - Mt * p1x_4, K * p1x_4 + Mt * p1z_4);

        // === θ₄ — z elementu macierzy T_3_4 ===
        // T_3_4 = (T_0_3)⁻¹ · T_0_6 · (T_5_6)⁻¹ · (T_4_5)⁻¹
        // Z konwencji DH (Craig, alpha_3=0): T_3_4 ma w [0][0] = cos θ₄, [0][1] = -sin θ₄
        const T_1_2 = linkTransform(ES5.convention, ES5.dh[1], theta2);
        const T_2_3 = linkTransform(ES5.convention, ES5.dh[2], theta3);
        const T_0_3 = mulMany(T_0_1, T_1_2, T_2_3);
        const T_3_4 = mulMany(
          invSE3(T_0_3),
          target,
          invSE3(T_5_6),
          invSE3(T_4_5),
        );
        const theta4 = Math.atan2(-T_3_4[0][1], T_3_4[0][0]);

        solutions.push({
          joints: [theta1, theta2, theta3, theta4, theta5, theta6] as unknown as JointConfig,
          branch: { shoulder, elbow, wrist },
          success: true,
        });
      }
    }
  }

  return solutions;
}

/**
 * Convenience wrapper zgodny z interfejsem IKSolver (jeden najlepszy wynik
 * dla seedu lub pierwsze rozwiązanie gdy seed nieznany).
 */
export function solveEs5(target: Matrix4, seed?: JointConfig): IKSolution {
  const all = solveEs5Analytical(target);
  if (all.length === 0) {
    return {
      joints: (seed ?? ES5.home) as JointConfig,
      success: false,
    };
  }
  if (!seed) return all[0];
  // Najbliższy seedowi w sensie L2 z wrappingiem kątów
  const wrap = (a: number) => {
    let v = a;
    while (v > Math.PI) v -= 2 * Math.PI;
    while (v < -Math.PI) v += 2 * Math.PI;
    return v;
  };
  let best = all[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const sol of all) {
    let d = 0;
    for (let i = 0; i < 6; i++) {
      const diff = wrap(sol.joints[i] - seed[i]);
      d += diff * diff;
    }
    if (d < bestDist) {
      bestDist = d;
      best = sol;
    }
  }
  return best;
}
