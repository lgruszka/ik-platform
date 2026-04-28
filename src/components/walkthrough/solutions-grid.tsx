"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { useTargetStore } from "@/lib/target-store";
import { useRobotStore } from "@/lib/store";
import { solvePuma560Analytical } from "@/lib/solvers";
import { Puma560Model } from "@/components/robot/puma560-model";
import { deg } from "@/lib/utils";

export function SolutionsGrid() {
  const { target } = useTargetStore();
  const { setJoints } = useRobotStore();
  const solutions = useMemo(() => solvePuma560Analytical(target), [target]);

  if (solutions.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center text-[var(--muted)]">
        Brak rozwiązań — poza docelowa jest poza przestrzenią roboczą.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Wszystkie rozwiązania:{" "}
          <span className="text-[var(--muted)] font-normal">{solutions.length}</span>
        </h3>
        <div className="text-xs text-[var(--muted)] font-mono">
          kliknij, aby wczytać do głównego kontrolera
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {solutions.map((sol, i) => (
          <button
            key={i}
            onClick={() => setJoints(sol.joints)}
            className="group rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden hover:border-[var(--accent)] transition-colors text-left"
          >
            <div className="aspect-square bg-[#f8fafc]">
              <Canvas
                camera={{ position: [1.2, 0.8, 1.2], fov: 40, up: [0, 0, 1] }}
                dpr={[1, 1.5]}
                gl={{ antialias: true }}
              >
                <color attach="background" args={["#f8fafc"]} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[2, 3, 2]} intensity={0.9} />
                <Grid
                  args={[2, 2]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  cellSize={0.1}
                  cellColor="#cbd5e1"
                  sectionSize={0.5}
                  sectionColor="#94a3b8"
                  fadeDistance={3}
                />
                <Puma560Model joints={sol.joints} showFrames={false} />
                <OrbitControls target={[0, 0.3, 0]} enablePan={false} enableZoom={false} />
              </Canvas>
            </div>
            <div className="px-3 py-2 text-xs space-y-0.5">
              <div className="font-mono">
                <span className="text-[var(--muted)]">shoulder:</span> {sol.branch?.shoulder}
              </div>
              <div className="font-mono">
                <span className="text-[var(--muted)]">elbow:</span> {sol.branch?.elbow}
              </div>
              <div className="font-mono">
                <span className="text-[var(--muted)]">wrist:</span> {sol.branch?.wrist}
              </div>
              <div className="font-mono tabular-nums text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--panel-border)] mt-1">
                {sol.joints.map((q) => deg(q).toFixed(0).padStart(4)).join(" ")}°
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
