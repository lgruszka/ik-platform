import type { Matrix3, RobotModel, Vec3 } from "@/lib/types";

/**
 * EasyRobots ES5 — manipulator przegubowy 6-DOF, modified DH (Craig).
 * Geometria i parametry mechaniczne za: [Gruszka, dysertacja 2024, rozdz. 6.3].
 *
 * Charakterystyczna cecha geometrii: osie q₂, q₃, q₄ są wzajemnie równoległe
 * (α₂ = α₃ = 0). Spełniona jest "forma B" warunku Piepera (3 kolejne osie
 * równoległe), więc IK ma rozwiązanie zamknięte — analogicznie jak UR5.
 *
 * Ten plik zawiera tylko geometrię (DH) + masy + środki masy + tensory
 * bezwładności. Algorytm dynamiki (Newton-Euler) jest niezależny od robota
 * i znajduje się w `src/lib/dynamics/newton-euler.ts`.
 */

// Tabela 6.1 z dysertacji — modified DH (Craig)
export const ES5_A3 = 0.425;   // długość ramienia (przegub 2 → 3)
export const ES5_A4 = 0.395;   // długość przedramienia (przegub 3 → 4)
export const ES5_D4 = 0.1105;  // odsadzenie przedramienia
export const ES5_D5 = 0.101;   // długość kostki
export const ES5_D6 = 0.0765;  // wystawienie końcówki

export const ES5: RobotModel = {
  id: "es5",
  name: "EasyRobots ES5",
  convention: "modified",
  dh: [
    { alpha: 0,          a: 0,      d: 0,      theta: 0, jointType: "revolute",
      limits: { min: -Math.PI, max: Math.PI } },
    { alpha:  Math.PI/2, a: 0,      d: 0,      theta: 0, jointType: "revolute",
      limits: { min: -Math.PI, max: Math.PI } },
    { alpha: 0,          a: ES5_A3, d: 0,      theta: 0, jointType: "revolute",
      limits: { min: -Math.PI, max: Math.PI } },
    { alpha: 0,          a: ES5_A4, d: ES5_D4, theta: 0, jointType: "revolute",
      limits: { min: -Math.PI, max: Math.PI } },
    // α₄ = -π/2 — wnioskowane z Tab. 6.2 (⁵p_4 = (0, +0.101, 0)).
    // W tabeli 6.1 dysertacji zapisane jako "90°" bez znaku, ale pNext z Tab. 6.2
    // wymaga -π/2 (sprawdziłem rachunkiem (a, -d·sin α, d·cos α) z modified DH).
    { alpha: -Math.PI/2, a: 0,      d: ES5_D5, theta: 0, jointType: "revolute",
      limits: { min: -Math.PI, max: Math.PI } },
    { alpha:  Math.PI/2, a: 0,      d: ES5_D6, theta: 0, jointType: "revolute",
      limits: { min: -2*Math.PI, max: 2*Math.PI } },
  ],
  // Konfiguracja referencyjna — robot wyprostowany w pionie (zgodnie z Rys. 6.1)
  home: [0, 0, 0, 0, 0, 0],
} as const;

// ─── Parametry dynamiczne ────────────────────────────────────────────────
// Tabela 6.2 z dysertacji.

/** Parametry inercji pojedynczego ogniwa, wyrażone w jego lokalnym układzie współrzędnych. */
export type LinkInertia = {
  /** Masa ogniwa [kg]. */
  m: number;
  /** Wektor translacji do następnego ogniwa: ⁱ⁺¹p_i, w układzie ⁱ. */
  pNext: Vec3;
  /** Środek masy: ⁱp_Ci, w układzie ⁱ. */
  pCom: Vec3;
  /**
   * Tensor bezwładności wokół środka masy, w układzie lokalnym ogniwa,
   * w postaci 3×3 macierzy zgodnej z (6.13). Diagonalne elementy = momenty
   * główne, niediagonalne = momenty dewiacji (ze znakiem ujemnym w (6.13),
   * ale tu zapisujemy macierz wprost — bez ukrytych znaków).
   *
   * Wartości tu zapisane są **oszacowaniem cylindrycznym** (zob. niżej)
   * — rzeczywiste tensory pochodzą z modelu CAD i mogą się różnić o 10–30%.
   * Algorytm Newton-Eulera pozostaje bez zmian; podmiana wartości w tym
   * pliku wystarczy, żeby uściślić wyniki liczbowe.
   */
  I: Matrix3;
};

/**
 * Oszacowanie cylindryczne tensora bezwładności jednorodnego cylindra
 * o osi Z lokalnego układu, długości L i promieniu r.
 *
 *   I_xx = I_yy = m·(3r² + L²) / 12
 *   I_zz = m·r² / 2
 *
 * Tensor w środku masy, główne osie pokrywają się z osiami układu (off-diag = 0).
 *
 * Dla ogniw ES5 zakładamy, że ich główna oś wzdłużna pokrywa się z osią lokalną
 * tego ogniwa, która prowadzi do następnego (czyli kierunek `pNext`). Jeśli ten
 * kierunek jest np. wzdłuż X (jak dla ogniw 2 i 3 — `[a, 0, 0]`), tensor
 * obracamy odpowiednio.
 */
function cylinderInertia(m: number, length: number, radius: number, axis: "x" | "y" | "z"): Matrix3 {
  const r2 = radius * radius;
  const L2 = length * length;
  const Iaxial = (m * r2) / 2;             // moment wokół osi cylindra
  const Iperp = (m * (3 * r2 + L2)) / 12;  // moment wokół osi prostopadłej
  if (axis === "z") {
    return [
      [Iperp, 0, 0],
      [0, Iperp, 0],
      [0, 0, Iaxial],
    ] as const;
  }
  if (axis === "x") {
    return [
      [Iaxial, 0, 0],
      [0, Iperp, 0],
      [0, 0, Iperp],
    ] as const;
  }
  return [
    [Iperp, 0, 0],
    [0, Iaxial, 0],
    [0, 0, Iperp],
  ] as const;
}

/**
 * Geometryczna interpretacja każdego ogniwa ES5 (wg Rys. 6.1 z dysertacji)
 * + dobór osi cylindra dla oszacowania tensora:
 *
 *   1: cokół + pierwszy przegub — krótki cylinder pionowy (oś Z lokalna),
 *      L ≈ 0,16 m, r ≈ 0,06 m
 *   2: ramię — długi cylinder wzdłuż X lokalnego (do następnego przegubu),
 *      L = a₃ = 0,425, r ≈ 0,055
 *   3: przedramię — j.w. wzdłuż X, L = a₄ = 0,395, r ≈ 0,045
 *   4, 5: kostka nadgarstka — krótkie cylindry wzdłuż osi Y (zgodnie
 *      z geometrią; ich `pNext` ma niezerowe Y), L ≈ 0,10, r ≈ 0,035
 *   6: kołnierz końcówki — krótki cylinder wzdłuż Z, L ≈ 0,05, r ≈ 0,03
 *
 * Promienie wybrano przez okiem na zdjęciach komercyjnego ES5 — to są wartości
 * orientacyjne, dla rzędu wielkości dobre, nie oczekujmy zgodności do trzeciej
 * cyfry znaczącej z modelem CAD.
 */
const ES5_LINK_GEOMETRY: { L: number; r: number; axis: "x" | "y" | "z" }[] = [
  { L: 0.16,    r: 0.060, axis: "z" }, // 1: cokół
  { L: ES5_A3,  r: 0.055, axis: "x" }, // 2: ramię (425 mm)
  { L: ES5_A4,  r: 0.045, axis: "x" }, // 3: przedramię (395 mm)
  { L: 0.10,    r: 0.035, axis: "y" }, // 4: kostka
  { L: 0.10,    r: 0.035, axis: "y" }, // 5: kostka
  { L: 0.05,    r: 0.030, axis: "z" }, // 6: kołnierz
];

/** Parametry inercji wszystkich ogniw ES5 — z Tabeli 6.2 + oszacowanie tensorów. */
export const ES5_INERTIA: readonly LinkInertia[] = [
  {
    m: 3.931,
    pNext: [0, 0, 0],
    pCom:  [0, -0.008, -0.031],
    I: cylinderInertia(3.931, ES5_LINK_GEOMETRY[0].L, ES5_LINK_GEOMETRY[0].r, ES5_LINK_GEOMETRY[0].axis),
  },
  {
    m: 10.442,
    pNext: [0.425, 0, 0],
    pCom:  [0.207, 0, 0.124],
    I: cylinderInertia(10.442, ES5_LINK_GEOMETRY[1].L, ES5_LINK_GEOMETRY[1].r, ES5_LINK_GEOMETRY[1].axis),
  },
  {
    m: 2.846,
    pNext: [0.395, 0, 0.1105],
    pCom:  [0.228, 0, 0.018],
    I: cylinderInertia(2.846, ES5_LINK_GEOMETRY[2].L, ES5_LINK_GEOMETRY[2].r, ES5_LINK_GEOMETRY[2].axis),
  },
  {
    m: 1.37,
    pNext: [0, 0.101, 0],
    pCom:  [0, -0.010, -0.005],
    I: cylinderInertia(1.37, ES5_LINK_GEOMETRY[3].L, ES5_LINK_GEOMETRY[3].r, ES5_LINK_GEOMETRY[3].axis),
  },
  {
    m: 1.3,
    pNext: [0, -0.0765, 0],
    pCom:  [0, -0.010, -0.005],
    I: cylinderInertia(1.3, ES5_LINK_GEOMETRY[4].L, ES5_LINK_GEOMETRY[4].r, ES5_LINK_GEOMETRY[4].axis),
  },
  {
    m: 0.365,
    pNext: [0, 0, 0],
    pCom:  [0, 0, -0.012],
    I: cylinderInertia(0.365, ES5_LINK_GEOMETRY[5].L, ES5_LINK_GEOMETRY[5].r, ES5_LINK_GEOMETRY[5].axis),
  },
] as const;

// ─── Parametry napędów (silniki + przekładnie harmoniczne) ──────────────
// Tabela 6.3 z dysertacji.

export type DriveParams = {
  /** Stała momentowa silnika k_T [Nm/A]. */
  kT: number;
  /** Stała elektryczna silnika k_e [V/(rad/s)]. */
  ke: number;
  /** Rezystancja całkowita uzwojenia tworznika [Ω]. */
  R: number;
  /** Indukcyjność uzwojenia tworznika [H]. */
  L: number;
  /** Przełożenie przekładni redukującej (silnik:przegub). */
  ratio: number;
  /** Grupa współczynników sprawności wg Tab. 6.4 — patrz `efficiency-coefficients.ts`. */
  efficiencyGroup: "joints123" | "joint2" | "joints456";
};

export const ES5_DRIVES: readonly DriveParams[] = [
  { kT: 0.1418, ke: 0.12, R: 0.7, L: 0.0009, ratio: 101, efficiencyGroup: "joints123" },
  { kT: 0.1418, ke: 0.12, R: 0.7, L: 0.0009, ratio: 121, efficiencyGroup: "joint2" },
  { kT: 0.1418, ke: 0.12, R: 0.7, L: 0.0009, ratio: 101, efficiencyGroup: "joints123" },
  { kT: 0.1636, ke: 0.08, R: 3.5, L: 0.0034, ratio: 101, efficiencyGroup: "joints456" },
  { kT: 0.1636, ke: 0.08, R: 3.5, L: 0.0034, ratio: 101, efficiencyGroup: "joints456" },
  { kT: 0.1636, ke: 0.08, R: 3.5, L: 0.0034, ratio: 101, efficiencyGroup: "joints456" },
] as const;
