/**
 * Współczynniki wielomianów aproksymujących sprawność przekładni harmonicznych
 * dla robota ES5, wg Tab. 6.4 w [Gruszka, dysertacja 2024].
 *
 * Wielomian 5. stopnia: η(x) = a₅·x⁵ + a₄·x⁴ + a₃·x³ + a₂·x² + a₁·x + a₀
 * gdzie x = obciążenie momentu w procentach nominalnego.
 *
 * Tabela 6.4 podaje współczynniki w postaci [a₀, a₁, a₂, a₃, a₄, a₅] dla:
 *   - 4 prędkości obrotowych wału wejściowego: 500, 1000, 2000, 3500 obr/min
 *   - 3 grup przegubów: 4-5-6 (pierwsza kolumna), 1-3 (druga), 2 (trzecia).
 *
 * Sprawność dla zadanej prędkości pomiędzy danymi punktami uzyskujemy przez
 * interpolację liniową współczynników.
 */

export type EfficiencyGroup = "joints123" | "joint2" | "joints456";

/** Współczynniki [a₀..a₅] dla pojedynczej kombinacji (grupa, prędkość). */
export type PolyCoefficients = readonly [number, number, number, number, number, number];

/** Tabela 6.4 — współczynniki wielomianów dla ES5. */
export const EFFICIENCY_COEFFS: Record<
  EfficiencyGroup,
  Record<500 | 1000 | 2000 | 3500, PolyCoefficients>
> = {
  // UWAGA: wartości współczynników są spisane z Tab. 6.4 dysertacji (PDF).
  // Wielomiany 5. stopnia są bardzo wrażliwe na precyzję — przy ekstrapolacji
  // poza zakres dopasowania (x ≈ 10..80%) wartości "wybuchają". Aktualnie
  // klamrujemy wynik do [5%, 95%] (zob. `gearEfficiency`). Dla docelowej
  // precyzji odczyt powinien zostać sprawdzony bezpośrednio w pliku źródłowym
  // dysertacji (nie w PDF wyrenderowanym przez TeX), bo zaokrąglenie ostatnich
  // cyfr w wyższych potęgach drastycznie zmienia kształt krzywej.
  // Tab. 6.4, kolumna "Przeguby 4, 5, 6"
  joints456: {
    500:  [0.0, 0.0, 0.0019, -0.1136, 3.9209, -3.5667],
    1000: [0.0, -0.0, 0.0004, -0.0425, 2.33498, 3.3333],
    2000: [0.0, 0.0, 0.0011, -0.0739, 2.9182, -2.7667],
    3500: [0.0, 0.0, 0.0013, -0.0838, 3.0685, -5.4333],
  },
  // Tab. 6.4, kolumna "Przeguby 1 i 3"
  joints123: {
    500:  [0.0, 0.0, 0.0014, -0.0973, 3.7142, 7.2],
    1000: [0.0, -0.0, 0.0004, -0.0431, 2.53208, 8.6333],
    2000: [0.0, 0.0, 0.0017, -0.1060, 3.7816, -1.7667],
    3500: [0.0, 0.0, 0.0011, -0.0783, 3.2094, 0.6333],
  },
  // Tab. 6.4, kolumna "Przegub 2"
  joint2: {
    500:  [0.0, 0.0, 0.0014, -0.0973, 3.7142, 6.2],
    1000: [0.0, -0.0, 0.0004, -0.0431, 2.53208, 7.63333],
    2000: [0.0, 0.0, 0.0017, -0.1060, 3.7816, -2.7667],
    3500: [0.0, 0.0, 0.0011, -0.0783, 3.2094, -0.3667],
  },
} as const;

/** Cztery prędkości referencyjne, dla których podane są współczynniki [obr/min]. */
export const REFERENCE_SPEEDS = [500, 1000, 2000, 3500] as const;
export type ReferenceSpeed = typeof REFERENCE_SPEEDS[number];

/**
 * Ewaluacja wielomianu η(x) = Σ aₖ·xᵏ przy zadanym obciążeniu x [%].
 * Wynik to sprawność w procentach.
 *
 * UWAGA: Tab. 6.4 dysertacji zapisuje współczynniki w kolejności [a₀..a₅],
 * gdzie a₀ to wyraz wolny, a₁ liniowy, ..., a₅ kwintyczny. W reprezentacji
 * polskiej (przecinki dziesiętne) i z uwagi na dziwną dokładność wartości
 * (część jest 0.0, część precyzyjna), współczynniki są zaszyte jako stałe.
 */
export function evalPolynomial(coeffs: PolyCoefficients, x: number): number {
  let result = 0;
  let xpow = 1;
  for (let i = 0; i < coeffs.length; i++) {
    result += coeffs[i] * xpow;
    xpow *= x;
  }
  return result;
}

/**
 * Liniowa interpolacja współczynników między dwiema krzywymi referencyjnymi.
 * Dla prędkości spoza zakresu [500, 3500], ekstrapolacja jest zatrzymywana
 * (clamping do najbliższej krzywej).
 */
export function interpolateCoeffs(group: EfficiencyGroup, omega_rpm: number): PolyCoefficients {
  const speed = Math.max(500, Math.min(3500, omega_rpm));
  const refs = REFERENCE_SPEEDS;
  // Znajdź dwa sąsiednie punkty w refs
  let lower: ReferenceSpeed = refs[0];
  let upper: ReferenceSpeed = refs[refs.length - 1];
  for (let i = 0; i < refs.length - 1; i++) {
    if (speed >= refs[i] && speed <= refs[i + 1]) {
      lower = refs[i];
      upper = refs[i + 1];
      break;
    }
  }
  if (lower === upper) {
    return EFFICIENCY_COEFFS[group][lower];
  }
  const t = (speed - lower) / (upper - lower);
  const cLow = EFFICIENCY_COEFFS[group][lower];
  const cHigh = EFFICIENCY_COEFFS[group][upper];
  return cLow.map((c, i) => c + t * (cHigh[i] - c)) as unknown as PolyCoefficients;
}

/**
 * Sprawność przekładni jako funkcja prędkości obrotowej silnika [rad/s] i
 * obciążenia momentu [Nm].
 *
 * @param group       Grupa przegubu wg Tab. 6.4.
 * @param omegaMotor  Prędkość kątowa wirnika silnika [rad/s].
 * @param torqueLoad  Moment obciążenia na wyjściu przekładni [Nm] (czyli τ_i z NE).
 * @param torqueRated Nominalny moment przekładni dla robocika [Nm] — używamy
 *                    do przeliczenia obciążenia na procent. Domyślnie 50 Nm
 *                    (zgrubne dla ES5, wg producenta przekładni harmonicznych).
 * @returns Sprawność jako wartość w [0, 1].
 */
export function gearEfficiency(
  group: EfficiencyGroup,
  omegaMotor: number,
  torqueLoad: number,
  torqueRated = 50,
): number {
  const omega_rpm = (Math.abs(omegaMotor) * 60) / (2 * Math.PI);
  const loadPercent = Math.min(100, Math.max(1, (Math.abs(torqueLoad) / torqueRated) * 100));
  const coeffs = interpolateCoeffs(group, omega_rpm);
  const etaPercent = evalPolynomial(coeffs, loadPercent);
  // Sprawność w przedziale [0, 1], ograniczona z dołu (wielomian może wyjść
  // ujemny przy ekstrapolacji); 5% to dolne sensowne ograniczenie.
  return Math.max(0.05, Math.min(0.95, etaPercent / 100));
}
