"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { useTargetStore } from "@/lib/target-store";
import { usePlaygroundStore } from "@/lib/playground-store";
import { solvePuma560Analytical } from "@/lib/solvers";
import { Puma560Ghost } from "@/components/robot/puma560-ghost";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import { decomposeFrame } from "@/lib/math/three-interop";
import { BRANCH_COLOURS, branchKey } from "@/lib/branch-colors";
import { forwardKinematics } from "@/lib/robots";
import { PUMA560 } from "@/lib/robots";

export function AllBranchesViewer() {
  const { target } = useTargetStore();
  const { selectedBranches } = usePlaygroundStore();
  const solutions = useMemo(() => solvePuma560Analytical(target), [target]);
  const tcpPos = decomposeFrame(target).position;

  const visible = solutions.filter((s) => s.branch && selectedBranches.has(branchKey(s.branch)));

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)]" style={{ height: 540 }}>
      <Canvas
        shadows
        camera={{ position: [1.7, 1.3, 1.7], fov: 42, up: [0, 0, 1] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#f8fafc"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 2]} intensity={1.0} />
        <directionalLight position={[-2, -3, 4]} intensity={0.3} />

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

        {/* Base pedestal */}
        <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.1, 24]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} />
        </mesh>

        {/* Target TCP marker — shared by all branches */}
        <mesh position={tcpPos}>
          <sphereGeometry args={[0.025, 20, 20]} />
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
        </mesh>

        {visible.map((sol, i) => (
          <Puma560Ghost
            key={i}
            joints={sol.joints}
            color={BRANCH_COLOURS[branchKey(sol.branch!)]}
            opacity={0.65}
          />
        ))}

        <OrbitControls target={[0, 0.4, 0]} makeDefault />
      </Canvas>
    </div>
  );
}
