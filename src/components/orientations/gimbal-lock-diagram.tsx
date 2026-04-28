"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, Torus } from "@react-three/drei";
import { Euler, Quaternion as TQuat } from "three";
import { useMemo } from "react";
import { rad } from "@/lib/utils";
import { FrameAxes } from "@/components/robot/frame-axes";

/**
 * Wizualizacja gimbal lock dla kątów Eulera. Trzy obręcze (zewnętrzna, środkowa,
 * wewnętrzna) reprezentują trzy osie obrotu. Gdy pitch = ±90°, środkowa obręcz
 * leży w tej samej płaszczyźnie co zewnętrzna — tracimy stopień swobody.
 */
export function GimbalLockDiagram() {
  const [rollDeg, setRoll] = useState(20);
  const [pitchDeg, setPitch] = useState(70);
  const [yawDeg, setYaw] = useState(0);

  const isLocked = Math.abs(pitchDeg) > 88;

  const yawQ = useMemo(
    () => new TQuat().setFromEuler(new Euler(0, 0, rad(yawDeg), "ZYX")),
    [yawDeg],
  );
  const pitchQ = useMemo(
    () => new TQuat().setFromEuler(new Euler(0, rad(pitchDeg), rad(yawDeg), "ZYX")),
    [pitchDeg, yawDeg],
  );
  const fullQ = useMemo(
    () => new TQuat().setFromEuler(new Euler(rad(rollDeg), rad(pitchDeg), rad(yawDeg), "ZYX")),
    [rollDeg, pitchDeg, yawDeg],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Trzy obręcze gimbala</h3>
          {isLocked && (
            <span className="font-mono text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              ⚠ GIMBAL LOCK
            </span>
          )}
        </div>
        <div className="space-y-2">
          <SliderRow label="Yaw (Z)" value={yawDeg} setValue={setYaw} color="#ef4444" />
          <SliderRow label="Pitch (Y)" value={pitchDeg} setValue={setPitch} color="#10b981" />
          <SliderRow label="Roll (X)" value={rollDeg} setValue={setRoll} color="#3b82f6" />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)]" style={{ height: 380 }}>
        <Canvas camera={{ position: [2.2, 1.6, 2.2], fov: 45, up: [0, 0, 1] }}>
          <color attach="background" args={["#f8fafc"]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 5, 2]} intensity={1.0} />
          <Grid
            args={[3, 3]}
            rotation={[-Math.PI / 2, 0, 0]}
            cellSize={0.1}
            cellColor="#cbd5e1"
            sectionSize={0.5}
            sectionColor="#94a3b8"
            fadeDistance={6}
            infiniteGrid
          />

          {/* Zewnętrzna obręcz — yaw, w płaszczyźnie XY (oś Z), czerwona */}
          <group quaternion={yawQ}>
            <Torus args={[1.0, 0.025, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#ef4444" />
            </Torus>
          </group>

          {/* Środkowa obręcz — pitch, zielona, obrócona przez yaw */}
          <group quaternion={pitchQ}>
            <Torus args={[0.8, 0.025, 16, 64]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color="#10b981" />
            </Torus>
          </group>

          {/* Wewnętrzna obręcz — roll, niebieska, obrócona przez yaw·pitch */}
          <group quaternion={fullQ}>
            <Torus args={[0.6, 0.025, 16, 64]}>
              <meshStandardMaterial color="#3b82f6" />
            </Torus>
            {/* Triada osi w wewnętrznym układzie */}
            <FrameAxes size={0.45} />
            {/* Sześcian pokazujący orientację */}
            <mesh>
              <boxGeometry args={[0.18, 0.12, 0.08]} />
              <meshStandardMaterial color="#a855f7" />
            </mesh>
          </group>

          <OrbitControls makeDefault />
        </Canvas>
      </div>

      <p className="text-xs text-[var(--muted)]">
        <strong>Spróbuj:</strong> ustaw <span className="font-mono text-[#10b981]">pitch ≈ 90°</span>.
        Czerwona (yaw) i niebieska (roll) obręcze zaczynają obracać się wokół tej samej osi —{" "}
        <strong>tracisz jeden stopień swobody</strong>. Zmiana yaw daje teraz to samo co zmiana roll.
        To jest <strong>gimbal lock</strong> — nieusuwalna patologia kątów Eulera.
      </p>
    </div>
  );
}

function SliderRow({
  label, value, setValue, color,
}: { label: string; value: number; setValue: (v: number) => void; color: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr_4rem] items-center gap-3">
      <span className="font-mono text-sm" style={{ color }}>{label}</span>
      <input
        type="range"
        min={-90}
        max={90}
        step={0.5}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        style={{ accentColor: color }}
      />
      <span className="font-mono text-xs tabular-nums text-right">{value.toFixed(1)}°</span>
    </div>
  );
}
