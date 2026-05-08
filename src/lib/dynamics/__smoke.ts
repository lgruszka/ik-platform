/**
 * Smoke test algorytmu Newton-Eulera.
 *
 * Uruchamiamy: `npx tsx src/lib/dynamics/__smoke.ts`
 *
 * Cele:
 * 1. Sanity check — żadnych NaN, Infinity dla nominalnej konfiguracji.
 * 2. Statyka — dla q̇=q̈=0 momenty powinny odzwierciedlać tylko grawitację.
 *    Moment τ₂ (drugi przegub, od którego zaczyna się ramię) powinien być
 *    największy bo trzyma masę całego ramienia + przedramienia + nadgarstka.
 *    Dla pozy z ramieniem opuszczonym (q₂ ≈ 0, q₃ ≈ 0) momenty są minimalne;
 *    dla ramienia poziomo (q₂ = π/2) momenty są maksymalne.
 * 3. Symetria znaków — moment τ₁ (oś pionowa) jest zerowy w statyce gdy
 *    konfiguracja symetryczna względem osi z bazy.
 * 4. Testy z dynamiką — niezerowe q̇ powoduje wzrost momentów (efekty
 *    Coriolisa i odśrodkowe).
 */

import { ES5, ES5_INERTIA } from "../robots/es5";
import { solveInverseDynamics } from "./newton-euler";
import type { JointConfig } from "../types";

function deg(x: number) { return (x * 180) / Math.PI; }
function rad(x: number) { return (x * Math.PI) / 180; }
function fmt(x: number, d = 3) { return x.toFixed(d).padStart(d + 4); }

console.log("=== Smoke test: Newton-Euler dla ES5 ===\n");

// ─── Test 1: Konfiguracja domowa (wszystko na zero) ──────────────────────
{
  const q: JointConfig = [0, 0, 0, 0, 0, 0];
  const qd = [0, 0, 0, 0, 0, 0];
  const qdd = [0, 0, 0, 0, 0, 0];

  const result = solveInverseDynamics(ES5, ES5_INERTIA, q, qd, qdd);

  console.log("Test 1: home pose (wszystkie q=0). UWAGA: dla ES5 z q=0 ramię jest");
  console.log("        ułożone POZIOMO wzdłuż osi x bazy (Rys. 6.1). Statyka:");
  console.log("τ [Nm]:", result.torques.map((t) => fmt(t)).join("  "));
  console.log("Spodziewane: τ₁≈0 (oś pionowa nie odczuwa grawitacji), τ₂ duże");
  console.log("            (trzyma poziome ramię + przedramię), pozostałe mniejsze.\n");

  if (result.torques.some((t) => !isFinite(t))) {
    console.error("BŁĄD: NaN/Inf w wyniku!");
  }
}

// ─── Test 2: Ramię poziomo, statyka ──────────────────────────────────────
{
  const q: JointConfig = [0, rad(90), 0, 0, 0, 0];
  const qd = [0, 0, 0, 0, 0, 0];
  const qdd = [0, 0, 0, 0, 0, 0];

  const result = solveInverseDynamics(ES5, ES5_INERTIA, q, qd, qdd);

  console.log("Test 2: q₂=90° (ramię obrócone do PIONU), q̇=q̈=0");
  console.log("τ [Nm]:", result.torques.map((t) => fmt(t)).join("  "));
  console.log("Spodziewane: WSZYSTKIE τ małe (ramię pionowo wzdłuż osi grawitacji,");
  console.log("            ciężar wzdłuż osi przegubu nie tworzy momentu).\n");
}

// ─── Test 3: Ramię poziomo, ruch (Coriolisa + odśrodkowy) ────────────────
{
  const q: JointConfig = [0, rad(90), rad(-30), 0, rad(45), 0];
  const qd = [0.5, 0, 0, 0, 0, 0]; // tylko obrót pionowy
  const qdd = [0, 0, 0, 0, 0, 0];

  const result = solveInverseDynamics(ES5, ES5_INERTIA, q, qd, qdd);

  console.log("Test 3: q₂=90°, q₃=-30°, obrót q̇₁=0.5 rad/s");
  console.log("τ [Nm]:", result.torques.map((t) => fmt(t)).join("  "));
  console.log("Spodziewane: efekty odśrodkowe na τ₂, τ₃ (siły bezwładności)\n");
}

// ─── Test 4: Pełna dynamika (przyspieszenie wszystkich osi) ──────────────
{
  const q: JointConfig = [rad(30), rad(45), rad(-60), rad(15), rad(30), rad(20)];
  const qd = [0.5, -0.3, 0.4, 0.1, -0.2, 0.3];
  const qdd = [1.0, 0.5, -0.5, 0.2, -0.1, 0.4];

  const result = solveInverseDynamics(ES5, ES5_INERTIA, q, qd, qdd);

  console.log("Test 4: pełna dynamika z niezerowymi q̇, q̈");
  console.log("q     [°]:", q.map((x) => fmt(deg(x), 1)).join("  "));
  console.log("q̇   [r/s]:", qd.map((x) => fmt(x, 2)).join("  "));
  console.log("q̈ [r/s²]:", qdd.map((x) => fmt(x, 2)).join("  "));
  console.log("τ    [Nm]:", result.torques.map((t) => fmt(t)).join("  "));
  console.log("Każde τ powinno być finite, sensowna wielkość 0.1–100 Nm\n");

  // Wypiszę też pierwsze 2 ogniwa w pełnym detalu — do porównania z
  // wartościami w zał. B dysertacji.
  console.log("Stan ogniwa 1 (pierwsze przegub, indeks 0):");
  const l0 = result.links[0];
  console.log("  ω :", l0.omega.map((x) => fmt(x, 4)).join("  "));
  console.log("  ε :", l0.alpha.map((x) => fmt(x, 4)).join("  "));
  console.log("  v :", l0.v.map((x) => fmt(x, 4)).join("  "));
  console.log("  a :", l0.a.map((x) => fmt(x, 4)).join("  "));
  console.log("  aᶜ:", l0.aCom.map((x) => fmt(x, 4)).join("  "));
  console.log("  Fᶜ:", l0.forceInertial.map((x) => fmt(x, 4)).join("  "));
  console.log("  Nᶜ:", l0.momentInertial.map((x) => fmt(x, 6)).join("  "));
}

// ─── Test 5: Symetria — masa 0 → momenty 0 ────────────────────────────────
{
  // Klonujemy inertia z masami i tensorami zerowanymi (test sanity check)
  const zeroI = [[0,0,0],[0,0,0],[0,0,0]] as const;
  const zeroInertia = ES5_INERTIA.map((l) => ({ ...l, m: 0, I: zeroI }));
  const q: JointConfig = [rad(30), rad(45), rad(-60), rad(15), rad(30), rad(20)];
  const qd = [0.5, -0.3, 0.4, 0.1, -0.2, 0.3];
  const qdd = [0, 0, 0, 0, 0, 0];

  const result = solveInverseDynamics(ES5, zeroInertia, q, qd, qdd);

  console.log("\nTest 5: masy zerowe (cały robot bez masy)");
  console.log("τ [Nm]:", result.torques.map((t) => fmt(t)).join("  "));
  console.log("Spodziewane: wszystkie τ ≈ 0 (brak masy → brak grawitacji ani bezwładności)\n");

  const allZero = result.torques.every((t) => Math.abs(t) < 1e-9);
  console.log(allZero ? "  ✓ PASS: wszystkie τ < 1e-9" : "  ✗ FAIL: niezerowe momenty mimo zera mas!");
}

console.log("\n=== Koniec smoke testu ===");
