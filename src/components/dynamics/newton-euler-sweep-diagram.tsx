"use client";

import { useEffect, useState } from "react";

/**
 * Animowany schemat propagacji forward+backward sweep dla 6-ogniwowego robota.
 *
 * Najważniejszy element pedagogiczny modułu — pokazuje przepływ informacji
 * wzdłuż algorytmu link by link, zamiast zostawiać studenta z 5 równaniami
 * rekurencyjnymi z indeksami (i, i+1) i kazaniem mu sobie wyobrazić co się
 * dzieje.
 *
 * Animacja w 12 krokach:
 *   krok 0:        baza, ω₀=0, ε₀=0, a₀=-g·ẑ
 *   kroki 1-6:     forward sweep — przesuwamy kursor od bazy do końcówki,
 *                  na każdym ogniwie podświetlamy "wiem ω, ε, a → liczę F_C, N_C"
 *   krok 7:        końcówka, f_{n+1}=0, n_{n+1}=0
 *   kroki 8-13:    backward sweep — od końcówki do bazy, bilans sił,
 *                  na każdym ogniwie podświetlamy "wiem F_C, N_C → liczę f, n, τ"
 */
export function NewtonEulerSweepDiagram() {
  const linkCount = 6;
  const totalSteps = linkCount * 2 + 2; // 6 forward + 6 backward + 2 init
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((s) => {
        if (s >= totalSteps - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [playing, totalSteps]);

  // Fazy:
  //   0          = inicjalizacja bazy (forward init)
  //   1..6       = forward sweep aktywny na ogniwie (step-1+1) = step
  //   7          = inicjalizacja końcówki (backward init)
  //   8..13      = backward sweep aktywny na ogniwie (7 - (step-7)) = 14-step
  const isForwardInit = step === 0;
  const isForward = step >= 1 && step <= 6;
  const isBackwardInit = step === 7;
  const isBackward = step >= 8 && step <= 13;
  const activeForwardLink = isForward ? step : null; // 1..6
  const activeBackwardLink = isBackward ? 14 - step : null; // 6..1

  const W = 760;
  const H = 320;
  const linkWidth = 80;
  const linkGap = 16;
  const linksTotalWidth = linkCount * linkWidth + (linkCount - 1) * linkGap;
  const x0 = (W - linksTotalWidth) / 2;
  const linkY = 130;
  const linkH = 56;

  const linkX = (i: number) => x0 + i * (linkWidth + linkGap);

  const linkState = (i: number): "pending" | "active-fwd" | "done-fwd" | "active-bwd" | "done-bwd" => {
    const linkNum = i + 1;
    if (isForward) {
      if (linkNum < activeForwardLink!) return "done-fwd";
      if (linkNum === activeForwardLink) return "active-fwd";
      return "pending";
    }
    if (step === 7 || isBackwardInit) return "done-fwd";
    if (isBackward) {
      if (linkNum > activeBackwardLink!) return "done-bwd";
      if (linkNum === activeBackwardLink) return "active-bwd";
      return "done-fwd";
    }
    return "pending";
  };

  const fillFor = (state: ReturnType<typeof linkState>) => {
    switch (state) {
      case "pending": return "#f1f5f9";
      case "active-fwd": return "#bae6fd";
      case "done-fwd": return "#e0f2fe";
      case "active-bwd": return "#e9d5ff";
      case "done-bwd": return "#f3e8ff";
    }
  };
  const strokeFor = (state: ReturnType<typeof linkState>) => {
    if (state === "active-fwd") return "#0284c7";
    if (state === "active-bwd") return "#9333ea";
    return "#64748b";
  };

  // Tekst opisujący aktualny krok
  const stepDescription = (): { phase: string; detail: string; color: string } => {
    if (isForwardInit) {
      return {
        phase: "Forward · inicjalizacja",
        detail: "Baza: ω₀ = 0, ε₀ = 0, a₀ = -g·ẑ (sztuczka Craig'a — grawitacja zaszyta w przyspieszeniu bazy)",
        color: "#0284c7",
      };
    }
    if (isForward) {
      const i = activeForwardLink!;
      return {
        phase: `Forward · ogniwo ${i}`,
        detail: `Mając ω, ε, a od ogniwa ${i - 1}, propaguję wzorami (6.6)–(6.9) na ogniwo ${i}. Wyliczam a_C${i} i stąd F_C${i} = m${i}·a_C${i}, N_C${i} = I${i}·ε${i} + ω${i}×(I${i}·ω${i}).`,
        color: "#0284c7",
      };
    }
    if (isBackwardInit) {
      return {
        phase: "Backward · inicjalizacja",
        detail: "Za końcówką brak obciążenia: f₇ = 0, n₇ = 0. (Jeśli robot trzyma przedmiot — dodajemy tu jego ciężar.)",
        color: "#9333ea",
      };
    }
    if (isBackward) {
      const i = activeBackwardLink!;
      return {
        phase: `Backward · ogniwo ${i}`,
        detail: `Mając f, n od ogniwa ${i + 1}, bilansuję z F_C${i}, N_C${i} (wyliczonymi w forward). Dostaję f${i}, n${i} w przegubie ${i}. Moment napędowy: τ${i} = (n${i})_z.`,
        color: "#9333ea",
      };
    }
    return { phase: "—", detail: "—", color: "#64748b" };
  };

  const desc = stepDescription();

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 my-6 not-prose">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-semibold text-sm">
          Animacja: jak przebiega forward + backward sweep
        </p>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => { setStep(0); setPlaying(false); }}
            className="px-2 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
            type="button"
          >
            ⟲ reset
          </button>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="px-2 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
            type="button"
            disabled={step === 0}
          >
            ← krok
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-3 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)] font-semibold"
            type="button"
          >
            {playing ? "⏸ pauza" : "▶ play"}
          </button>
          <button
            onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            className="px-2 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
            type="button"
            disabled={step === totalSteps - 1}
          >
            krok →
          </button>
          <span className="text-[var(--muted)] tabular-nums ml-2">{step + 1} / {totalSteps}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-[var(--panel-border)] bg-white">
        <defs>
          <marker id="sweep-arr-fwd" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#0284c7" />
          </marker>
          <marker id="sweep-arr-bwd" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#9333ea" />
          </marker>
        </defs>

        {/* Tytuły kierunkowe */}
        <text x={W / 2} y={28} textAnchor="middle" fontSize={13} fontFamily="system-ui" fontWeight={600}
              fill={isForward || isForwardInit ? "#0284c7" : "#94a3b8"}>
          → Forward sweep · propaguj kinematykę (ω, ε, a) ·{" "}
          {isForwardInit ? "inicjalizacja" : isForward ? `aktywne ogniwo ${activeForwardLink}` : "zakończony"}
        </text>

        {/* Strzałka kierunku forward */}
        <line x1={x0 - 35} y1={50} x2={x0 + linksTotalWidth + 25} y2={50}
              stroke={isForward || isForwardInit ? "#0284c7" : "#cbd5e1"}
              strokeWidth={isForward || isForwardInit ? 2.5 : 1.5}
              markerEnd="url(#sweep-arr-fwd)" />
        <text x={x0 - 40} y={54} textAnchor="end" fontSize={11} fontFamily="monospace" fill="#0284c7">baza</text>
        <text x={x0 + linksTotalWidth + 30} y={54} textAnchor="start" fontSize={11} fontFamily="monospace" fill="#0284c7">końcówka</text>

        {/* Kursor forward — kropka przesuwająca się wzdłuż strzałki */}
        {(isForward || isForwardInit) && (
          <circle
            cx={isForwardInit ? x0 - 35 : linkX(activeForwardLink! - 1) + linkWidth / 2}
            cy={50}
            r={6}
            fill="#0284c7"
          >
            <animate attributeName="r" values="6;9;6" dur="1s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Ogniwa */}
        {Array.from({ length: linkCount }, (_, i) => {
          const state = linkState(i);
          return (
            <g key={i}>
              <rect
                x={linkX(i)} y={linkY} width={linkWidth} height={linkH}
                fill={fillFor(state)} stroke={strokeFor(state)}
                strokeWidth={state === "active-fwd" || state === "active-bwd" ? 2.5 : 1.5}
                rx={4}
              />
              <text x={linkX(i) + linkWidth / 2} y={linkY + 22} textAnchor="middle"
                    fontSize={13} fontFamily="monospace" fontWeight={600} fill="#0f172a">
                ogniwo {i + 1}
              </text>
              {/* Etykiety stanu */}
              {(state === "done-fwd" || state === "active-fwd") && (
                <text x={linkX(i) + linkWidth / 2} y={linkY + 40} textAnchor="middle"
                      fontSize={10} fontFamily="monospace" fill="#0284c7">
                  ω, ε, a ✓
                </text>
              )}
              {(state === "done-bwd" || state === "active-bwd") && (
                <text x={linkX(i) + linkWidth / 2} y={linkY + 52} textAnchor="middle"
                      fontSize={10} fontFamily="monospace" fontWeight={600} fill="#9333ea">
                  τ{i + 1} ✓
                </text>
              )}
            </g>
          );
        })}

        {/* Strzałka kierunku backward */}
        <line x1={x0 + linksTotalWidth + 25} y1={H - 50} x2={x0 - 35} y2={H - 50}
              stroke={isBackward || isBackwardInit ? "#9333ea" : "#cbd5e1"}
              strokeWidth={isBackward || isBackwardInit ? 2.5 : 1.5}
              markerEnd="url(#sweep-arr-bwd)" />
        <text x={x0 - 40} y={H - 46} textAnchor="end" fontSize={11} fontFamily="monospace" fill="#9333ea">baza</text>
        <text x={x0 + linksTotalWidth + 30} y={H - 46} textAnchor="start" fontSize={11} fontFamily="monospace" fill="#9333ea">końcówka</text>

        {(isBackward || isBackwardInit) && (
          <circle
            cx={isBackwardInit ? x0 + linksTotalWidth + 25 : linkX(activeBackwardLink! - 1) + linkWidth / 2}
            cy={H - 50}
            r={6}
            fill="#9333ea"
          >
            <animate attributeName="r" values="6;9;6" dur="1s" repeatCount="indefinite" />
          </circle>
        )}

        <text x={W / 2} y={H - 22} textAnchor="middle" fontSize={13} fontFamily="system-ui" fontWeight={600}
              fill={isBackward || isBackwardInit ? "#9333ea" : "#94a3b8"}>
          ← Backward sweep · bilansuj siły (f, n, τ) ·{" "}
          {isBackwardInit ? "inicjalizacja" : isBackward ? `aktywne ogniwo ${activeBackwardLink}` : "oczekuje"}
        </text>
      </svg>

      <div
        className="mt-3 rounded-md px-3 py-2 text-sm"
        style={{
          backgroundColor: desc.color === "#0284c7" ? "#f0f9ff" : desc.color === "#9333ea" ? "#faf5ff" : "#f8fafc",
          borderLeft: `3px solid ${desc.color}`,
        }}
      >
        <p className="font-semibold mb-1" style={{ color: desc.color }}>{desc.phase}</p>
        <p className="text-[var(--foreground)] text-[13px] leading-snug mb-0">{desc.detail}</p>
      </div>

      <p className="text-xs text-[var(--muted)] mt-3 mb-0">
        <strong>Co warto zauważyć:</strong> w forward sweep przesuwamy się{" "}
        <span style={{ color: "#0284c7" }}>od bazy do końcówki</span> i wyliczamy{" "}
        <em>tylko kinematykę</em> (ω, ε, a, a_C) — bez ani jednej siły. Dopiero
        gdy mamy a_C dla wszystkich ogniw, wyliczamy lokalnie F_C i N_C (Newton+Euler).
        Backward sweep idzie <span style={{ color: "#9333ea" }}>od końcówki do bazy</span>{" "}
        i przekształca te F_C, N_C w momenty napędowe τ_i, dorzucając propagowane
        siły od ogniwa wyższego. To rozdzielenie jest kluczem do <em>O(n)</em>{" "}
        kosztu obliczeniowego.
      </p>
    </div>
  );
}
