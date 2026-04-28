"use client";

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { Quaternion as TQuat, Euler } from "three";
import {
  rpyToMatrix,
} from "@/lib/math/rotations";
import {
  matrixToAxisAngle,
  matrixToQuaternion,
  matrixToRotationVector,
} from "@/lib/math/orientations";
import { rad, deg } from "@/lib/utils";
import { FrameAxes } from "@/components/robot/frame-axes";

/**
 * Interaktywny eksplorator reprezentacji orientacji. Trzy slidery RPY
 * (roll, pitch, yaw) sterują tą samą rotacją 3D. Po prawej ta sama orientacja
 * pokazana w pięciu reprezentacjach jednocześnie — student widzi, że to są
 * po prostu różne zapisy tej samej fizycznej rzeczy.
 */
export function OrientationExplorer() {
  const [rollDeg, setRoll] = useState(30);
  const [pitchDeg, setPitch] = useState(45);
  const [yawDeg, setYaw] = useState(60);

  const data = useMemo(() => {
    const roll = rad(rollDeg);
    const pitch = rad(pitchDeg);
    const yaw = rad(yawDeg);
    const R = rpyToMatrix(roll, pitch, yaw);
    const axisAngle = matrixToAxisAngle(R);
    const rotVec = matrixToRotationVector(R);
    const quat = matrixToQuaternion(R);
    return { R, axisAngle, rotVec, quat, roll, pitch, yaw };
  }, [rollDeg, pitchDeg, yawDeg]);

  // Three.js quaternion dla orientacji wizualizacji 3D
  const threeQuat = useMemo(() => {
    const e = new Euler(data.roll, data.pitch, data.yaw, "ZYX");
    return new TQuat().setFromEuler(e);
  }, [data.roll, data.pitch, data.yaw]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold mb-3">Sterowanie orientacją (RPY w stopniach)</h3>
        <div className="space-y-2">
          <SliderRow label="Roll (X)" value={rollDeg} setValue={setRoll} />
          <SliderRow label="Pitch (Y)" value={pitchDeg} setValue={setPitch} />
          <SliderRow label="Yaw (Z)" value={yawDeg} setValue={setYaw} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="rounded-lg overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)]" style={{ height: 360 }}>
          <Canvas camera={{ position: [1.6, 1.2, 1.6], fov: 45, up: [0, 0, 1] }}>
            <color attach="background" args={["#f8fafc"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 5, 2]} intensity={1.0} />
            <Grid
              args={[2, 2]}
              rotation={[-Math.PI / 2, 0, 0]}
              cellSize={0.1}
              cellColor="#cbd5e1"
              sectionSize={0.5}
              sectionColor="#94a3b8"
              fadeDistance={4}
              infiniteGrid
            />
            {/* Układ świata (bazowy) */}
            <FrameAxes size={0.4} />
            {/* Obrócony układ */}
            <group quaternion={threeQuat}>
              <FrameAxes size={0.55} />
              {/* Mała kostka, żeby było widać orientację */}
              <mesh>
                <boxGeometry args={[0.25, 0.18, 0.12]} />
                <meshStandardMaterial color="#a855f7" transparent opacity={0.6} />
              </mesh>
            </group>
            <OrbitControls makeDefault />
          </Canvas>
        </div>

        <div className="space-y-3">
          <RepresentationCard title="1. Macierz rotacji R ∈ SO(3)" color="#0ea5e9">
            <pre className="text-[10px] font-mono leading-relaxed">{formatMatrix3(data.R)}</pre>
            <div className="text-[10px] text-[var(--muted)] mt-2 leading-snug">
              9 liczb, 6 ograniczeń (ortonormalność kolumn) → 3 stopnie swobody.
            </div>
          </RepresentationCard>

          <RepresentationCard title="2. Kąty Eulera RPY (Z·Y·X)" color="#a855f7">
            <div className="font-mono text-xs space-y-0.5">
              <div>roll  = {rollDeg.toFixed(2)}°  ({data.roll.toFixed(4)} rad)</div>
              <div>pitch = {pitchDeg.toFixed(2)}°  ({data.pitch.toFixed(4)} rad)</div>
              <div>yaw   = {yawDeg.toFixed(2)}°  ({data.yaw.toFixed(4)} rad)</div>
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-2 leading-snug">
              3 liczby, minimalna parametryzacja. Singularność przy pitch = ±90°.
            </div>
          </RepresentationCard>

          <RepresentationCard title="3. Axis-angle (oś, kąt)" color="#10b981">
            <div className="font-mono text-xs space-y-0.5">
              <div>k̂ = ({data.axisAngle.axis.map((v) => v.toFixed(4)).join(", ")})</div>
              <div>θ = {deg(data.axisAngle.angle).toFixed(2)}°  ({data.axisAngle.angle.toFixed(4)} rad)</div>
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-2 leading-snug">
              4 liczby (oś jednostkowa: 3 + 1 ograniczenie + kąt: 1) → 3 DOF.
            </div>
          </RepresentationCard>

          <RepresentationCard title="4. Wektor rotacji r = θ·k̂" color="#f59e0b">
            <div className="font-mono text-xs">
              r = ({data.rotVec.map((v) => v.toFixed(4)).join(", ")})
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-2 leading-snug">
              3 liczby. ‖r‖ = θ, kierunek r = oś. Używane w OpenCV i ROS.
            </div>
          </RepresentationCard>

          <RepresentationCard title="5. Kwaternion jednostkowy" color="#ef4444">
            <div className="font-mono text-xs space-y-0.5">
              <div>w = {data.quat[0].toFixed(4)}</div>
              <div>x = {data.quat[1].toFixed(4)}</div>
              <div>y = {data.quat[2].toFixed(4)}</div>
              <div>z = {data.quat[3].toFixed(4)}</div>
              <div className="text-[var(--muted)]">
                ‖q‖ = {Math.hypot(...data.quat).toFixed(6)}
              </div>
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-2 leading-snug">
              4 liczby z 1 ograniczeniem (‖q‖ = 1). Brak singularności. q i −q to ten sam obrót.
            </div>
          </RepresentationCard>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, setValue }: { label: string; value: number; setValue: (v: number) => void }) {
  return (
    <div className="grid grid-cols-[6rem_1fr_4rem] items-center gap-3">
      <span className="font-mono text-sm text-[var(--muted)]">{label}</span>
      <input
        type="range"
        min={-180}
        max={180}
        step={0.5}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="accent-[var(--accent)]"
      />
      <span className="font-mono text-xs tabular-nums text-right">{value.toFixed(1)}°</span>
    </div>
  );
}

function RepresentationCard({
  title, color, children,
}: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-y border-r bg-[var(--panel)] px-3 py-2.5" style={{ borderLeftColor: color, borderTopColor: "var(--panel-border)", borderRightColor: "var(--panel-border)", borderBottomColor: "var(--panel-border)" }}>
      <div className="text-xs font-semibold mb-1.5" style={{ color }}>{title}</div>
      {children}
    </div>
  );
}

function formatMatrix3(M: import("@/lib/types").Matrix3): string {
  return M.map((row) => row.map((v) => v.toFixed(4).padStart(8)).join(" ")).join("\n");
}
