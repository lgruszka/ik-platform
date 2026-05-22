"use client";

import { useState } from "react";
import { useEs5Store } from "@/lib/es5-store";
import { ES5 } from "@/lib/robots/es5";
import { RobotViewer } from "../robot/robot-viewer";
import { Es5Model } from "./es5-model";
import { deg, rad } from "@/lib/utils";

type Props = {
  height?: number;
  showFrames?: boolean;
};

const JOINT_NAMES = ["θ₁", "θ₂", "θ₃", "θ₄", "θ₅", "θ₆"];

/**
 * Playground ES5 dla modułów dynamiki. Wyświetla 3D robota + 3 panele
 * suwaków: q (konfiguracja), q̇ (prędkości), q̈ (przyspieszenia).
 */
export function Es5Playground({ height = 480, showFrames = false }: Props) {
  const {
    joints, qDot, qDdot,
    setJoint, setQDot, setQDdot, resetToHome,
  } = useEs5Store();
  const [showCom, setShowCom] = useState(false);
  const [showInertia, setShowInertia] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="relative">
        <RobotViewer height={height}>
          <Es5Model
            joints={joints}
            showFrames={showFrames}
            showCom={showCom}
            showInertiaEllipsoids={showInertia}
          />
        </RobotViewer>
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 bg-white/85 dark:bg-black/60 backdrop-blur rounded-md border border-[var(--panel-border)] px-2 py-1.5 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showCom}
              onChange={(e) => setShowCom(e.target.checked)}
              className="accent-purple-500"
            />
            <span style={{ color: "#a855f7" }}>● środki masy</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showInertia}
              onChange={(e) => setShowInertia(e.target.checked)}
              className="accent-teal-500"
            />
            <span style={{ color: "#14b8a6" }}>● elipsoidy bezwładności</span>
          </label>
        </div>
      </div>
      <div className="space-y-3">
        {/* Konfiguracja q */}
        <SliderPanel
          title="Konfiguracja q [°]"
          rangeLabelClass=""
          values={joints as readonly number[]}
          onChange={(i, v) => setJoint(i, v)}
          format={(v) => `${deg(v).toFixed(1)}°`}
          getLimits={(i) => ES5.dh[i].limits ?? { min: -Math.PI, max: Math.PI }}
          step={rad(0.5)}
          accent="#0ea5e9"
          onReset={resetToHome}
        />
        {/* Prędkości q̇ [rad/s] */}
        <SliderPanel
          title="Prędkości q̇ [rad/s]"
          values={qDot}
          onChange={(i, v) => setQDot(i, v)}
          format={(v) => `${v.toFixed(2)} rad/s`}
          getLimits={() => ({ min: -3, max: 3 })}
          step={0.05}
          accent="#f97316"
        />
        {/* Przyspieszenia q̈ [rad/s²] */}
        <SliderPanel
          title="Przyspieszenia q̈ [rad/s²]"
          values={qDdot}
          onChange={(i, v) => setQDdot(i, v)}
          format={(v) => `${v.toFixed(2)} rad/s²`}
          getLimits={() => ({ min: -10, max: 10 })}
          step={0.1}
          accent="#a855f7"
        />
      </div>
    </div>
  );
}

function SliderPanel({
  title, values, onChange, format, getLimits, step, accent, onReset, rangeLabelClass,
}: {
  title: string;
  values: readonly number[];
  onChange: (i: number, v: number) => void;
  format: (v: number) => string;
  getLimits: (i: number) => { min: number; max: number };
  step: number;
  accent: string;
  onReset?: () => void;
  rangeLabelClass?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>{title}</h3>
        {onReset && (
          <button
            onClick={onReset}
            className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)]"
          >
            reset
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {JOINT_NAMES.map((name, i) => {
          const lim = getLimits(i);
          return (
            <div key={i} className="grid grid-cols-[2rem_1fr_4.5rem] items-center gap-2">
              <span className={`font-mono text-xs text-[var(--muted)] ${rangeLabelClass ?? ""}`}>{name}</span>
              <input
                type="range"
                min={lim.min}
                max={lim.max}
                step={step}
                value={values[i]}
                onChange={(e) => onChange(i, parseFloat(e.target.value))}
                className="accent-[var(--accent)]"
              />
              <span className="font-mono text-[10px] text-right tabular-nums">
                {format(values[i])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
