"use client";

import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { useRobotStore } from "@/lib/store";
import { Puma560Model } from "@/components/robot/puma560-model";
import { ManipulabilityEllipsoid } from "./manipulability-ellipsoid";

export function ManipulabilityViewer() {
  const { joints } = useRobotStore();
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)]" style={{ height: 480 }}>
      <Canvas camera={{ position: [1.5, 1.1, 1.5], fov: 42, up: [0, 0, 1] }} gl={{ antialias: true }}>
        <color attach="background" args={["#f8fafc"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 2]} intensity={1.0} />
        <Grid args={[4, 4]} rotation={[-Math.PI / 2, 0, 0]} cellSize={0.1} cellColor="#cbd5e1" sectionSize={0.5} sectionColor="#94a3b8" fadeDistance={6} infiniteGrid />
        <Puma560Model joints={joints} showFrames={false} />
        <ManipulabilityEllipsoid scale={0.25} />
        <OrbitControls target={[0, 0.4, 0]} makeDefault />
      </Canvas>
    </div>
  );
}
