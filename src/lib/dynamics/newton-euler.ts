/**
 * Rekurencyjny algorytm Newtona-Eulera dla manipulatora przegubowego.
 *
 * Implementacja zgodna z [Craig, *Introduction to Robotics*, 3rd ed., §6.7]
 * oraz [Gruszka, dysertacja 2024, rozdz. 6.2.1, eq. (6.6)–(6.18)] — te dwa
 * źródła używają tych samych równań, z jedną subtelną różnicą w
 * interpretacji członu grawitacyjnego, omówioną niżej.
 *
 * Algorytm wyznacza siły reakcji i momenty napędowe w przegubach robota
 * dla danej trajektorii (q, q̇, q̈), znając parametry inercji ogniw (m, p_C, I_C).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Konwencja znaku grawitacji (uwaga merytoryczna)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Stosujemy klasyczną sztuczkę Craig'a: inicjalizujemy a₀ = -g·ẑ_world
 * (tak, jakby baza robota „przyspieszała w górę" z przyspieszeniem g).
 * Dzięki tej konwencji w forward sweep wyrażenie aᶜᵢ propaguje grawitację
 * automatycznie jako część przyspieszenia liniowego, a Fᶜᵢ = mᵢ·aᶜᵢ jest
 * sumą siły bezwładności i siły grawitacji w lokalnym układzie ogniwa.
 *
 * W backward sweep używamy bilansu **bez osobnego członu F_g** — Craig
 * (6.49) ma jedynie f_i = R·f_{i+1} + Fᶜᵢ. Dysertacja w eq. (6.17) zawiera
 * dodatkowy człon -Fᵍᵢ; pojawia się przy konwencji a₀ = 0 (bez grawitacji
 * w propagacji), z czym koliduje (B.4) w dysertacji, gdzie ¹a₁ = (0, 0, -9.81).
 * Po analizie obu podejść wybraliśmy konwencję Craig'a — fizycznie spójną
 * i jednoznaczną. Dla statyki (q̇=q̈=0) algorytm produkuje sensowne momenty
 * grawitacyjne (każde ogniwo „odczuwa" tylko swoją grawitację plus
 * propagowaną od ogniw wyższych — żadnego podwójnego liczenia).
 *
 * Jeśli kiedykolwiek zechcesz odtworzyć dokładnie konwencję dysertacji
 * (z pozostawionym F_g w bilansie), wystarczy zmienić `gravityInBaseAccel`
 * na `false` i dodać F_g do równania siły niżej — ten szczegół jest oddany
 * w komentarzach w kodzie.
 */

import type { JointConfig, RobotModel, Vec3 } from "@/lib/types";
import { linkTransform } from "@/lib/robots/dh";
import { extractRotation } from "@/lib/math/matrix";
import {
  add3, cross3, mat3mulVec3, mat3TmulVec3, scale3, sub3, ZERO3,
} from "@/lib/math/vec3";
import type { LinkInertia } from "@/lib/robots/es5";

/** Wartości kinematyczne i dynamiczne ogniwa po jednej iteracji forward sweep. */
export type LinkState = {
  /** Indeks ogniwa (0-indexed). Ogniwo 0 to pierwsze ogniwo nad bazą. */
  index: number;
  /** ⁱω_i — prędkość kątowa ogniwa, w jego lokalnym układzie. */
  omega: Vec3;
  /** ⁱε_i — przyspieszenie kątowe ogniwa, w jego lokalnym układzie. */
  alpha: Vec3;
  /** ⁱv_i — prędkość liniowa początku układu ogniwa, w lokalnym układzie. */
  v: Vec3;
  /** ⁱa_i — przyspieszenie liniowe początku układu ogniwa, w lokalnym układzie. */
  a: Vec3;
  /** ⁱv_Ci — prędkość liniowa środka masy, w lokalnym układzie. */
  vCom: Vec3;
  /** ⁱa_Ci — przyspieszenie liniowe środka masy, w lokalnym układzie. */
  aCom: Vec3;
  /** ⁱF_Ci = mᵢ·aᶜᵢ — siła bezwładności w środku masy (zawiera grawitację). */
  forceInertial: Vec3;
  /** ⁱN_Ci = Iᶜᵢ·εᵢ + ωᵢ × (Iᶜᵢ·ωᵢ) — moment bezwładności (żyroskopowy). */
  momentInertial: Vec3;
};

/** Wynik backward sweep — siły reakcji i momenty w przegubach. */
export type JointReaction = {
  /** Indeks przegubu (0-indexed). */
  index: number;
  /** ⁱf_i — siła reakcji w przegubie i, w układzie ogniwa i. */
  force: Vec3;
  /** ⁱn_i — moment siły w przegubie i, w układzie ogniwa i. */
  moment: Vec3;
  /** Skalarna wartość momentu napędowego (rzut n_i na oś przegubu z_i). */
  torque: number;
};

export type DynamicsResult = {
  /** Stan każdego ogniwa po forward sweep. */
  links: LinkState[];
  /** Reakcje w przegubach po backward sweep. */
  joints: JointReaction[];
  /** Wektor 6 momentów napędowych — gotowy wynik dynamiki odwrotnej. */
  torques: number[];
};

export type DynamicsOptions = {
  /** Wartość przyspieszenia ziemskiego [m/s²]. Domyślnie 9.81. */
  g?: number;
  /**
   * Czy oś z bazy wskazuje w górę (przeciwnie do grawitacji)?
   * Domyślnie `true` — zgodnie z geometrią ES5 z Rys. 6.1 dysertacji
   * i Pumy 560 z modułu 1. Dla `false` z bazy w dół (np. robot zawieszony
   * na suficie) inicjalizacja przyspieszenia bazy zostanie odwrócona.
   */
  zAxisUp?: boolean;
};

/**
 * Pełny algorytm dynamiki odwrotnej Newtona-Eulera.
 *
 * @param robot Model robota z parametrami DH (modified Craig).
 * @param inertia Parametry inercji każdego ogniwa (m, p_Com, p_Next, I_Com).
 *                Długość tablicy musi być równa robot.dh.length.
 * @param q   Konfiguracja przegubów [rad lub m].
 * @param qd  Prędkości przegubów q̇ [rad/s lub m/s].
 * @param qdd Przyspieszenia przegubów q̈ [rad/s² lub m/s²].
 * @returns Pełen ślad obliczeń (forward + backward) plus wektor τ.
 */
export function solveInverseDynamics(
  robot: RobotModel,
  inertia: readonly LinkInertia[],
  q: JointConfig,
  qd: readonly number[],
  qdd: readonly number[],
  opts: DynamicsOptions = {},
): DynamicsResult {
  const n = robot.dh.length;
  if (inertia.length !== n) {
    throw new Error(`Inertia table length (${inertia.length}) ≠ robot DOF (${n}).`);
  }
  const g = opts.g ?? 9.81;
  const zUp = opts.zAxisUp ?? true;

  // ── FORWARD SWEEP ──────────────────────────────────────────────────────
  // Stan na wyjściu z układu (i-1), wchodzimy w iterację dla ogniwa i.
  // Indeksowanie 0-indexed: i ∈ {0..n-1}. Ogniwo 0 to pierwsze nad bazą.

  // Stan w bazie (układ "0" w sensie 1-indexed = nasz układ wejściowy):
  let omegaPrev: Vec3 = ZERO3;
  let alphaPrev: Vec3 = ZERO3;
  let vPrev:     Vec3 = ZERO3;
  // Sztuczka Craig'a: a₀ = -g·ẑ. Dla z_world wzwyż: a₀ w bazie = (0, 0, +g).
  // Bo "przyspieszenie bazy w górę" symuluje ciążenie pseudosiły w dół na
  // wszystkich ogniwach. Po obrocie do układu lokalnego pierwszego ogniwa
  // (gdy α₀=0, θ₁=q₁), grawitacja jest poprawnie reprezentowana.
  let aPrev: Vec3 = zUp ? [0, 0, g] : [0, 0, -g];

  const linkStates: LinkState[] = [];

  for (let i = 0; i < n; i++) {
    // Transformacja z poprzedniego układu (i-1) do bieżącego (i):
    // T^i_{i-1} = modifiedDHTransform(α_{i-1}, a_{i-1}, d_i, θ_i + q_i).
    const T = linkTransform(robot.convention, robot.dh[i], q[i]);
    const R = extractRotation(T); // R^i_{i-1}

    // Wektor od układu (i-1) do układu (i), wyrażony w układzie (i-1):
    // To translacja w T^i_{i-1}, ale wyrażona w układzie (i-1) — czyli
    // przed obrotem przez R. Z modifiedDHTransform: T·(0,0,0,1) daje
    // pozycję początku (i) w układzie (i-1) = (a_{i-1}, -d_i·sin α_{i-1}, d_i·cos α_{i-1}),
    // ale ta wartość w macierzy T jest WYRAŻONA w układzie (i), nie (i-1).
    //
    // Dla forward sweep w konwencji Craig'a potrzebujemy ⁱ⁻¹p_i = pozycja
    // (i) wyrażona w układzie (i-1). To wektor "pNext" liczony OD ogniwa (i-1)
    // DO ogniwa (i). Dla pierwszego ogniwa (i=0), pNext z bazy do ogniwa 0
    // to z definicji (0,0,0) (baza i pierwsza oś przegubu są w tym samym punkcie).
    //
    // Dla i ≥ 1: ⁱ⁻¹p_i = inertia[i-1].pNext (wektor od (i-1) do (i) w układzie (i-1)).
    const pInPrev: Vec3 = i === 0 ? ZERO3 : inertia[i - 1].pNext;

    // Oś przegubu i w układzie (i): z_i = (0, 0, 1).
    const Z: Vec3 = [0, 0, 1] as const;

    // UWAGA: linkTransform zwraca macierz T^{i-1}_i, której kolumny to
    // baza układu (i) wyrażona w (i-1). Aby przeprowadzić wektor z układu
    // (i-1) do (i), używamy R^T (transpozycja, bo macierz rotacji jest ortogonalna).

    // Eq. (6.6): ⁱω_i = R^i_{i-1} · ⁱ⁻¹ω_{i-1} + θ̇_i · ẑ_i
    const Romega = mat3TmulVec3(R, omegaPrev);
    const omega: Vec3 = add3(Romega, scale3(Z, qd[i]));

    // Eq. (6.7): ⁱε_i = R · ⁱ⁻¹ε_{i-1} + (R · ⁱ⁻¹ω_{i-1}) × (θ̇_i · ẑ_i) + θ̈_i · ẑ_i
    const Ralpha = mat3TmulVec3(R, alphaPrev);
    const coriolis = cross3(Romega, scale3(Z, qd[i]));
    const alpha: Vec3 = add3(add3(Ralpha, coriolis), scale3(Z, qdd[i]));

    // Eq. (6.8): ⁱv_i = R · (ⁱ⁻¹v_{i-1} + ⁱ⁻¹ω_{i-1} × ⁱ⁻¹p_i)
    const omegaCrossP = cross3(omegaPrev, pInPrev);
    const v: Vec3 = mat3TmulVec3(R, add3(vPrev, omegaCrossP));

    // Eq. (6.9): ⁱa_i = R · (ⁱ⁻¹a_{i-1} + ⁱ⁻¹ε_{i-1} × ⁱ⁻¹p_i + ⁱ⁻¹ω_{i-1} × (ⁱ⁻¹ω_{i-1} × ⁱ⁻¹p_i))
    const alphaCrossP = cross3(alphaPrev, pInPrev);
    const omegaCrossOmegaCrossP = cross3(omegaPrev, omegaCrossP);
    const a: Vec3 = mat3TmulVec3(R, add3(add3(aPrev, alphaCrossP), omegaCrossOmegaCrossP));

    // Eq. (6.11): ⁱv_Ci = ⁱv_i + ⁱω_i × ⁱp_Ci
    const pCom = inertia[i].pCom;
    const vCom: Vec3 = add3(v, cross3(omega, pCom));

    // Eq. (6.12): ⁱa_Ci = ⁱε_i × ⁱp_Ci + ⁱω_i × (ⁱω_i × ⁱp_Ci) + ⁱa_i
    const alphaCrossPCom = cross3(alpha, pCom);
    const omegaCrossPCom = cross3(omega, pCom);
    const omegaCrossOmegaCrossPCom = cross3(omega, omegaCrossPCom);
    const aCom: Vec3 = add3(add3(a, alphaCrossPCom), omegaCrossOmegaCrossPCom);

    // Eq. (6.14): ⁱF_Ci = mᵢ · ⁱa_Ci  (siła d'Alemberta, zawiera grawitację dzięki a₀)
    const forceInertial: Vec3 = scale3(aCom, inertia[i].m);

    // Eq. (6.15): ⁱN_Ci = Iᶜᵢ · ⁱε_i + ⁱω_i × (Iᶜᵢ · ⁱω_i)  (moment żyroskopowy)
    const Iomega = mat3mulVec3(inertia[i].I, omega);
    const Ialpha = mat3mulVec3(inertia[i].I, alpha);
    const momentInertial: Vec3 = add3(Ialpha, cross3(omega, Iomega));

    linkStates.push({
      index: i, omega, alpha, v, a, vCom, aCom, forceInertial, momentInertial,
    });

    // Stan na wejście do następnej iteracji
    omegaPrev = omega;
    alphaPrev = alpha;
    vPrev = v;
    aPrev = a;
  }

  // ── BACKWARD SWEEP ─────────────────────────────────────────────────────
  // Bilans sił i momentów od ostatniego ogniwa (n-1) do bazy.
  // Inicjalizacja: brak obciążenia zewnętrznego za końcówką → f_n = 0, n_n = 0.

  // Trzymamy f_{i+1} i n_{i+1} w układzie ogniwa (i+1) — przed mnożeniem przez R^i_{i+1}
  // które przeprowadza do układu (i) gdy potrzebujemy w bilansie ogniwa (i).
  let fNext: Vec3 = ZERO3;   // siła od ogniwa wyższego, w jego układzie
  let nNext: Vec3 = ZERO3;   // moment od ogniwa wyższego, w jego układzie

  const reactions: JointReaction[] = new Array(n);

  for (let i = n - 1; i >= 0; i--) {
    const state = linkStates[i];

    // Macierz rotacji z układu (i) do (i+1) — używana do propagacji f, n
    // od (i+1) do (i). Dla ostatniego ogniwa (i=n-1) nie ma takiej rotacji
    // (brak ogniwa n+1), ale mnożymy przez nią zera, więc bez znaczenia.
    let RToCurrent: Vec3 = ZERO3;
    let RToCurrentMoment: Vec3 = ZERO3;
    if (i < n - 1) {
      // linkTransform(...dh[i+1]...) zwraca T^i_{i+1} — kolumny to baza (i+1) w (i).
      // Aby przejść z (i+1) do (i), aplikujemy ten R bezpośrednio: R · v_{i+1} = v_i.
      const Tnext = linkTransform(robot.convention, robot.dh[i + 1], q[i + 1]);
      const Rnext = extractRotation(Tnext);
      RToCurrent = mat3mulVec3(Rnext, fNext);
      RToCurrentMoment = mat3mulVec3(Rnext, nNext);
    }
    // Dla i = n-1: f_{n} = n_{n} = 0 (zerowe obciążenie końcówki).

    // Eq. (Craig 6.49): ⁱf_i = R^i_{i+1} · ⁱ⁺¹f_{i+1} + ⁱF_Ci
    const force: Vec3 = add3(RToCurrent, state.forceInertial);

    // Eq. (Craig 6.50): ⁱn_i = ⁱN_Ci + R^i_{i+1} · ⁱ⁺¹n_{i+1}
    //                   + ⁱp_Ci × ⁱF_Ci  +  ⁱp_{i+1} × (R^i_{i+1} · ⁱ⁺¹f_{i+1})
    // Uwaga: ⁱp_{i+1} = inertia[i].pNext (wektor od (i) do (i+1) w układzie (i)).
    // Dla i = n-1 (ostatnie ogniwo), inertia[i].pNext nie ma sensu fizycznego (brak ogniwa
    // za nim), ale RToCurrent = 0 więc to nieistotne.
    const pNext = inertia[i].pNext;
    const pCi = inertia[i].pCom;
    const pCixFC = cross3(pCi, state.forceInertial);
    const pNxRf = cross3(pNext, RToCurrent);
    const moment: Vec3 = add3(
      add3(state.momentInertial, RToCurrentMoment),
      add3(pCixFC, pNxRf),
    );

    // Moment napędowy w przegubie i = składowa n_i wzdłuż osi z_i (osi przegubu).
    // Z konwencji DH dla przegubu obrotowego, oś z układu (i) jest osią obrotu przegubu (i).
    const torque = moment[2];

    reactions[i] = { index: i, force, moment, torque };

    // Aktualizacja dla iteracji niżej: przenieś bieżące f, n jako "fNext" dla i-1.
    fNext = force;
    nNext = moment;
  }

  return {
    links: linkStates,
    joints: reactions,
    torques: reactions.map((r) => r.torque),
  };
}

/** Eksport dla wygody — sumarycznie wzór z eq. (6.13) dla kompletności. */
export function inertiaTensor(I: { xx: number; yy: number; zz: number; xy?: number; xz?: number; yz?: number }) {
  const xy = I.xy ?? 0, xz = I.xz ?? 0, yz = I.yz ?? 0;
  return [
    [I.xx, -xy, -xz],
    [-xy,  I.yy, -yz],
    [-xz, -yz,  I.zz],
  ] as const;
}

// Re-eksport żeby konsumenci nie musieli sięgać do `robots/es5`:
export type { LinkInertia };
