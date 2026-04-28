import type { RobotModel } from "@/lib/types";

/**
 * Puma560 — modified DH parameters (Craig, "Introduction to Robotics", 3rd ed., §3.8).
 *
 * Link lengths:
 *   a₂ = 0.4318 m  — upper-arm length
 *   a₃ = 0.0203 m  — small offset at the elbow
 *   d₃ = 0.1254 m  — shoulder-to-elbow lateral offset
 *   d₄ = 0.4318 m  — forearm length
 *
 * Table (i, αᵢ₋₁, aᵢ₋₁, dᵢ, θᵢ-home):
 *   1   0        0       0        0
 *   2  -π/2      0       0        0
 *   3   0        a₂      d₃       0
 *   4  -π/2      a₃      d₄       0
 *   5   π/2      0       0        0
 *   6  -π/2      0       0        0
 *
 * Joint limits follow the factory Unimation Puma 560 (approximate).
 */

export const PUMA_A2 = 0.4318;
export const PUMA_A3 = 0.0203;
export const PUMA_D3 = 0.1254;
export const PUMA_D4 = 0.4318;

export const PUMA560: RobotModel = {
  id: "puma560",
  name: "Unimation Puma 560",
  convention: "modified",
  dh: [
    { alpha: 0,          a: 0,       d: 0,       theta: 0, jointType: "revolute",
      limits: { min: -2.7925, max: 2.7925 } }, // ±160°
    { alpha: -Math.PI/2, a: 0,       d: 0,       theta: 0, jointType: "revolute",
      limits: { min: -3.9270, max: 0.7854 } }, // -225°..+45°
    { alpha: 0,          a: PUMA_A2, d: PUMA_D3, theta: 0, jointType: "revolute",
      limits: { min: -0.7854, max: 3.9270 } }, // -45°..+225°
    { alpha: -Math.PI/2, a: PUMA_A3, d: PUMA_D4, theta: 0, jointType: "revolute",
      limits: { min: -1.9199, max: 2.9671 } }, // -110°..+170°
    { alpha:  Math.PI/2, a: 0,       d: 0,       theta: 0, jointType: "revolute",
      limits: { min: -1.7453, max: 1.7453 } }, // ±100°
    { alpha: -Math.PI/2, a: 0,       d: 0,       theta: 0, jointType: "revolute",
      limits: { min: -4.6251, max: 4.6251 } }, // ±265°
  ],
  home: [0, -Math.PI / 2, Math.PI / 2, 0, 0, 0],
} as const;
