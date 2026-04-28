"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Interaktywna animacja MLP — forward pass krok po kroku.
 * Sieć: 3 wejścia → 4 neurony ukryte (tanh) → 2 wyjścia.
 * Każdy krok pokazuje, co się dzieje: które wejścia są używane, jaką sumę
 * ważoną oblicza neuron, jaka jest jej aktywacja po tanh.
 *
 * Cel: dać studentowi intuicję, że sieć neuronowa to po prostu kalkulator
 * sum ważonych — żadnej magii.
 */

// Stała sieć z deterministycznymi wagami (tak żeby liczby były „ładne")
const W1 = [
  [ 0.4, -0.6,  0.3], // neuron 1 (z 3 wejść)
  [-0.5,  0.8,  0.2], // neuron 2
  [ 0.7,  0.1, -0.4], // neuron 3
  [ 0.2, -0.3,  0.9], // neuron 4
];
const B1 = [0.1, -0.2, 0.05, 0.0];

const W2 = [
  [ 0.5, -0.3,  0.6, -0.2], // wyjście 1
  [-0.4,  0.7, -0.1,  0.5], // wyjście 2
];
const B2 = [0.0, 0.1];

const INPUT = [0.6, -0.2, 0.5]; // przykładowe wejście (pozycja, kąt, …)

function dot(w: number[], x: number[], b: number) {
  return w.reduce((s, wi, i) => s + wi * x[i], 0) + b;
}

const tanh = Math.tanh;

const STEPS = [
  { id: 0, name: "Start" },
  { id: 1, name: "Wejście" },
  { id: 2, name: "Neuron H1" },
  { id: 3, name: "Neuron H2" },
  { id: 4, name: "Neuron H3" },
  { id: 5, name: "Neuron H4" },
  { id: 6, name: "Wyjście Y1" },
  { id: 7, name: "Wyjście Y2" },
  { id: 8, name: "Gotowe!" },
];

export function NeuralNetworkAnimation() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  // Oblicz aktywacje
  const h_pre = W1.map((w, i) => dot(w, INPUT, B1[i]));
  const h_post = h_pre.map(tanh);
  const y_pre = W2.map((w, i) => dot(w, h_post, B2[i]));
  const y = y_pre; // ostatnia warstwa liniowa

  // Pozycje neuronów (SVG)
  const W = 720, H = 380;
  const xIn = 100, xH = 360, xOut = 620;
  const inputPositions = INPUT.map((_, i) => ({ x: xIn, y: 100 + i * 80 }));
  const hiddenPositions = h_post.map((_, i) => ({ x: xH, y: 70 + i * 70 }));
  const outputPositions = y.map((_, i) => ({ x: xOut, y: 130 + i * 80 }));

  // Co jest „aktywne" w danym kroku
  const inputActive = step >= 1;
  const hiddenActive = (idx: number) => step >= 2 + idx;
  const outputActive = (idx: number) => step >= 6 + idx;

  // Aktywne połączenie: do podświetlenia w bieżącym kroku (na potrzeby strzałek)
  const activeHiddenIdx = step >= 2 && step <= 5 ? step - 2 : -1;
  const activeOutputIdx = step === 6 ? 0 : step === 7 ? 1 : -1;

  // Ramka informacyjna
  const info = renderInfo(step, h_pre, h_post, y);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={step >= STEPS.length - 1 && !playing}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {playing ? "■ pauza" : step >= STEPS.length - 1 ? "✓ koniec" : "▶ odtwórz"}
          </button>
          <button
            onClick={() => { setStep(0); setPlaying(false); }}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
          >
            ↻ reset
          </button>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)] disabled:opacity-50"
          >
            ← wstecz
          </button>
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={step >= STEPS.length - 1}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)] disabled:opacity-50"
          >
            dalej →
          </button>
          <span className="text-xs font-mono text-[var(--muted)]">
            krok {step}/{STEPS.length - 1}: <span className="text-[var(--foreground)] font-semibold">{STEPS[step].name}</span>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            <marker id="nn-arr" markerWidth="8" markerHeight="8" refX="6" refY="2" orient="auto">
              <path d="M0,0 L6,2 L0,4 Z" fill="#a855f7" />
            </marker>
          </defs>

          {/* Etykiety warstw */}
          <text x={xIn} y={30} fontSize={12} fontFamily="system-ui" fill="#0ea5e9" fontWeight={700} textAnchor="middle">Wejście</text>
          <text x={xH} y={30} fontSize={12} fontFamily="system-ui" fill="#a855f7" fontWeight={700} textAnchor="middle">Warstwa ukryta (tanh)</text>
          <text x={xOut} y={30} fontSize={12} fontFamily="system-ui" fill="#10b981" fontWeight={700} textAnchor="middle">Wyjście</text>

          {/* Połączenia input → hidden */}
          {inputPositions.map((ip, i) =>
            hiddenPositions.map((hp, j) => {
              const w = W1[j][i];
              const isActive = activeHiddenIdx === j && step >= 2;
              const opacity = isActive ? 0.95 : step >= 2 ? 0.2 : 0.08;
              return (
                <line
                  key={`ih-${i}-${j}`}
                  x1={ip.x + 18} y1={ip.y}
                  x2={hp.x - 22} y2={hp.y}
                  stroke={w >= 0 ? "#3b82f6" : "#fb923c"}
                  strokeWidth={Math.abs(w) * 2 + 0.5}
                  opacity={opacity}
                />
              );
            }),
          )}

          {/* Połączenia hidden → output */}
          {hiddenPositions.map((hp, i) =>
            outputPositions.map((op, j) => {
              const w = W2[j][i];
              const isActive = activeOutputIdx === j;
              const opacity = isActive ? 0.95 : step >= 6 ? 0.2 : 0.08;
              return (
                <line
                  key={`ho-${i}-${j}`}
                  x1={hp.x + 22} y1={hp.y}
                  x2={op.x - 22} y2={op.y}
                  stroke={w >= 0 ? "#3b82f6" : "#fb923c"}
                  strokeWidth={Math.abs(w) * 2 + 0.5}
                  opacity={opacity}
                />
              );
            }),
          )}

          {/* Neurony wejściowe */}
          {inputPositions.map((p, i) => (
            <g key={`in-${i}`}>
              <circle cx={p.x} cy={p.y} r={18} fill={inputActive ? "#0ea5e9" : "white"} stroke="#0ea5e9" strokeWidth={2} />
              <text x={p.x} y={p.y + 4} fontSize={11} fontFamily="monospace" fill={inputActive ? "white" : "#0ea5e9"} textAnchor="middle" fontWeight={600}>
                {INPUT[i].toFixed(1)}
              </text>
              <text x={p.x - 30} y={p.y + 4} fontSize={11} fontFamily="monospace" fill="#64748b" textAnchor="end">
                x{i + 1} =
              </text>
            </g>
          ))}

          {/* Neurony ukryte */}
          {hiddenPositions.map((p, i) => {
            const active = hiddenActive(i);
            const isCurrent = activeHiddenIdx === i;
            return (
              <g key={`h-${i}`}>
                <circle
                  cx={p.x} cy={p.y} r={22}
                  fill={active ? "#a855f7" : "white"}
                  stroke={isCurrent ? "#facc15" : "#a855f7"}
                  strokeWidth={isCurrent ? 4 : 2}
                />
                <text x={p.x} y={p.y + 4} fontSize={11} fontFamily="monospace" fill={active ? "white" : "#a855f7"} textAnchor="middle" fontWeight={600}>
                  {active ? h_post[i].toFixed(2) : `h${i + 1}`}
                </text>
              </g>
            );
          })}

          {/* Neurony wyjściowe */}
          {outputPositions.map((p, i) => {
            const active = outputActive(i);
            const isCurrent = activeOutputIdx === i;
            return (
              <g key={`out-${i}`}>
                <circle
                  cx={p.x} cy={p.y} r={20}
                  fill={active ? "#10b981" : "white"}
                  stroke={isCurrent ? "#facc15" : "#10b981"}
                  strokeWidth={isCurrent ? 4 : 2}
                />
                <text x={p.x} y={p.y + 4} fontSize={11} fontFamily="monospace" fill={active ? "white" : "#10b981"} textAnchor="middle" fontWeight={600}>
                  {active ? y[i].toFixed(2) : `y${i + 1}`}
                </text>
                <text x={p.x + 30} y={p.y + 4} fontSize={11} fontFamily="monospace" fill="#64748b">
                  = q{i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded-lg border-l-4 border-y border-r border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3" style={{ borderLeftColor: "#a855f7" }}>
        {info}
      </div>
    </div>
  );
}

function renderInfo(step: number, h_pre: number[], h_post: number[], y: number[]) {
  if (step === 0) {
    return (
      <div className="text-sm">
        <p className="font-semibold mb-1">Mała sieć MLP — 3 wejścia, 4 neurony ukryte, 2 wyjścia.</p>
        <p className="text-[var(--muted)]">Naciśnij <span className="font-mono">▶ odtwórz</span> albo <span className="font-mono">dalej →</span> żeby przejść przez forward pass krok po kroku. W każdym kroku zobaczysz, co dokładnie się dzieje.</p>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="text-sm">
        <p className="font-semibold mb-1">Krok 1: Wejście</p>
        <p>Mamy trzy liczby na wejściu: <code className="font-mono">x = (0.6, −0.2, 0.5)</code>. Wyobraź sobie że to np. współrzędne pozycji końcówki robota, którą chcemy osiągnąć.</p>
      </div>
    );
  }
  if (step >= 2 && step <= 5) {
    const i = step - 2;
    const w = W1[i];
    const b = B1[i];
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Krok {step}: Neuron ukryty H{i + 1}</p>
        <p className="text-xs">Każdy neuron robi to samo — bierze ważoną sumę wszystkich wejść i przepuszcza przez tanh:</p>
        <p className="font-mono text-xs bg-[var(--panel)] rounded px-2 py-1 inline-block">
          h{i + 1} = tanh({w.map((wi, j) => `${wi >= 0 && j > 0 ? "+" : ""}${wi.toFixed(2)}·x{j + 1}`.replace("{j + 1}", `${j + 1}`)).join(" ")} {b >= 0 ? "+" : ""}{b.toFixed(2)})
        </p>
        <p className="font-mono text-xs">
          = tanh({h_pre[i].toFixed(3)}) = <span className="text-[var(--accent)] font-bold">{h_post[i].toFixed(3)}</span>
        </p>
        <p className="text-xs text-[var(--muted)] italic">Funkcja tanh „ścieśnia" wynik do przedziału (−1, 1) — to wprowadza nieliniowość, bez której sieć byłaby tylko jedną dużą macierzą.</p>
      </div>
    );
  }
  if (step === 6 || step === 7) {
    const i = step - 6;
    const w = W2[i];
    const b = B2[i];
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Krok {step}: Wyjście Y{i + 1}</p>
        <p className="text-xs">Wyjście to znów ważona suma — tym razem z aktywacji warstwy ukrytej:</p>
        <p className="font-mono text-xs bg-[var(--panel)] rounded px-2 py-1 inline-block">
          y{i + 1} = {w.map((wi, j) => `${wi >= 0 && j > 0 ? "+" : ""}${wi.toFixed(2)}·h${j + 1}`).join(" ")} {b >= 0 ? "+" : ""}{b.toFixed(2)}
        </p>
        <p className="font-mono text-xs">
          = <span className="text-[var(--accent)] font-bold">{y[i].toFixed(3)}</span>
        </p>
        <p className="text-xs text-[var(--muted)] italic">W ostatniej warstwie zwykle nie używamy aktywacji nieliniowej (tutaj wartość może być dowolna — np. kąt przegubu w radianach).</p>
      </div>
    );
  }
  return (
    <div className="text-sm">
      <p className="font-semibold mb-1">Gotowe! ✓</p>
      <p>Sieć przeliczyła trzy liczby wejściowe na dwie liczby wyjściowe — wszystko przez ciąg <strong>mnożeń</strong> i <strong>dodawań</strong>, plus jedną nieliniową funkcję (tanh).</p>
      <p className="text-xs text-[var(--muted)] mt-2">
        W „prawdziwej" sieci dla IK Pumy: 6 wejść (poza T) → 64 neurony × 2 warstwy → 6 wyjść (kąty q). Ten sam wzór, tylko więcej liczb.
        <strong> Wagi (te liczby przy strzałkach)</strong> są uczone — początkowo losowe, potem dopasowywane na danych treningowych przez algorytm zwany <em>backpropagation</em>.
      </p>
    </div>
  );
}
