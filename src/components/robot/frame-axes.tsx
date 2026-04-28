"use client";

import { Line } from "@react-three/drei";

type Props = {
  size?: number;
  lineWidth?: number;
};

export function FrameAxes({ size = 0.08, lineWidth = 2 }: Props) {
  return (
    <group>
      <Line points={[[0, 0, 0], [size, 0, 0]]} color="#ef4444" lineWidth={lineWidth} />
      <Line points={[[0, 0, 0], [0, size, 0]]} color="#10b981" lineWidth={lineWidth} />
      <Line points={[[0, 0, 0], [0, 0, size]]} color="#3b82f6" lineWidth={lineWidth} />
    </group>
  );
}
