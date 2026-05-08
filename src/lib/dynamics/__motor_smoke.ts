/**
 * Smoke test modelu silnika DC + przekładnia + energia.
 *
 * Uruchom: `npx tsx src/lib/dynamics/__motor_smoke.ts`
 */

import { ES5, ES5_DRIVES, ES5_INERTIA } from "../robots/es5";
import { solveInverseDynamics } from "./newton-euler";
import { motorState, robotEnergy } from "./motor-model";
import { gearEfficiency } from "./efficiency-coefficients";
import type { JointConfig } from "../types";

function fmt(x: number, d = 3) { return x.toFixed(d).padStart(d + 4); }

console.log("=== Smoke test: model silnika DC + przekładnia + energia ===\n");

// ─── Test 1: η_r vs prędkość i obciążenie ───────────────────────────────
{
  console.log("Test 1: sprawność przekładni dla różnych prędkości i obciążeń");
  console.log("(Tab. 6.4 dysertacji, grupa 'joints123')\n");
  console.log("ω [rpm] |  10%   30%    50%    80%    100%");
  console.log("--------|------------------------------------------");
  for (const omega_rpm of [500, 1000, 2000, 3500]) {
    const omega_rads = (omega_rpm * 2 * Math.PI) / 60;
    const row = [10, 30, 50, 80, 100].map((load) => {
      const tau = (load / 100) * 50; // 50 Nm = nominalne
      const eta = gearEfficiency("joints123", omega_rads, tau);
      return `${(eta * 100).toFixed(1)}%`;
    });
    console.log(` ${omega_rpm.toString().padEnd(6)} | ${row.join("   ")}`);
  }
  console.log("Spodziewane: η rośnie z obciążeniem (małe obc. = duże straty),");
  console.log("            η maleje z prędkością (cieplne straty rosną).\n");
}

// ─── Test 2: stan silnika dla konkretnego napędu ───────────────────────────
{
  const drive = ES5_DRIVES[1]; // przegub 2 (najwięcej obciążony)
  const tau_joint = 50; // Nm
  const q_dot = 0.5; // rad/s

  const state = motorState(drive, tau_joint, q_dot);

  console.log("Test 2: napęd przegubu 2 (k_T=0.1418 Nm/A, n=121:1)");
  console.log(`  τ_joint = ${tau_joint} Nm,  q̇ = ${q_dot} rad/s`);
  console.log(`  ω_motor   = ${fmt(state.omegaMotor)} rad/s   (= ${fmt(state.omegaMotor * 60 / (2*Math.PI), 1)} obr/min)`);
  console.log(`  η         = ${fmt(state.efficiency * 100, 2)} %`);
  console.log(`  τ_motor   = ${fmt(state.torqueMotor, 4)} Nm`);
  console.log(`  i         = ${fmt(state.current, 3)} A`);
  console.log(`  u         = ${fmt(state.voltage, 2)} V`);
  console.log(`  P         = ${fmt(state.power, 1)} W`);
  console.log("Spodziewane: P > 0, sensowna wartość kilkadziesiąt do kilkuset W.\n");
}

// ─── Test 3: pełna trajektoria pick-and-place z energią ───────────────────
{
  // Trapezoidalna trajektoria w q₂: 0 → π/4 → π/4 → 0 w czasie 2 s
  const T = 2.0;
  const dt = 0.01;
  const N = Math.round(T / dt) + 1;
  const times: number[] = [];
  const qPath: JointConfig[] = [];
  const qDotPath: number[][] = [];
  const qDdotPath: number[][] = [];

  for (let k = 0; k < N; k++) {
    const t = k * dt;
    times.push(t);
    // Profil sinusoidalny w q₂ (dla łatwiejszych pochodnych)
    const tau = t / T;
    const ang = (Math.PI / 4) * (1 - Math.cos(Math.PI * tau)) / 2;
    const angDot = (Math.PI / 4) * Math.sin(Math.PI * tau) * Math.PI / (2 * T);
    const angDdot = (Math.PI / 4) * Math.cos(Math.PI * tau) * (Math.PI / (2 * T)) ** 2;

    const q: JointConfig = [0, ang, 0, 0, 0, 0];
    const qDot = [0, angDot, 0, 0, 0, 0];
    const qDdot = [0, angDdot, 0, 0, 0, 0];
    qPath.push(q);
    qDotPath.push(qDot);
    qDdotPath.push(qDdot);
  }

  // Liczymy τ(t) dla każdego punktu trajektorii
  const torquesPerJoint: number[][] = [[], [], [], [], [], []];
  const qDotsPerJoint: number[][] = [[], [], [], [], [], []];
  for (let k = 0; k < N; k++) {
    const result = solveInverseDynamics(ES5, ES5_INERTIA, qPath[k], qDotPath[k], qDdotPath[k]);
    for (let j = 0; j < 6; j++) {
      torquesPerJoint[j].push(result.torques[j]);
      qDotsPerJoint[j].push(qDotPath[k][j]);
    }
  }

  const energyResult = robotEnergy(ES5_DRIVES, times, torquesPerJoint, qDotsPerJoint);

  console.log("Test 3: trajektoria sinusoidalna q₂ (0 → π/4 → 0) w 2 s");
  console.log(`  Energia całkowita: ${fmt(energyResult.totalEnergy, 1)} J`);
  console.log("  Energia per napęd:");
  energyResult.perJoint.forEach((p, j) => {
    console.log(`    Napęd ${j + 1}: ${fmt(p.energy, 2)} J`);
  });
  console.log("Spodziewane: dominuje energia napędu 2 (jedyny się ruszający z");
  console.log("            znaczącym obciążeniem grawitacyjnym), pozostałe ~0.\n");

  console.log("  Maksymalny moment τ₂ w trakcie ruchu:",
    fmt(Math.max(...torquesPerJoint[1].map(Math.abs))), "Nm");
}

console.log("\n=== Koniec smoke testu silnika ===");
