"use client";

import { useEffect, useMemo, useState } from "react";
import { Math as M, MathBlock } from "@/components/ui/math";

/**
 * Demo computed-torque: porównanie PID-only vs PID+NE-feedforward dla
 * 2R-planarnego manipulatora z masami punktowymi na końcach ogniw.
 *
 * Po co: zwykły moduł M9 kończy się obietnicą „computed-torque to fundament
 * sterowania", ale student kończy moduł bez zobaczenia po co to działa.
 * Tu zamykamy pętlę — student widzi że dokładnie te τ, które wyliczył NE,
 * stają się feedforward'em który eliminuje błąd śledzenia.
 *
 * Model: m₁=1kg, m₂=1kg, L₁=L₂=0.5m, g=9.81. Forward dynamics:
 *   q̈ = M(q)⁻¹·(τ - C(q,q̇)·q̇ - g(q))
 * gdzie M, C, g pochodzą z Lagrange'a dla 2R z masami punktowymi
 * (Spong, "Robot Modeling and Control", §7.3).
 *
 * Symulator: RK4 z dt=0.002s, długość trajektorii T=2s. Trajektoria zadana:
 * cosinusowy profil pick-and-place (q_d od home do target i z powrotem).
 */

// ─── Parametry modelu ──────────────────────────────────────────────
const M1 = 1.0;     // kg
const M2 = 1.0;     // kg
const L1 = 0.5;     // m
const L2 = 0.5;     // m
const G = 9.81;     // m/s²

// ─── Lagrange dynamics 2R planarnego z masami punktowymi na końcach ─
// M(q): macierz inercji 2x2
function massMatrix(q1: number, q2: number): [number, number, number, number] {
  const c2 = Math.cos(q2);
  const M11 = M1 * L1 * L1 + M2 * (L1 * L1 + L2 * L2 + 2 * L1 * L2 * c2);
  const M12 = M2 * (L2 * L2 + L1 * L2 * c2);
  const M22 = M2 * L2 * L2;
  return [M11, M12, M12, M22];
}
// C(q,q̇)·q̇: wektor sił Coriolisa+odśrodkowych
function coriolisVec(q2: number, qd1: number, qd2: number): [number, number] {
  const h = -M2 * L1 * L2 * Math.sin(q2);
  return [
    h * qd2 * (2 * qd1 + qd2),
    -h * qd1 * qd1,
  ];
}
// g(q): wektor grawitacji
function gravityVec(q1: number, q2: number): [number, number] {
  return [
    (M1 + M2) * G * L1 * Math.cos(q1) + M2 * G * L2 * Math.cos(q1 + q2),
    M2 * G * L2 * Math.cos(q1 + q2),
  ];
}

// Forward dynamics: q̈ = M⁻¹·(τ - C·q̇ - g)
function forwardDynamics(
  q1: number, q2: number, qd1: number, qd2: number,
  tau1: number, tau2: number,
): [number, number] {
  const [M11, M12, , M22] = massMatrix(q1, q2);
  const [C1, C2] = coriolisVec(q2, qd1, qd2);
  const [g1, g2] = gravityVec(q1, q2);
  const r1 = tau1 - C1 - g1;
  const r2 = tau2 - C2 - g2;
  const det = M11 * M22 - M12 * M12;
  const qdd1 = (M22 * r1 - M12 * r2) / det;
  const qdd2 = (-M12 * r1 + M11 * r2) / det;
  return [qdd1, qdd2];
}

// Inverse dynamics dla feedforward (ta sama M, C, g — koło zamknięte symbolicznie)
function inverseDynamicsForFeedforward(
  q1: number, q2: number, qd1: number, qd2: number, qdd1: number, qdd2: number,
): [number, number] {
  const [M11, M12, , M22] = massMatrix(q1, q2);
  const [C1, C2] = coriolisVec(q2, qd1, qd2);
  const [g1, g2] = gravityVec(q1, q2);
  return [
    M11 * qdd1 + M12 * qdd2 + C1 + g1,
    M12 * qdd1 + M22 * qdd2 + C2 + g2,
  ];
}

// ─── Trajektoria zadana ─────────────────────────────────────────────
// Cosinusowy profil od (q_start) do (q_target) i z powrotem w czasie T.
const T_HORIZON = 2.0; // s
const Q_START = [Math.PI / 4, -Math.PI / 4] as const;
const Q_TARGET = [3 * Math.PI / 4, Math.PI / 2] as const;

function desiredTrajectory(t: number): {
  q: [number, number]; qd: [number, number]; qdd: [number, number];
} {
  const tau = Math.max(0, Math.min(1, t / T_HORIZON));
  // Profil bezpośredni: q(t) = q_start + (q_target-q_start) * (1 - cos(2π·tau)) / 2
  // → wraca do start (smooth round-trip)
  const phase = 2 * Math.PI * tau;
  const w = 2 * Math.PI / T_HORIZON; // rad/s
  const ampWeight = (1 - Math.cos(phase)) / 2;
  const ampWeightDot = w * Math.sin(phase) / 2;
  const ampWeightDdot = w * w * Math.cos(phase) / 2;
  const q1 = Q_START[0] + (Q_TARGET[0] - Q_START[0]) * ampWeight;
  const q2 = Q_START[1] + (Q_TARGET[1] - Q_START[1]) * ampWeight;
  const qd1 = (Q_TARGET[0] - Q_START[0]) * ampWeightDot;
  const qd2 = (Q_TARGET[1] - Q_START[1]) * ampWeightDot;
  const qdd1 = (Q_TARGET[0] - Q_START[0]) * ampWeightDdot;
  const qdd2 = (Q_TARGET[1] - Q_START[1]) * ampWeightDdot;
  return { q: [q1, q2], qd: [qd1, qd2], qdd: [qdd1, qdd2] };
}

// ─── Kontrolery ────────────────────────────────────────────────────
type CtrlState = { q1: number; q2: number; qd1: number; qd2: number };

function pidController(
  state: CtrlState, des: ReturnType<typeof desiredTrajectory>,
  Kp: number, Kd: number,
): [number, number] {
  const e1 = des.q[0] - state.q1;
  const e2 = des.q[1] - state.q2;
  const ed1 = des.qd[0] - state.qd1;
  const ed2 = des.qd[1] - state.qd2;
  return [Kp * e1 + Kd * ed1, Kp * e2 + Kd * ed2];
}

function computedTorqueController(
  state: CtrlState, des: ReturnType<typeof desiredTrajectory>,
  Kp: number, Kd: number,
): [number, number] {
  const e1 = des.q[0] - state.q1;
  const e2 = des.q[1] - state.q2;
  const ed1 = des.qd[0] - state.qd1;
  const ed2 = des.qd[1] - state.qd2;
  // τ_ff = NE(q_d, q̇_d, q̈_d) — model-based feedforward
  const [tauFf1, tauFf2] = inverseDynamicsForFeedforward(
    des.q[0], des.q[1], des.qd[0], des.qd[1], des.qdd[0], des.qdd[1],
  );
  // τ_total = τ_ff + PD korekta
  return [tauFf1 + Kp * e1 + Kd * ed1, tauFf2 + Kp * e2 + Kd * ed2];
}

// ─── Symulacja RK4 ──────────────────────────────────────────────────
type ControllerFn = (state: CtrlState, des: ReturnType<typeof desiredTrajectory>) => [number, number];

function simulate(controller: ControllerFn): {
  t: number[]; q1: number[]; q2: number[]; qd1Series: number[]; qd2Series: number[]; tau1: number[]; tau2: number[];
} {
  const dt = 0.002;
  const N = Math.floor(T_HORIZON / dt) + 1;
  const t: number[] = new Array(N);
  const q1Arr: number[] = new Array(N);
  const q2Arr: number[] = new Array(N);
  const qd1Arr: number[] = new Array(N);
  const qd2Arr: number[] = new Array(N);
  const tau1Arr: number[] = new Array(N);
  const tau2Arr: number[] = new Array(N);

  // Start z pozycji równej q_d(0) — czyli idealnym warunkom początkowym
  const init = desiredTrajectory(0);
  let q1 = init.q[0], q2 = init.q[1], qd1 = init.qd[0], qd2 = init.qd[1];

  for (let i = 0; i < N; i++) {
    const ti = i * dt;
    t[i] = ti;
    q1Arr[i] = q1; q2Arr[i] = q2; qd1Arr[i] = qd1; qd2Arr[i] = qd2;

    const des = desiredTrajectory(ti);
    const [tau1, tau2] = controller({ q1, q2, qd1, qd2 }, des);
    tau1Arr[i] = tau1; tau2Arr[i] = tau2;

    // RK4 step on (q, qd) z stałym τ w trakcie kroku (zero-order hold)
    const deriv = (s: CtrlState): [number, number, number, number] => {
      const [qdd1, qdd2] = forwardDynamics(s.q1, s.q2, s.qd1, s.qd2, tau1, tau2);
      return [s.qd1, s.qd2, qdd1, qdd2];
    };
    const k1 = deriv({ q1, q2, qd1, qd2 });
    const k2 = deriv({ q1: q1 + dt/2*k1[0], q2: q2 + dt/2*k1[1], qd1: qd1 + dt/2*k1[2], qd2: qd2 + dt/2*k1[3] });
    const k3 = deriv({ q1: q1 + dt/2*k2[0], q2: q2 + dt/2*k2[1], qd1: qd1 + dt/2*k2[2], qd2: qd2 + dt/2*k2[3] });
    const k4 = deriv({ q1: q1 + dt*k3[0], q2: q2 + dt*k3[1], qd1: qd1 + dt*k3[2], qd2: qd2 + dt*k3[3] });
    q1 += dt/6*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0]);
    q2 += dt/6*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1]);
    qd1 += dt/6*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2]);
    qd2 += dt/6*(k1[3] + 2*k2[3] + 2*k3[3] + k4[3]);
  }

  return { t, q1: q1Arr, q2: q2Arr, qd1Series: qd1Arr, qd2Series: qd2Arr, tau1: tau1Arr, tau2: tau2Arr };
}

// ─── Komponent React ────────────────────────────────────────────────
export function ComputedTorqueDemo() {
  const [Kp, setKp] = useState(50);
  const [Kd, setKd] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [tCursor, setTCursor] = useState(0);

  // Symulacja obu kontrolerów — re-run gdy zmieniają się Kp/Kd
  const { simPid, simCt, desSeries } = useMemo(() => {
    const simPid = simulate((s, d) => pidController(s, d, Kp, Kd));
    const simCt = simulate((s, d) => computedTorqueController(s, d, Kp, Kd));
    const des = simPid.t.map((ti) => desiredTrajectory(ti).q);
    return { simPid, simCt, desSeries: des };
  }, [Kp, Kd]);

  // Animacja playback — przesuwa kursor t_cursor
  useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    const t0 = tCursor;
    let raf: number;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const next = t0 + elapsed;
      if (next >= T_HORIZON) {
        setTCursor(T_HORIZON);
        setPlaying(false);
        return;
      }
      setTCursor(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Index dla aktualnego t_cursor
  const idx = Math.min(simPid.t.length - 1, Math.round(tCursor / 0.002));

  // Błąd śledzenia |e| dla obu kontrolerów
  const errPid = simPid.q1.map((q, i) => Math.hypot(desSeries[i][0] - q, desSeries[i][1] - simPid.q2[i]));
  const errCt  = simCt.q1.map((q, i) => Math.hypot(desSeries[i][0] - q, desSeries[i][1] - simCt.q2[i]));
  const maxErrPid = Math.max(...errPid);
  const maxErrCt = Math.max(...errCt);

  return (
    <div className="space-y-4 not-prose">
      <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
        <p className="font-semibold text-sm mb-1">Po co to jest?</p>
        <p className="text-sm text-[var(--foreground)] mb-0">
          Aplikacja kanoniczna NE — <strong>computed-torque control</strong>. Wysyłamy do silnika
          dwa momenty: (1) <em>feedforward</em> wyliczony z modelu dynamiki NE jako{" "}
          <M tex="\tau_{ff} = \mathrm{NE}(q_d, \dot q_d, \ddot q_d)" />, plus (2) PD-poprawkę
          od pomiarów <M tex="\tau_{fb} = K_p (q_d - q) + K_d (\dot q_d - \dot q)" />.
          Idea: jeśli model dynamiki jest dokładny, <M tex="\tau_{ff}" /> wystarczy do śledzenia
          idealnej trajektorii — a PD jest tylko żeby skompensować drobne błędy modelu.
          <strong> Porównaj poniżej:</strong> PID-only musi mieć duże Kp by „dogonić" trajektorię,
          PID+feedforward śledzi z minimalnym błędem nawet przy małych wzmocnieniach.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="font-semibold text-sm">2R-planarny: PID-only vs PID + NE-feedforward</p>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => { setTCursor(0); setPlaying(false); }}
              className="px-2 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
              type="button"
            >
              ⟲ reset
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="px-3 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)] font-semibold"
              type="button"
            >
              {playing ? "⏸ pauza" : "▶ play"}
            </button>
            <span className="text-[var(--muted)] tabular-nums w-24 text-right">
              t = {tCursor.toFixed(3)} s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">Kp:</span>
            <input type="range" min={1} max={300} step={1} value={Kp}
                   onChange={(e) => setKp(Number(e.target.value))} className="w-32" />
            <span className="font-mono tabular-nums w-10 text-right">{Kp}</span>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">Kd:</span>
            <input type="range" min={0} max={50} step={0.5} value={Kd}
                   onChange={(e) => setKd(Number(e.target.value))} className="w-32" />
            <span className="font-mono tabular-nums w-10 text-right">{Kd.toFixed(1)}</span>
          </label>
          <label className="flex items-center gap-2 ml-auto">
            <span className="text-[var(--muted)]">t:</span>
            <input type="range" min={0} max={T_HORIZON} step={0.002} value={tCursor}
                   onChange={(e) => { setTCursor(Number(e.target.value)); setPlaying(false); }}
                   className="w-40" />
          </label>
        </div>

        {/* Dwa robociki side-by-side */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <ArmAnimation
            title="PID-only"
            q1={simPid.q1[idx]} q2={simPid.q2[idx]}
            q1Des={desSeries[idx][0]} q2Des={desSeries[idx][1]}
            color="#ef4444"
          />
          <ArmAnimation
            title="PID + NE-feedforward (computed-torque)"
            q1={simCt.q1[idx]} q2={simCt.q2[idx]}
            q1Des={desSeries[idx][0]} q2Des={desSeries[idx][1]}
            color="#10b981"
          />
        </div>

        {/* Wykres błędu śledzenia */}
        <TrackingErrorChart
          t={simPid.t}
          errPid={errPid}
          errCt={errCt}
          tCursor={tCursor}
        />

        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
          <div className="rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-3 py-2">
            <p className="font-semibold text-red-700 dark:text-red-300 mb-1">PID-only</p>
            <p className="text-[var(--muted)] mb-1">max |e| przez całą trajektorię:</p>
            <p className="font-mono tabular-nums text-red-700 dark:text-red-300 font-semibold">
              {(maxErrPid * 1000).toFixed(1)} mrad ≈ {(maxErrPid * 180 / Math.PI).toFixed(2)}°
            </p>
          </div>
          <div className="rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 px-3 py-2">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">PID + NE-feedforward</p>
            <p className="text-[var(--muted)] mb-1">max |e| przez całą trajektorię:</p>
            <p className="font-mono tabular-nums text-emerald-700 dark:text-emerald-300 font-semibold">
              {(maxErrCt * 1000).toFixed(1)} mrad ≈ {(maxErrCt * 180 / Math.PI).toFixed(2)}°
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)] mt-3 mb-0">
          <strong>Eksperymenty:</strong> przy domyślnych Kp=50, Kd=10 błąd PID-only jest ~10× większy
          niż PID+feedforward. Zwiększ Kp do 300 — PID-only zbliży się do feedforward, ale w realnym
          systemie tak duże Kp wzmocniłoby szum pomiarowy i ryzyko niestabilności. Feedforward NE
          osiąga to samo bez wysokich wzmocnień — to jest powód, dla którego ten moduł istnieje.
        </p>
      </div>

      <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2">
        <summary className="cursor-pointer font-semibold text-sm py-1">
          ▸ Pokaż wzory kontrolerów
        </summary>
        <div className="prose-ik max-w-none mt-3 text-sm">
          <p>PID-only (faktycznie tu PD, bez I dla prostoty):</p>
          <MathBlock tex="\tau = K_p(q_d - q) + K_d(\dot q_d - \dot q)" />
          <p>Computed-torque (PD + model-based feedforward):</p>
          <MathBlock tex="\tau = \underbrace{M(q_d)\ddot q_d + C(q_d,\dot q_d)\dot q_d + g(q_d)}_{\tau_{ff} = \mathrm{NE}(q_d,\dot q_d,\ddot q_d)} + K_p(q_d - q) + K_d(\dot q_d - \dot q)" />
          <p>
            Gdy model dokładnie odzwierciedla rzeczywistą dynamikę i stan
            początkowy jest na trajektorii, sama <M tex="\tau_{ff}" /> wystarczy —
            część PD pracuje tylko z zerem. W praktyce model ma niedoskonałości
            (tarcie, sprężystość), więc PD koryguje błędy.
          </p>
        </div>
      </details>
    </div>
  );
}

/* ─── Sub-komponenty ──────────────────────────────────────────────── */

function ArmAnimation({
  title, q1, q2, q1Des, q2Des, color,
}: {
  title: string; q1: number; q2: number; q1Des: number; q2Des: number; color: string;
}) {
  const W = 260, H = 220;
  const cx = W / 2;
  const cy = H - 30;
  const scale = 80; // pikseli na metr (L=0.5 → 40 px)

  const jointAct = { x: cx + scale * L1 * Math.cos(-q1), y: cy + scale * L1 * Math.sin(-q1) };
  const tipAct  = { x: jointAct.x + scale * L2 * Math.cos(-(q1+q2)), y: jointAct.y + scale * L2 * Math.sin(-(q1+q2)) };
  const jointDes = { x: cx + scale * L1 * Math.cos(-q1Des), y: cy + scale * L1 * Math.sin(-q1Des) };
  const tipDes  = { x: jointDes.x + scale * L2 * Math.cos(-(q1Des+q2Des)), y: jointDes.y + scale * L2 * Math.sin(-(q1Des+q2Des)) };

  const r = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="rounded border border-[var(--panel-border)] bg-white">
      <p className="text-xs font-semibold text-center py-1 border-b border-[var(--panel-border)]" style={{ color }}>
        {title}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* podłoga */}
        <line x1={10} y1={cy + 1} x2={W - 10} y2={cy + 1} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
        {/* Trajektoria zadana (ghost) */}
        <line x1={cx} y1={cy} x2={r(jointDes.x)} y2={r(jointDes.y)}
              stroke="#cbd5e1" strokeWidth={4} />
        <line x1={r(jointDes.x)} y1={r(jointDes.y)} x2={r(tipDes.x)} y2={r(tipDes.y)}
              stroke="#cbd5e1" strokeWidth={4} />
        <circle cx={r(tipDes.x)} cy={r(tipDes.y)} r={4} fill="#cbd5e1" />
        {/* Robot rzeczywisty */}
        <line x1={cx} y1={cy} x2={r(jointAct.x)} y2={r(jointAct.y)}
              stroke={color} strokeWidth={5} strokeLinecap="round" />
        <line x1={r(jointAct.x)} y1={r(jointAct.y)} x2={r(tipAct.x)} y2={r(tipAct.y)}
              stroke={color} strokeWidth={5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="#0f172a" />
        <circle cx={r(jointAct.x)} cy={r(jointAct.y)} r={4} fill="#0f172a" />
        <circle cx={r(tipAct.x)} cy={r(tipAct.y)} r={5} fill={color} />
      </svg>
    </div>
  );
}

function TrackingErrorChart({
  t, errPid, errCt, tCursor,
}: { t: number[]; errPid: number[]; errCt: number[]; tCursor: number }) {
  const W = 560, H = 180;
  const padL = 50, padR = 20, padT = 20, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxErr = Math.max(0.001, ...errPid, ...errCt);
  const xOf = (ti: number) => padL + (ti / T_HORIZON) * innerW;
  const yOf = (e: number) => padT + innerH - (e / maxErr) * innerH;

  const r = (n: number) => Math.round(n * 100) / 100;

  const pathPid = errPid.map((e, i) => `${i === 0 ? "M" : "L"} ${r(xOf(t[i]))} ${r(yOf(e))}`).join(" ");
  const pathCt = errCt.map((e, i) => `${i === 0 ? "M" : "L"} ${r(xOf(t[i]))} ${r(yOf(e))}`).join(" ");

  return (
    <div className="rounded border border-[var(--panel-border)] bg-white p-2">
      <p className="text-xs font-semibold mb-1 px-1">
        Błąd śledzenia <M tex="|e(t)| = \sqrt{(q_d - q)^2}" /> [rad]
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* osie */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#94a3b8" strokeWidth={1} />
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#94a3b8" strokeWidth={1} />
        {/* y-tick max */}
        <text x={padL - 5} y={padT + 4} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#64748b">
          {maxErr.toFixed(3)}
        </text>
        <text x={padL - 5} y={padT + innerH + 3} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#64748b">
          0
        </text>
        {/* x-tick */}
        <text x={padL} y={H - 8} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#64748b">0s</text>
        <text x={padL + innerW} y={H - 8} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#64748b">{T_HORIZON}s</text>

        {/* serie */}
        <path d={pathPid} fill="none" stroke="#ef4444" strokeWidth={1.8} />
        <path d={pathCt}  fill="none" stroke="#10b981" strokeWidth={1.8} />

        {/* kursor */}
        <line x1={r(xOf(tCursor))} y1={padT} x2={r(xOf(tCursor))} y2={padT + innerH}
              stroke="#0f172a" strokeWidth={1} strokeDasharray="3 2" />

        {/* legenda */}
        <g transform={`translate(${W - padR - 130}, ${padT + 5})`}>
          <rect x={0} y={0} width={130} height={36} fill="white" stroke="#e5e7eb" rx={3} />
          <line x1={6} y1={11} x2={22} y2={11} stroke="#ef4444" strokeWidth={1.8} />
          <text x={26} y={14} fontSize={9} fontFamily="monospace" fill="#0f172a">PID-only</text>
          <line x1={6} y1={26} x2={22} y2={26} stroke="#10b981" strokeWidth={1.8} />
          <text x={26} y={29} fontSize={9} fontFamily="monospace" fill="#0f172a">PID + NE-FF</text>
        </g>
      </svg>
    </div>
  );
}
