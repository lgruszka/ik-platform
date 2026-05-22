/**
 * Mini-katalog realnych silników BLDC i przekładni harmonicznych — używany
 * w module 11 jako referencja przy doborze napędów. Wartości oparte o
 * publiczne karty katalogowe Maxon EC-i / Kollmorgen AKM / Allied Motion
 * oraz Harmonic Drive CSF/CSG.
 *
 * To NIE jest pełen katalog producenta — jedynie 6 reprezentatywnych
 * kombinacji typowych dla manipulatorów współpracujących (Franka, UR, KUKA
 * iiwa, ABB GoFa). Wszystkie wartości "po stronie wyjścia przekładni",
 * gotowe do bezpośredniego porównania z τ_peak / τ_rms / q̇_peak / P_peak
 * z dynamiki odwrotnej manipulatora.
 */

export type MotorGearCombo = {
  id: string;
  motor: string;
  gearbox: string;
  /** Klasa rozmiarowa — dyktuje który napęd Pumy/ES5 wpasujesz. */
  sizeClass: "S" | "M" | "L";
  /** Przełożenie przekładni harmonicznej. */
  reduction: number;
  /** Moment ciągły na wyjściu przekładni [Nm]. */
  tauCont: number;
  /** Moment szczytowy (max momentary) na wyjściu [Nm]. */
  tauPeak: number;
  /** Prędkość maksymalna na wyjściu [rad/s]. */
  qdMax: number;
  /** Moc nominalna [W]. */
  power: number;
  /** Bezwładność wirnika silnika [kg·m²] — przed przekładnią. */
  jRotor: number;
  /** Masa zespołu motor+gear [kg] — wpływa na własną dynamikę robota. */
  mass: number;
  /** Orientacyjna cena [EUR] — dla decyzji ekonomicznych. */
  priceEur: number;
  notes?: string;
};

export const MOTOR_CATALOG: readonly MotorGearCombo[] = [
  {
    id: "maxon-ec32-csf17-100",
    motor: "Maxon EC-i 32 (80W)",
    gearbox: "Harmonic Drive CSF-17-100",
    sizeClass: "S",
    reduction: 100,
    tauCont: 6.0,
    tauPeak: 17,
    qdMax: 6.28, // 60 rpm = 6.28 rad/s na wyjściu (przy 6000 rpm na wale)
    power: 80,
    jRotor: 4.5e-6,
    mass: 0.65,
    priceEur: 1800,
    notes: "Typowy dla nadgarstka (osie 4–6) cobotów klasy 5kg payload (UR5e, GoFa CRB 1300).",
  },
  {
    id: "maxon-eci52-csf25-100",
    motor: "Maxon EC-i 52 (180W)",
    gearbox: "Harmonic Drive CSF-25-100",
    sizeClass: "M",
    reduction: 100,
    tauCont: 28,
    tauPeak: 70,
    qdMax: 5.24, // 50 rpm
    power: 180,
    jRotor: 1.3e-5,
    mass: 1.6,
    priceEur: 3200,
    notes: "Standardowy dla łokcia (oś 3) cobotów 5–10kg. Wybór UR10e, Franka FR3 łokieć.",
  },
  {
    id: "kollmorgen-akm23-csf25-50",
    motor: "Kollmorgen AKM23C (260W)",
    gearbox: "Harmonic Drive CSF-25-50",
    sizeClass: "M",
    reduction: 50,
    tauCont: 32,
    tauPeak: 95,
    qdMax: 10.47, // 100 rpm — wyższa prędkość kosztem momentu
    power: 260,
    jRotor: 2.8e-5,
    mass: 2.1,
    priceEur: 3800,
    notes: "Szybsza wersja dla aplikacji wymagających wyższych prędkości operacyjnych.",
  },
  {
    id: "kollmorgen-akm33-csf32-100",
    motor: "Kollmorgen AKM33H (450W)",
    gearbox: "Harmonic Drive CSF-32-100",
    sizeClass: "L",
    reduction: 100,
    tauCont: 85,
    tauPeak: 230,
    qdMax: 4.19, // 40 rpm
    power: 450,
    jRotor: 9.0e-5,
    mass: 4.2,
    priceEur: 5600,
    notes: "Dla barku/podstawy (osie 1–2) cobotów średniej klasy (KUKA iiwa 14, UR16e).",
  },
  {
    id: "alliedm-megaflux-csg40",
    motor: "Allied Motion MF0150 (220W)",
    gearbox: "Harmonic Drive CSG-40-120",
    sizeClass: "L",
    reduction: 120,
    tauCont: 110,
    tauPeak: 320,
    qdMax: 3.49, // 33 rpm
    power: 220,
    jRotor: 7.2e-5,
    mass: 5.8,
    priceEur: 7400,
    notes: "Cienki profil osiowy (frameless) — preferowany do baz robotów wymagających kompaktowej konstrukcji.",
  },
  {
    id: "maxon-eci40-csg20-50",
    motor: "Maxon EC-i 40 (120W)",
    gearbox: "Harmonic Drive CSG-20-50",
    sizeClass: "S",
    reduction: 50,
    tauCont: 11,
    tauPeak: 33,
    qdMax: 10.47, // 100 rpm
    power: 120,
    jRotor: 6.8e-6,
    mass: 0.95,
    priceEur: 2400,
    notes: "Wariant dla osi 4 (przedramię) gdy wymagana wyższa prędkość niż w wariancie 100:1.",
  },
];

/** Skrótowe oznaczenie klasy do wyświetlenia w tabeli. */
export const SIZE_CLASS_LABEL: Record<MotorGearCombo["sizeClass"], string> = {
  S: "Mały (nadgarstek)",
  M: "Średni (łokieć)",
  L: "Duży (bark/baza)",
};
