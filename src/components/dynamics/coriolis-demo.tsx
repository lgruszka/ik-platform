"use client";

import { useEffect, useState } from "react";
import { Math as M } from "@/components/ui/math";

/**
 * Wizualizacja siły Coriolisa na obracającej się platformie.
 *
 * Setup: tarcza obraca się z prędkością kątową ω (suwak). Po tarczy porusza
 * się masa radialnie (od osi do brzegu i z powrotem) z prędkością v_r (suwak).
 *
 * W układzie inercjalnym (widok "ze stałego punktu") trajektoria masy to
 * spirala — masa "skręca" mimo że radialnie idzie po prostej.
 * W układzie obracającym się (widok "z tarczy") masa idzie po prostej,
 * ale wymaga to działania siły Coriolisa F_cor = -2·m·ω × v_r prostopadle
 * do v_r.
 *
 * To dokładnie ten sam mechanizm, który w eq. (6.7) NE generuje dodatkowe
 * przyspieszenie kątowe ogniwa nawet przy q̈ = 0:
 *   ε_{i+1} = R·ε_i + (R·ω_i) × q̇_{i+1}·ẑ + q̈_{i+1}·ẑ
 *              ^^^^^^^^^^^^^^^^^^^^^^^^^^ to jest „Coriolis" w NE
 */
export function CoriolisDemo() {
  const [omega, setOmega] = useState(1.5);   // rad/s — prędkość obrotu platformy
  const [vRadial, setVRadial] = useState(0.6); // m/s — prędkość radialna masy
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const [view, setView] = useState<"inertial" | "rotating">("rotating");

  useEffect(() => {
    if (!playing) return;
    let raf: number;
    const start = performance.now();
    const t0 = t;
    const tick = (now: number) => {
      setT(t0 + (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cyklicznie zmieniamy promień od r_min do r_max i z powrotem
  const rMin = 0.2, rMax = 1.4;
  const period = 2 * (rMax - rMin) / vRadial; // s na okres
  const tCyc = ((t % period) + period) % period;
  const goingOut = tCyc < period / 2;
  const rT = goingOut
    ? rMin + vRadial * tCyc
    : rMax - vRadial * (tCyc - period / 2);
  const vSign = goingOut ? +1 : -1; // znak v_r (na zewnątrz lub do środka)

  // Pozycja w układzie inercjalnym
  const angle = omega * t;
  const xIn = rT * Math.cos(angle);
  const yIn = rT * Math.sin(angle);

  // Pozycja w układzie obracającym się (tarcza nieruchoma w widoku)
  const xRot = rT;
  const yRot = 0;

  // Siła Coriolisa w układzie obracającym (na widzu): F_cor = -2·m·ω × v_r
  // ω wzdłuż +z, v_r = vSign·v_r·r̂ (radialnie). Cross product daje styczną
  // składową: -2·ω·v_r·vSign·θ̂. Znak omega też ma znaczenie.
  // F_cor_y = -2·ω·v_r·vSign  (w lokalnym układzie obrotowym)
  const fCorMag = 2 * omega * vRadial; // |F_cor|
  const fCorDir = -Math.sign(omega) * vSign; // znak (góra/dół w widoku rotating)

  // Trajektoria w układzie inercjalnym — od t-2s do t
  const trail: { x: number; y: number }[] = [];
  if (view === "inertial") {
    const N = 200;
    const dt = 2 / N;
    for (let k = 0; k < N; k++) {
      const tk = t - 2 + k * dt;
      if (tk < 0) continue;
      const tkCyc = ((tk % period) + period) % period;
      const tkOut = tkCyc < period / 2;
      const rk = tkOut ? rMin + vRadial * tkCyc : rMax - vRadial * (tkCyc - period / 2);
      const ak = omega * tk;
      trail.push({ x: rk * Math.cos(ak), y: rk * Math.sin(ak) });
    }
  }

  // SVG
  const W = 540, H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const scale = 90; // px/m
  const r = (n: number) => Math.round(n * 100) / 100;

  const x = view === "inertial" ? xIn : xRot;
  const y = view === "inertial" ? yIn : yRot;

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 my-4 not-prose">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-semibold text-sm">
          Demo Coriolisa — obracająca się platforma z masą poruszającą się radialnie
        </p>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-3 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)] font-semibold"
            type="button"
          >
            {playing ? "⏸ pauza" : "▶ play"}
          </button>
          <button
            onClick={() => setT(0)}
            className="px-2 py-1 rounded border border-[var(--panel-border)] hover:bg-[var(--code-bg)]"
            type="button"
          >
            ⟲ reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-[var(--muted)]">ω platformy:</span>
          <input type="range" min={-3} max={3} step={0.1} value={omega}
                 onChange={(e) => setOmega(Number(e.target.value))} className="w-32" />
          <span className="font-mono tabular-nums w-14 text-right">{omega.toFixed(1)} rad/s</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[var(--muted)]">v_r masy:</span>
          <input type="range" min={0.2} max={1.5} step={0.05} value={vRadial}
                 onChange={(e) => setVRadial(Number(e.target.value))} className="w-32" />
          <span className="font-mono tabular-nums w-14 text-right">{vRadial.toFixed(2)} m/s</span>
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[var(--muted)]">widok:</span>
          <div className="flex rounded border border-[var(--panel-border)] overflow-hidden">
            <button
              onClick={() => setView("rotating")}
              className={`px-2 py-1 text-xs ${view === "rotating" ? "bg-[var(--accent)] text-white font-semibold" : "hover:bg-[var(--code-bg)]"}`}
              type="button"
            >
              z tarczy
            </button>
            <button
              onClick={() => setView("inertial")}
              className={`px-2 py-1 text-xs ${view === "inertial" ? "bg-[var(--accent)] text-white font-semibold" : "hover:bg-[var(--code-bg)]"}`}
              type="button"
            >
              inercjalny
            </button>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-[var(--panel-border)] bg-white">
        <defs>
          <marker id="cor-arr-v" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#0ea5e9" />
          </marker>
          <marker id="cor-arr-f" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Tarcza */}
        <circle cx={cx} cy={cy} r={rMax * scale} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={4} fill="#0f172a" />

        {/* Mała oś x na tarczy — w układzie rotating zostaje, w inertialnym obraca się */}
        <g transform={view === "inertial" ? `rotate(${r(-angle * 180 / Math.PI)}, ${cx}, ${cy})` : ""}>
          <line x1={cx} y1={cy} x2={r(cx + rMax * scale)} y2={cy} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 4" />
          <text x={r(cx + rMax * scale - 8)} y={cy - 8} fontSize={10} fontFamily="monospace" fill="#94a3b8">
            ramię tarczy
          </text>
        </g>

        {/* Trajektoria (tylko w widoku inercjalnym) */}
        {view === "inertial" && trail.length > 1 && (
          <path
            d={trail.map((p, i) => `${i === 0 ? "M" : "L"} ${r(cx + p.x * scale)} ${r(cy - p.y * scale)}`).join(" ")}
            fill="none"
            stroke="#a855f7"
            strokeWidth={1.5}
            opacity={0.6}
          />
        )}

        {/* Masa */}
        <circle cx={r(cx + x * scale)} cy={r(cy - y * scale)} r={9} fill="#0ea5e9" stroke="#0c4a6e" strokeWidth={1.5} />
        <text x={r(cx + x * scale)} y={r(cy - y * scale + 24)} textAnchor="middle"
              fontSize={11} fontFamily="monospace" fontWeight={700} fill="#0c4a6e">m</text>

        {/* Strzałka v_r (radialna, w stronę ruchu masy) */}
        {(() => {
          if (view === "inertial") {
            // w układzie inercjalnym v_r idzie wzdłuż wektora (cos a, sin a)
            const len = 60 * vSign;
            return (
              <line
                x1={r(cx + x * scale)} y1={r(cy - y * scale)}
                x2={r(cx + x * scale + len * Math.cos(angle))}
                y2={r(cy - y * scale - len * Math.sin(angle))}
                stroke="#0ea5e9" strokeWidth={2.5} markerEnd="url(#cor-arr-v)"
              />
            );
          } else {
            const len = 60 * vSign;
            return (
              <line
                x1={r(cx + x * scale)} y1={cy}
                x2={r(cx + x * scale + len)} y2={cy}
                stroke="#0ea5e9" strokeWidth={2.5} markerEnd="url(#cor-arr-v)"
              />
            );
          }
        })()}

        {/* Strzałka siły Coriolisa (tylko w widoku rotating — bo w inercjalnym nie istnieje) */}
        {view === "rotating" && omega !== 0 && (
          <>
            <line
              x1={r(cx + x * scale)} y1={cy}
              x2={r(cx + x * scale)} y2={r(cy - fCorDir * fCorMag * 30)}
              stroke="#f59e0b" strokeWidth={2.5} markerEnd="url(#cor-arr-f)"
            />
            <text
              x={r(cx + x * scale + 6)}
              y={r(cy - fCorDir * fCorMag * 30 - 4)}
              fontSize={11} fontFamily="monospace" fontWeight={700} fill="#f59e0b"
            >
              F_Coriolis
            </text>
          </>
        )}

        {/* Strzałka ω (na środku) */}
        <text x={cx + 12} y={cy - 12} fontSize={11} fontFamily="monospace" fontWeight={700} fill="#9333ea">
          ω = {omega.toFixed(1)}
        </text>
        {Math.abs(omega) > 0.1 && (
          <path
            d={`M ${cx + 20} ${cy + 6} A 16 16 0 ${omega > 0 ? "1 0" : "1 1"} ${cx + 6} ${cy + 20}`}
            fill="none" stroke="#9333ea" strokeWidth={2}
            markerEnd="url(#cor-arr-f)"
          />
        )}

        {/* Legenda */}
        <g transform={`translate(15, ${H - 70})`}>
          <rect x={0} y={0} width={170} height={60} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
          <line x1={8} y1={14} x2={26} y2={14} stroke="#0ea5e9" strokeWidth={2.5} />
          <text x={32} y={17} fontSize={10} fontFamily="monospace" fill="#0c4a6e">v_r (radialna)</text>
          <line x1={8} y1={30} x2={26} y2={30} stroke="#f59e0b" strokeWidth={2.5} />
          <text x={32} y={33} fontSize={10} fontFamily="monospace" fill="#92400e">F_Coriolis = -2·m·ω×v_r</text>
          {view === "inertial" && (
            <>
              <line x1={8} y1={46} x2={26} y2={46} stroke="#a855f7" strokeWidth={1.5} />
              <text x={32} y={49} fontSize={10} fontFamily="monospace" fill="#6b21a8">trajektoria (spirala)</text>
            </>
          )}
        </g>
      </svg>

      <p className="text-xs text-[var(--foreground)] mt-3 mb-0">
        <strong>Co zauważyć:</strong> w widoku „z tarczy" masa idzie po linii prostej{" "}
        (radialnie), ale działa na nią <span style={{ color: "#f59e0b" }}>siła Coriolisa</span> —
        żółta strzałka prostopadła do prędkości. Wzór:{" "}
        <M tex="\mathbf{F}_\text{Cor} = -2m\,\boldsymbol\omega\times\mathbf{v}_r" />.
        W widoku inercjalnym (przełącz przyciskiem wyżej) ta sama trajektoria to{" "}
        <span style={{ color: "#a855f7" }}>spirala</span> — żadnej dodatkowej siły nie
        potrzeba, ruch jest „prosty" w sensie newtonowskim, tylko widziany z obracającego się
        układu wymaga „dodatku". Dokładnie taki sam dodatek pojawia się w eq. (6.7) NE jako{" "}
        <M tex="(R\,\boldsymbol\omega_i)\times\dot\theta_{i+1}\hat z" /> — i właśnie dlatego
        ogniwo poniżej obracającej się bazy może mieć niezerowe <M tex="\boldsymbol\varepsilon" />{" "}
        nawet gdy <M tex="\ddot\theta = 0" />.
      </p>
    </div>
  );
}
