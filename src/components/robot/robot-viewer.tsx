"use client";

import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  height?: number | string;
  cameraPosition?: [number, number, number];
  target?: [number, number, number];
};

export function RobotViewer({
  children,
  height = 480,
  cameraPosition = [1.4, 1.0, 1.4],
  target = [0, 0.4, 0],
}: Props) {
  return (
    <div
      className="rounded-lg overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)]"
      style={{ height }}
    >
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 45, up: [0, 0, 1] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#f8fafc"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow />
        <directionalLight position={[-2, -3, 4]} intensity={0.3} />

        <Grid
          args={[4, 4]}
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          cellSize={0.1}
          cellColor="#cbd5e1"
          sectionSize={0.5}
          sectionColor="#94a3b8"
          fadeDistance={6}
          infiniteGrid
        />

        {children}

        <OrbitControls target={target} makeDefault />
      </Canvas>
    </div>
  );
}
