"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Line, OrbitControls } from "@react-three/drei";
import { solvePuma560Analytical, pickClosestSolution } from "@/lib/solvers";
import { Puma560Ghost } from "@/components/robot/puma560-ghost";
import { composeSE3 } from "@/lib/math/matrix";
import { rpyToMatrix } from "@/lib/math/rotations";
import { PUMA560 } from "@/lib/robots";
import type { IKBranch, JointConfig, Matrix4, Vec3 } from "@/lib/types";
import { BRANCH_COLOURS, branchKey } from "@/lib/branch-colors";
import { deg } from "@/lib/utils";

const START_POS: Vec3 = [0.45, 0.15, 0.3];
const END_POS: Vec3 = [0.25, -0.35, 0.55];
const RPY: Vec3 = [0, Math.PI, 0]; // tool pointing down

function buildPose(t: number): Matrix4 {
  const p: Vec3 = [
    START_POS[0] * (1 - t) + END_POS[0] * t,
    START_POS[1] * (1 - t) + END_POS[1] * t,
    START_POS[2] * (1 - t) + END_POS[2] * t,
  ];
  const R = rpyToMatrix(RPY[0], RPY[1], RPY[2]);
  return composeSE3(R, p);
}

type BranchChoice = { shoulder: IKBranch["shoulder"]; elbow: IKBranch["elbow"]; wrist: IKBranch["wrist"] };

function pickByBranch(target: Matrix4, choice: BranchChoice): JointConfig | null {
  const sols = solvePuma560Analytical(target);
  const match = sols.find(
    (s) =>
      s.branch?.shoulder === choice.shoulder &&
      s.branch?.elbow === choice.elbow &&
      s.branch?.wrist === choice.wrist,
  );
  return match ? match.joints : null;
}

function AnimatedScene({ t }: { t: number }) {
  const branches: BranchChoice[] = [
    { shoulder: "right", elbow: "up", wrist: "noflip" },
    { shoulder: "right", elbow: "down", wrist: "noflip" },
    { shoulder: "left", elbow: "up", wrist: "noflip" },
    { shoulder: "left", elbow: "down", wrist: "noflip" },
  ];

  const target = buildPose(t);
  const configs = branches.map((b) => ({ b, q: pickByBranch(target, b) }));

  const tcpLine: [number, number, number][] = [];
  for (let s = 0; s <= 1.0001; s += 0.02) {
    const p = buildPose(s);
    tcpLine.push([p[0][3], p[1][3], p[2][3]]);
  }

  return (
    <>
      <color attach="background" args={["#f8fafc"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 2]} intensity={1.0} />
      <Grid
        args={[4, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellSize={0.1}
        cellColor="#cbd5e1"
        sectionSize={0.5}
        sectionColor="#94a3b8"
        fadeDistance={6}
        infiniteGrid
      />
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.1, 24]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.6} />
      </mesh>

      <Line points={tcpLine} color="#dc2626" lineWidth={2} dashed dashSize={0.03} gapSize={0.015} />

      <mesh position={[target[0][3], target[1][3], target[2][3]]}>
        <sphereGeometry args={[0.025, 18, 18]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
      </mesh>

      {configs.map(({ b, q }, i) =>
        q ? (
          <Puma560Ghost
            key={i}
            joints={q}
            color={BRANCH_COLOURS[branchKey(b)]}
            opacity={0.7}
          />
        ) : null,
      )}

      <OrbitControls target={[0, 0.4, 0]} makeDefault />
    </>
  );
}

export function TrajectoryDemo() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((x) => {
        const next = x + dt / 4;
        if (next >= 1) return 0;
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)]" style={{ height: 440 }}>
        <Canvas camera={{ position: [1.7, 1.3, 1.7], fov: 42, up: [0, 0, 1] }} gl={{ antialias: true }}>
          <AnimatedScene t={t} />
        </Canvas>
      </div>
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90"
          >
            {playing ? "■ pauza" : "▶ odtwórz"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <div className="font-mono text-xs text-[var(--muted)] tabular-nums w-12 text-right">
            t = {t.toFixed(2)}
          </div>
        </div>
        <div className="mt-2 text-xs text-[var(--muted)]">
          Trajektoria liniowa w przestrzeni kartezjańskiej od {" "}
          <span className="font-mono">({START_POS.map((x) => x.toFixed(2)).join(", ")})</span> do{" "}
          <span className="font-mono">({END_POS.map((x) => x.toFixed(2)).join(", ")})</span> z orientacją{" "}
          <span className="font-mono">RPY = (0°, 180°, 0°)</span> (narzędzie skierowane w dół).
          Pokazane są cztery gałęzie wrist-noflip; obserwuj, jak znikają/pojawiają się przy przekraczaniu granic osiągalności dla danej gałęzi.
        </div>
      </div>
    </div>
  );
}
