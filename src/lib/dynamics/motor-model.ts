/**
 * Model elektromechaniczny silnika DC z przekładnią harmoniczną dla robota
 * sześciooosiowego, wg [Gruszka, dysertacja 2024, eq. (6.19)–(6.23)].
 *
 * Model łączy:
 *   - moment napędowy w przegubie τ_i (z dynamiki odwrotnej Newton-Euler);
 *   - moment na wale silnika τ_mi przez przekładnię z efektywnością η_r;
 *   - prąd silnika i_i przez stałą momentową k_T;
 *   - napięcie zasilania u_i przez równanie elektryczne (R, L, k_e);
 *   - moc chwilową P_i = u_i · i_i;
 *   - energię całkowitą E przez integrację po czasie.
 *
 * Konwencje:
 *   - Wartości q̇_i, τ_i, ω_motor mogą być **dodatnie lub ujemne** zależnie od
 *     kierunku ruchu / siły. W modelu energii bierzemy moc bezwzględną — silnik
 *     pobiera energię w obu kierunkach, gdy musi pokonywać tarcie/grawitację.
 *   - Pochodna prądu di/dt wymaga znajomości prądu w poprzednim kroku — model
 *     stanowy. Dla pojedynczego punktu czasowego (q̇, τ) liczymy quasi-statycznie
 *     z pominięciem L·di/dt (zwykle mała poprawka dla powolnych zmian).
 */

import type { DriveParams } from "@/lib/robots/es5";
import { gearEfficiency } from "./efficiency-coefficients";

export type MotorPoint = {
  /** Prędkość kątowa wirnika silnika [rad/s]. */
  omegaMotor: number;
  /** Moment na wale silnika [Nm]. */
  torqueMotor: number;
  /** Prąd uzwojenia tworznika [A]. */
  current: number;
  /** Napięcie zasilania silnika [V]. */
  voltage: number;
  /** Sprawność przekładni harmonicznej η_r [0,1]. */
  efficiency: number;
  /** Moc chwilowa P = u·i [W]. */
  power: number;
};

/**
 * Quasi-statyczny model silnika dla pojedynczego punktu (q̇, τ).
 *
 * Pomija L·di/dt — uzasadnienie: dla dynamiki manipulatora τ zmienia się w
 * skali ~10 ms, a stała czasowa elektryczna L/R ~ 1 ms; składowa indukcyjna
 * to typowo <5% napięcia. Pełen model dynamiczny silnika jest możliwy
 * (di/dt z poprzedniego kroku), ale dla dydaktyki quasi-statyczny wystarczy.
 *
 * @param drive Parametry silnika i przekładni (k_T, k_e, R, L, ratio, group).
 * @param torqueJoint Moment napędowy w przegubie τ_i z NE [Nm].
 * @param qDot Prędkość kątowa przegubu q̇_i [rad/s].
 * @param torqueRated Nominalny moment przekładni [Nm] do skalowania η_r.
 * @returns Pełny stan silnika i moc chwilowa.
 */
export function motorState(
  drive: DriveParams,
  torqueJoint: number,
  qDot: number,
  torqueRated = 50,
): MotorPoint {
  // Eq. (6.19) zmodyfikowana z wartością bezwzględną dla η, bo η nie zmienia
  // znaku z kierunkiem obrotu — to "współczynnik strat".
  const omegaMotor = drive.ratio * qDot;
  const efficiency = gearEfficiency(drive.efficiencyGroup, omegaMotor, torqueJoint, torqueRated);
  // Moment na wale silnika: τ_m = τ / (η · n).
  // Subtelność znakowa: dla silnika "ciągnącego" obciążenie, η zmniejsza moment
  // (bo część energii idzie w straty); dla silnika "hamującego" (np. silnik
  // generatorowy gdy obciążenie ciągnie wirnik), η * mocy idzie z powrotem.
  // Uproszczenie: traktujemy silnik zawsze jako "ciągnący" (η dzielimy nawet
  // gdy moc jest ujemna). To prowadzi do lekkiego przeszacowania energii dla
  // ruchów hamujących, co dla pick-and-place jest akceptowalne (~5% błąd).
  const torqueMotor = torqueJoint / (efficiency * drive.ratio);

  // Eq. (6.21): τ_m = k_T · i  →  i = τ_m / k_T
  const current = torqueMotor / drive.kT;

  // Eq. (6.22) bez członu L·di/dt (quasi-statyczny):
  //   u = R·i + k_e·ω_motor
  const voltage = drive.R * current + drive.ke * omegaMotor;

  // Moc chwilowa P = u · i. Dla idealnego silnika P = τ_m·ω_motor + i²·R (mech + ciepło).
  const power = voltage * current;

  return { omegaMotor, torqueMotor, current, voltage, efficiency, power };
}

/**
 * Liczy zużycie energii napędu i-tego dla pełnej trajektorii (q̇, τ) jako
 * funkcję czasu, używając trapezoidalnej całki.
 *
 * @param drive Parametry napędu.
 * @param times Wektor punktów czasu [s].
 * @param torques Moment napędowy τ(t) dla tego napędu, długość = times.length.
 * @param qDots Prędkość przegubu q̇(t), długość = times.length.
 * @returns Energia całkowita w okresie [t₀, tₙ] [J] oraz seria mocy chwilowej.
 */
export function jointEnergy(
  drive: DriveParams,
  times: readonly number[],
  torques: readonly number[],
  qDots: readonly number[],
  torqueRated = 50,
): { energy: number; power: number[]; states: MotorPoint[] } {
  const n = times.length;
  const states: MotorPoint[] = new Array(n);
  const power: number[] = new Array(n);
  for (let k = 0; k < n; k++) {
    states[k] = motorState(drive, torques[k], qDots[k], torqueRated);
    // Bierzemy bezwzględną moc — silnik pobiera energię (z baterii) niezależnie
    // od znaku P. Konwencja "P = u·i" dawałaby ujemną P dla ruchu hamującego,
    // ale w naszym uproszczonym modelu bez rekuperacji to ciągle "pobór".
    power[k] = Math.abs(states[k].power);
  }
  // Trapezoidalna integracja
  let energy = 0;
  for (let k = 0; k < n - 1; k++) {
    const dt = times[k + 1] - times[k];
    energy += 0.5 * (power[k] + power[k + 1]) * dt;
  }
  return { energy, power, states };
}

/**
 * Energia całego robota dla zadanej trajektorii — suma energii wszystkich
 * 6 napędów. Eq. (6.23): E = Σ_i ∫ u_i·i_i dt.
 */
export function robotEnergy(
  drives: readonly DriveParams[],
  times: readonly number[],
  torquesPerJoint: readonly (readonly number[])[],
  qDotsPerJoint: readonly (readonly number[])[],
  torqueRated = 50,
): { totalEnergy: number; perJoint: { energy: number; power: number[] }[] } {
  const perJoint = drives.map((drive, j) =>
    jointEnergy(drive, times, torquesPerJoint[j], qDotsPerJoint[j], torqueRated),
  );
  const totalEnergy = perJoint.reduce((s, p) => s + p.energy, 0);
  return { totalEnergy, perJoint: perJoint.map((p) => ({ energy: p.energy, power: p.power })) };
}
