import type { JointConfig } from "@/lib/types";

/**
 * Wspólny zbiór trajektorii testowych dla modułów M9 (dynamika) i M11
 * (dobór napędów). Trzymane razem żeby TorqueChart i DriveSizingMetrics
 * pokazywały wartości obliczone z dokładnie tej samej trajektorii.
 */

export type Scenario = {
  id: string;
  label: string;
  /** Czas trwania trajektorii [s] — używany przy całkowaniu τ_rms i energii. */
  duration: number;
  /** Zwraca (q, q̇, q̈) dla τ ∈ [0, 1] (czas znormalizowany). */
  trajectory: (tau: number) => { q: JointConfig; qd: number[]; qdd: number[] };
};

export const PICK_AND_PLACE_SCENARIOS: readonly Scenario[] = [
  {
    id: "shoulder-up",
    label: "Tylko q₂: 0 → π/2 (ramię w pion)",
    duration: 2,
    trajectory: (tau) => {
      const T = 2;
      const A = Math.PI / 2;
      const ang     = (A / 2) * (1 - Math.cos(Math.PI * tau));
      const angDot  = (A / 2) * Math.sin(Math.PI * tau) * Math.PI / T;
      const angDdot = (A / 2) * Math.cos(Math.PI * tau) * (Math.PI / T) ** 2;
      return {
        q: [0, ang, 0, 0, 0, 0] as unknown as JointConfig,
        qd: [0, angDot, 0, 0, 0, 0],
        qdd: [0, 0, angDdot, 0, 0, 0],
      };
    },
  },
  {
    id: "pick-place",
    label: "Pick-and-place (q₁ obrót + q₂ podnieś)",
    duration: 2,
    trajectory: (tau) => {
      const T = 2;
      const phase = tau < 0.5 ? "lift" : "rotate";
      const subT = phase === "lift" ? tau / 0.5 : (tau - 0.5) / 0.5;
      const A1 = Math.PI / 2;
      const A2 = Math.PI / 3;
      const halfT = T / 2;

      let q1 = 0, q1d = 0, q1dd = 0;
      let q2 = 0, q2d = 0, q2dd = 0;

      if (phase === "lift") {
        q2 = (A2 / 2) * (1 - Math.cos(Math.PI * subT));
        q2d = (A2 / 2) * Math.sin(Math.PI * subT) * Math.PI / halfT;
        q2dd = (A2 / 2) * Math.cos(Math.PI * subT) * (Math.PI / halfT) ** 2;
      } else {
        q2 = A2;
        q1 = (A1 / 2) * (1 - Math.cos(Math.PI * subT));
        q1d = (A1 / 2) * Math.sin(Math.PI * subT) * Math.PI / halfT;
        q1dd = (A1 / 2) * Math.cos(Math.PI * subT) * (Math.PI / halfT) ** 2;
      }

      return {
        q: [q1, q2, 0, 0, 0, 0] as unknown as JointConfig,
        qd: [q1d, q2d, 0, 0, 0, 0],
        qdd: [q1dd, q2dd, 0, 0, 0, 0],
      };
    },
  },
  {
    id: "all-axes",
    label: "Ruch wszystkich 6 osi (faza przesunięta)",
    duration: 2,
    trajectory: (tau) => {
      const T = 2;
      const A = Math.PI / 4;
      const halfT = T / 2;
      const q: number[] = [];
      const qd: number[] = [];
      const qdd: number[] = [];
      for (let j = 0; j < 6; j++) {
        const phase = (j * Math.PI) / 6;
        q.push((A / 2) * (1 - Math.cos(Math.PI * tau + phase)));
        qd.push((A / 2) * Math.sin(Math.PI * tau + phase) * Math.PI / halfT);
        qdd.push((A / 2) * Math.cos(Math.PI * tau + phase) * (Math.PI / halfT) ** 2);
      }
      void T;
      return { q: q as unknown as JointConfig, qd, qdd };
    },
  },
  {
    id: "aggressive",
    label: "Agresywny (krótki czas, duże q̈) — worst-case",
    duration: 0.8,
    trajectory: (tau) => {
      const T = 0.8;
      const halfT = T / 2;
      const A1 = (3 * Math.PI) / 4;
      const A2 = Math.PI / 2;
      const A4 = Math.PI;
      const phase = tau < 0.5 ? "out" : "back";
      const subT = phase === "out" ? tau / 0.5 : 1 - (tau - 0.5) / 0.5;
      const w = Math.PI / halfT;
      const ang = (a: number) => (a / 2) * (1 - Math.cos(Math.PI * subT));
      const angDot = (a: number, sign: number) => sign * (a / 2) * Math.sin(Math.PI * subT) * w;
      const angDdot = (a: number, sign: number) => sign * (a / 2) * Math.cos(Math.PI * subT) * w * w;
      const dir = phase === "out" ? +1 : -1;
      return {
        q: [ang(A1), ang(A2), 0, ang(A4), 0, 0] as unknown as JointConfig,
        qd: [angDot(A1, dir), angDot(A2, dir), 0, angDot(A4, dir), 0, 0],
        qdd: [angDdot(A1, dir), angDdot(A2, dir), 0, angDdot(A4, dir), 0, 0],
      };
    },
  },
];
