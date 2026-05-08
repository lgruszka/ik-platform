"use client";

import { useState } from "react";

/**
 * Schemat elektryczny silnika DC z kontrolą napięcia i prądu.
 * Pokazuje 4 elementy: napięcie zasilania u, rezystancja R_t,
 * indukcyjność L, oraz źródło EMF wirnika (k_e·ω_m).
 *
 * Slidery pozwalają wpisać u i ω_m i widzieć aktualny prąd i = (u - k_e·ω_m) / R_t
 * (model quasi-statyczny, pomijający di/dt).
 */
export function MotorSchematic() {
  const [u, setU] = useState(24);          // napięcie [V]
  const [omegaM, setOmegaM] = useState(50); // prędkość wirnika [rad/s]
  const [kT, setKT] = useState(0.1418);    // stała momentowa [Nm/A]
  const [ke, setKe] = useState(0.12);      // stała elektryczna [V/(rad/s)]
  const [Rt, setRt] = useState(0.7);       // rezystancja [Ω]

  const i = (u - ke * omegaM) / Rt;
  const tauM = kT * i;
  const power = u * i;

  const W = 720, H = 240;

  return (
    <div className="space-y-3 not-prose">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <Slider label="u [V]" min={0} max={48} step={0.5} value={u} onChange={setU} />
        <Slider label="ω_m [rad/s]" min={-100} max={100} step={1} value={omegaM} onChange={setOmegaM} />
        <Slider label="k_T [Nm/A]" min={0.05} max={0.3} step={0.001} value={kT} onChange={setKT} />
        <Slider label="k_e [V/(r/s)]" min={0.05} max={0.3} step={0.001} value={ke} onChange={setKe} />
        <Slider label="R_t [Ω]" min={0.1} max={5} step={0.05} value={Rt} onChange={setRt} />
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Zewnętrzny obwód */}
          <rect x={50} y={40} width={620} height={160} fill="none" stroke="#94a3b8" strokeWidth={1.5} />

          {/* Napięcie zasilania (po lewej, jako bateria) */}
          <line x1={50} y1={120} x2={90} y2={120} stroke="#0ea5e9" strokeWidth={2} />
          <line x1={90} y1={100} x2={90} y2={140} stroke="#0ea5e9" strokeWidth={2} />
          <line x1={100} y1={110} x2={100} y2={130} stroke="#0ea5e9" strokeWidth={3} />
          <text x={70} y={170} fontSize={11} fontFamily="monospace" fill="#0ea5e9" textAnchor="middle">u</text>
          <text x={70} y={185} fontSize={10} fontFamily="monospace" fill="#0ea5e9" textAnchor="middle">{u.toFixed(1)} V</text>

          {/* Rezystancja R (zygzak) */}
          <line x1={140} y1={60} x2={170} y2={60} stroke="#475569" strokeWidth={2} />
          <polyline
            points={`170,60 175,55 185,65 195,55 205,65 215,55 225,65 230,60`}
            fill="none" stroke="#475569" strokeWidth={2}
          />
          <line x1={230} y1={60} x2={260} y2={60} stroke="#475569" strokeWidth={2} />
          <text x={200} y={45} fontSize={11} fontFamily="monospace" fill="#475569" textAnchor="middle">R_t = {Rt.toFixed(2)} Ω</text>

          {/* Indukcyjność L (3 łuki) */}
          <line x1={260} y1={60} x2={290} y2={60} stroke="#475569" strokeWidth={2} />
          <path d="M 290 60 A 12 8 0 0 1 314 60" fill="none" stroke="#475569" strokeWidth={2} />
          <path d="M 314 60 A 12 8 0 0 1 338 60" fill="none" stroke="#475569" strokeWidth={2} />
          <path d="M 338 60 A 12 8 0 0 1 362 60" fill="none" stroke="#475569" strokeWidth={2} />
          <line x1={362} y1={60} x2={400} y2={60} stroke="#475569" strokeWidth={2} />
          <text x={326} y={45} fontSize={11} fontFamily="monospace" fill="#475569" textAnchor="middle">L</text>

          {/* EMF wirnika (po prawej, koło z plus/minus) */}
          <circle cx={500} cy={60} r={20} fill="white" stroke="#a855f7" strokeWidth={2} />
          <text x={500} y={56} fontSize={14} fontFamily="monospace" fill="#a855f7" textAnchor="middle" fontWeight={700}>+</text>
          <text x={500} y={70} fontSize={11} fontFamily="monospace" fill="#a855f7" textAnchor="middle">−</text>
          <line x1={400} y1={60} x2={480} y2={60} stroke="#475569" strokeWidth={2} />
          <line x1={520} y1={60} x2={620} y2={60} stroke="#475569" strokeWidth={2} />
          <text x={500} y={35} fontSize={11} fontFamily="monospace" fill="#a855f7" textAnchor="middle">EMF = k_e·ω_m</text>
          <text x={500} y={97} fontSize={10} fontFamily="monospace" fill="#a855f7" textAnchor="middle">{(ke * omegaM).toFixed(2)} V</text>

          {/* Prąd I (strzałka pokazująca kierunek) */}
          <line x1={620} y1={60} x2={620} y2={180} stroke="#475569" strokeWidth={2} />
          <line x1={620} y1={180} x2={100} y2={180} stroke="#475569" strokeWidth={2} />
          <line x1={100} y1={180} x2={100} y2={130} stroke="#475569" strokeWidth={2} />
          {/* Strzałka prądu na dole obwodu */}
          <polygon
            points={`360,176 350,180 360,184`}
            fill={i > 0 ? "#10b981" : "#ef4444"}
          />
          <text x={360} y={170} fontSize={11} fontFamily="monospace" fill={i > 0 ? "#10b981" : "#ef4444"} textAnchor="middle" fontWeight={700}>
            i = {i.toFixed(2)} A
          </text>

          {/* Wirnik (po prawej obrazek z τ) */}
          <g transform="translate(620, 60)">
            <circle r={28} fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} />
            <text fontSize={11} fontFamily="monospace" fill="#92400e" textAnchor="middle" y={-5}>silnik</text>
            <text fontSize={11} fontFamily="monospace" fill="#92400e" textAnchor="middle" y={9}>τ_m = k_T·i</text>
            <text fontSize={10} fontFamily="monospace" fill="#92400e" textAnchor="middle" y={22}>{tauM.toFixed(3)} Nm</text>
          </g>
        </svg>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 text-xs font-mono space-y-1">
        <div className="grid grid-cols-[auto_1fr] gap-x-3">
          <span className="text-[var(--muted)]">Równanie elektryczne:</span>
          <span>u = R_t·i + L·di/dt + k_e·ω_m   <span className="text-[var(--muted)]">(quasi-statyka: pomijamy L·di/dt)</span></span>
          <span className="text-[var(--muted)]">Aktualnie:</span>
          <span>i = (u − k_e·ω_m) / R_t = ({u.toFixed(1)} − {(ke * omegaM).toFixed(2)}) / {Rt.toFixed(2)} = <strong>{i.toFixed(3)} A</strong></span>
          <span className="text-[var(--muted)]">Moment na wale:</span>
          <span>τ_m = k_T·i = <strong>{tauM.toFixed(4)} Nm</strong></span>
          <span className="text-[var(--muted)]">Moc chwilowa:</span>
          <span>P = u·i = <strong className={power > 0 ? "text-[var(--accent)]" : "text-red-500"}>{power.toFixed(2)} W</strong></span>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[var(--muted)] text-[10px] uppercase tracking-wider">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-[var(--accent)]"
      />
      <span className="text-right tabular-nums">{value.toFixed(value < 1 ? 3 : 1)}</span>
    </label>
  );
}
