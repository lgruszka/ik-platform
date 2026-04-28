"use client";

import { useMemo } from "react";
import { Vector3, Quaternion } from "three";
import { Line } from "@react-three/drei";
import { forwardKinematicsFrames, linkIntermediates } from "@/lib/robots";
import { PUMA560 } from "@/lib/robots";
import { decomposeFrame } from "@/lib/math/three-interop";
import type { JointConfig, Matrix4 } from "@/lib/types";
import { FrameAxes } from "./frame-axes";

type Props = {
  joints: JointConfig;
  showFrames?: boolean;
  showWristCenter?: boolean;
  tcpLength?: number;
  highlight?: "none" | "wrist-center";
};

/** Rigid cylinder between two 3-D points, optionally with a slightly different colour. */
function Segment({ from, to, radius = 0.03, color = "#71717a" }:
  { from: Vector3; to: Vector3; radius?: number; color?: string }) {
  const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5);
  const dir = new Vector3().subVectors(to, from);
  const length = dir.length();
  if (length < 1e-5) return null;
  const up = new Vector3(0, 1, 0);
  const dirN = dir.clone().normalize();
  const axis = new Vector3().crossVectors(up, dirN);
  const dot = Math.min(1, Math.max(-1, up.dot(dirN)));
  const angle = Math.acos(dot);
  const q =
    axis.lengthSq() < 1e-10
      ? new Quaternion()
      : new Quaternion().setFromAxisAngle(axis.normalize(), angle);
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[radius, radius, length, 20]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

function JointMarker({ T, color = "#f59e0b", radius = 0.05 }:
  { T: Matrix4; color?: string; radius?: number }) {
  const { position, quaternion } = decomposeFrame(T);
  return (
    <mesh position={position} quaternion={quaternion}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}

// Colours: "a" segments (długość ogniwa) — darker; "d" segments (odsadzenie) — amber tint.
const COLOR_A = "#52525b";       // długość ogniwa (segment wzdłuż aᵢ)
const COLOR_D = "#c87941";       // odsadzenie wzdłuż osi z (segment dᵢ)
const COLOR_WRIST = "#a1a1aa";   // nadgarstek (krótkie ogniwa 4→5→6)

export function Puma560Model({
  joints,
  showFrames = true,
  showWristCenter = false,
  tcpLength = 0.15,
  highlight = "none",
}: Props) {
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
  const links = useMemo(() => linkIntermediates(PUMA560, joints), [joints]);

  // frames: [T0_base, T0_1, T0_2, T0_3, T0_4, T0_5, T0_6, T0_tcp]
  const tcp = frames[7];
  const wristCenter = frames[5];
  const tcpPos = decomposeFrame(tcp).position;

  return (
    <group>
      {/* Base pedestal — short cylinder standing upright along world Z (we use Z-up convention). */}
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.1, 24]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.7} />
      </mesh>
      {/* Short vertical column representing link 1 (shoulder housing). */}
      <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.16, 20]} />
        <meshStandardMaterial color={COLOR_A} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Kinematic chain split into a-segments (długość ogniwa) and d-segments (odsadzenie). */}
      {links.map((L, i) => {
        const A = decomposeFrame(L.Tprev).position;
        const B = decomposeFrame(L.TafterA).position;
        const C = decomposeFrame(L.Tfinal).position;
        const isWrist = i >= 3;
        const radius = isWrist ? 0.028 : 0.04;
        return (
          <group key={i}>
            {L.aLen > 1e-4 && (
              <Segment from={A} to={B} radius={radius} color={COLOR_A} />
            )}
            {Math.abs(L.dLen) > 1e-4 && (
              <Segment from={B} to={C} radius={radius} color={COLOR_D} />
            )}
          </group>
        );
      })}

      {/* Wrist cluster — three rotations without translation; show as a ball. */}
      <mesh position={decomposeFrame(frames[5]).position}>
        <sphereGeometry args={[0.038, 20, 20]} />
        <meshStandardMaterial color={COLOR_WRIST} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Tool link: from frame 6 to TCP */}
      <Segment
        from={decomposeFrame(frames[6]).position}
        to={tcpPos}
        radius={0.012}
        color="#fbbf24"
      />

      {/* Joint markers */}
      <JointMarker T={frames[1]} color="#facc15" radius={0.035} />
      <JointMarker T={frames[2]} color="#facc15" radius={0.035} />
      <JointMarker T={frames[3]} color="#facc15" radius={0.032} />
      <JointMarker T={frames[4]} color="#f97316" radius={0.028} />
      <JointMarker T={frames[5]} color="#f97316" radius={0.028} />
      <JointMarker T={frames[6]} color="#f97316" radius={0.026} />

      {/* TCP tip */}
      <mesh position={tcpPos}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.3} />
      </mesh>

      {/* Wrist-centre highlight (aureole) */}
      {(showWristCenter || highlight === "wrist-center") && (
        <mesh position={decomposeFrame(wristCenter).position}>
          <sphereGeometry args={[0.06, 20, 20]} />
          <meshStandardMaterial color="#a855f7" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Triad axes on each kinematic frame (if requested) */}
      {showFrames &&
        frames.map((T, i) => {
          const { position, quaternion } = decomposeFrame(T);
          return (
            <group key={i} position={position} quaternion={quaternion}>
              <FrameAxes size={i === frames.length - 1 ? 0.12 : 0.07} />
            </group>
          );
        })}

      {/* Skeleton trace through joint origins (dashed, for context) */}
      <Line
        points={frames.map((T) => decomposeFrame(T).position.toArray() as [number, number, number])}
        color="#e4e4e7"
        lineWidth={1}
        dashed
        dashSize={0.02}
        gapSize={0.02}
      />
    </group>
  );
}
