"use client";

import { useMemo } from "react";
import { Vector3 } from "three";
import { Line } from "@react-three/drei";
import { forwardKinematicsFrames, PUMA560 } from "@/lib/robots";
import { decomposeFrame } from "@/lib/math/three-interop";
import type { JointConfig, Matrix4 } from "@/lib/types";

type Props = {
  joints: JointConfig;
  color: string;
  opacity?: number;
  tcpLength?: number;
};

/**
 * Simplified, semi-transparent Puma render used to stack multiple solutions on
 * one scene. Only links + joint spheres + TCP marker — no frame axes, no base
 * pedestal. Colouring via a single colour per ghost identifies the branch.
 */
export function Puma560Ghost({ joints, color, opacity = 0.55, tcpLength = 0.15 }: Props) {
  const robotWithTool = useMemo(
    () => ({
      ...PUMA560,
      toolOffset: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, tcpLength],
        [0, 0, 0, 1],
      ] as Matrix4,
    }),
    [tcpLength],
  );
  const frames = useMemo(
    () => forwardKinematicsFrames(robotWithTool, joints),
    [robotWithTool, joints],
  );

  const segments: [Vector3, Vector3][] = [];
  for (let i = 0; i < frames.length - 1; i++) {
    segments.push([
      decomposeFrame(frames[i]).position,
      decomposeFrame(frames[i + 1]).position,
    ]);
  }

  return (
    <group>
      {segments.map(([a, b], i) => (
        <Line
          key={i}
          points={[a.toArray() as [number, number, number], b.toArray() as [number, number, number]]}
          color={color}
          lineWidth={i === segments.length - 1 ? 2 : 5}
          transparent
          opacity={opacity}
        />
      ))}
      {frames.slice(1, -1).map((T, i) => {
        const p = decomposeFrame(T).position;
        return (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshStandardMaterial color={color} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}
