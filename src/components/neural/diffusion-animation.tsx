"use client";

import { useState } from "react";
import { useMounted } from "@/lib/hooks";

/**
 * Animacja procesu „odszumiania" (denoising diffusion). Slider od 0 do T:
 *   - krok 0:  czysty szum (kropki rozproszone losowo)
 *   - krok T:  formują się dwa wyraźne klastry (poprawne rozwiązania)
 *
 * Pokazuje, jak diffusion model w ~50 krokach przerabia losowy szum w
 * poprawne q (analogicznie do odzyskiwania zdjęcia z silnie zaszumionego).
 */
export function DiffusionAnimation() {
  const [step, setStep] = useState(0);
  const mounted = useMounted();
  const T = 50;
  const t = step / T; // 0..1

  // Punkty: dla każdego losowo wybierana jest „docelowa" gałąź (R/L)
  // i pozycja docelowa. Interpolujemy od czystego szumu do tego celu.
  const N = 80;
  function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let x = Math.imul(s ^ (s >>> 15), 1 | s);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const r = rng(42);
  function gauss(): [number, number] {
    const u = Math.max(1e-6, r()), v = r();
    return [Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v),
            Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v)];
  }

  const points: { x: number; y: number; cluster: number }[] = [];
  for (let i = 0; i < N; i++) {
    const [nx, ny] = gauss();
    const cluster = nx > 0 ? 1 : -1;
    // Pozycja docelowa
    const tx = cluster * 1.5 + nx * 0.15;
    const ty = ny * 0.25;
    // Interpolacja od czystego szumu (t=0) do celu (t=1)
    const x = (1 - t) * nx * 1.5 + t * tx;
    const y = (1 - t) * ny * 1.5 + t * ty;
    points.push({ x, y, cluster });
  }

  const W = 680, H = 320;
  const cx = W / 2, cy = 170;
  const scale = 50;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="font-mono text-xs text-[var(--muted)]">krok dyfuzji:</span>
          <input
            type="range"
            min={0}
            max={T}
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
            style={{ minWidth: 200 }}
          />
          <span className="font-mono text-sm tabular-nums w-20 text-right">
            {step}/{T}
          </span>
          <button
            onClick={() => setStep(0)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
          >
            ← czysty szum
          </button>
          <button
            onClick={() => setStep(T)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
          >
            końcowe q →
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {step === 0 && "Krok 0: czysty losowy szum. Sieć dostaje te kropki na wejściu."}
          {step > 0 && step < T && `Krok ${step}: sieć usuwa trochę szumu. Punkty zaczynają wędrować ku swoim klastrom.`}
          {step === T && `Krok ${T}: gotowe! Punkty utworzyły dwa wyraźne klastry — poprawne rozwiązania IK (np. shoulder R i shoulder L).`}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <text x={W / 2} y={26} fontSize={13} fontFamily="system-ui" fill="#334155" textAnchor="middle" fontWeight={600}>
            Diffusion: krok po kroku usuwamy szum, aż wyłonią się prawidłowe q
          </text>

          {/* Tło — siatka */}
          <g stroke="#e5e7eb" strokeWidth={0.5}>
            {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
              <line key={x} x1={cx + x*scale} y1={50} x2={cx + x*scale} y2={H - 30} />
            ))}
          </g>

          {/* Oś */}
          <line x1={50} y1={cy + 80} x2={W - 50} y2={cy + 80} stroke="#94a3b8" strokeWidth={1} />
          <text x={W - 60} y={cy + 96} fontSize={11} fontFamily="monospace" fill="#64748b" textAnchor="end">q</text>

          {/* Cele końcowe — pokazane jako delikatne tło gdy t > 0.5 */}
          {t > 0.5 && (
            <>
              <circle cx={cx + 1.5 * scale} cy={cy} r={30 * (t - 0.5) * 2} fill="#10b981" opacity={0.08} />
              <circle cx={cx - 1.5 * scale} cy={cy} r={30 * (t - 0.5) * 2} fill="#a855f7" opacity={0.08} />
            </>
          )}

          {/* Punkty — renderowane tylko po hydration, żeby uniknąć rozjazdu
              floating-point między SSR a kliencką ewaluacją Math.cos/log */}
          {mounted && points.map((p, i) => (
            <circle
              key={i}
              cx={cx + p.x * scale}
              cy={cy + p.y * scale}
              r={3}
              fill={p.cluster > 0 ? "#10b981" : "#a855f7"}
              opacity={0.7 + t * 0.3}
            />
          ))}

          {/* Etykiety klastrów (widoczne pod koniec) */}
          {t > 0.7 && (
            <>
              <text x={cx + 1.5 * scale} y={cy - 60} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700} textAnchor="middle" opacity={(t - 0.7) * 3}>
                rozwiązanie 1
              </text>
              <text x={cx - 1.5 * scale} y={cy - 60} fontSize={11} fontFamily="monospace" fill="#a855f7" fontWeight={700} textAnchor="middle" opacity={(t - 0.7) * 3}>
                rozwiązanie 2
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
