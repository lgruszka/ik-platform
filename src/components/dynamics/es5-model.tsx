"use client";

import { useMemo } from "react";
import { Vector3, Quaternion } from "three";
import { Line } from "@react-three/drei";
import { ES5, ES5_INERTIA } from "@/lib/robots/es5";
import { forwardKinematicsFrames, linkIntermediates } from "@/lib/robots";
import { decomposeFrame } from "@/lib/math/three-interop";
import type { JointConfig, Matrix4 } from "@/lib/types";
import { FrameAxes } from "../robot/frame-axes";

type Props = {
  joints: JointConfig;
  showFrames?: boolean;
  showCom?: boolean;
  showInertiaEllipsoids?: boolean;
  tcpLength?: number;
};

/** Cylinder łączący dwa punkty 3D — z wyrównaniem do osi Y geometrii three.js. */
function Segment({ from, to, radius = 0.04, color = "#52525b" }:
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
  const q = axis.lengthSq() < 1e-10 ? new Quaternion()
    : new Quaternion().setFromAxisAngle(axis.normalize(), angle);
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[radius, radius, length, 20]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

/**
 * Elipsoida bezwładności w lokalnym układzie ogniwa, narysowana wokół
 * środka masy. Półosie są proporcjonalne do 1/√λᵢ (gdzie λᵢ to główne
 * momenty bezwładności) — intuicja: dłuższa półoś = łatwiej obracać
 * (mniejsza bezwładność) wokół tej osi. Skala dobrana tak, żeby elipsoida
 * mieściła się w typowej geometrii ogniwa (~0.1 m skala bazowa).
 *
 * Założenie: tensor I_C jest diagonalny w lokalnym układzie ogniwa
 * (cylinderInertia → diag). Główne osie elipsoidy = osie lokalne ogniwa.
 */
function InertiaEllipsoid({
  centerWorld, linkQuaternion, Ixx, Iyy, Izz, mass,
}: {
  centerWorld: Vector3;
  linkQuaternion: Quaternion;
  Ixx: number; Iyy: number; Izz: number; mass: number;
}) {
  // Półosie ∝ 1/√(I_i/m). Skala bazowa: dla 1 kg·m² normalizujemy do 0.08 m.
  // Wartość poniżej dobrana empirycznie żeby elipsoidy były wyraźne ale nie
  // przesłaniały samego ogniwa.
  const scaleFactor = 0.025;
  const rx = scaleFactor / Math.sqrt(Math.max(Ixx / mass, 1e-6));
  const ry = scaleFactor / Math.sqrt(Math.max(Iyy / mass, 1e-6));
  const rz = scaleFactor / Math.sqrt(Math.max(Izz / mass, 1e-6));
  // Hard cap na rozmiar — gdy I bardzo małe (np. nadgarstek wzdłuż osi
  // głównej cylindra), elipsoida nie powinna „rosnąć w nieskończoność".
  const maxR = 0.12;
  const cap = (v: number) => Math.min(maxR, v);
  return (
    <mesh position={centerWorld} quaternion={linkQuaternion} scale={[cap(rx), cap(ry), cap(rz)]}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color="#14b8a6" transparent opacity={0.28} roughness={0.4} />
    </mesh>
  );
}

function JointMarker({ T, color = "#facc15", radius = 0.038 }:
  { T: Matrix4; color?: string; radius?: number }) {
  const { position, quaternion } = decomposeFrame(T);
  return (
    <mesh position={position} quaternion={quaternion}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}

const COLOR_LINK = "#52525b";   // dłuższe ogniwa (a₃, a₄)
const COLOR_OFFSET = "#c87941"; // odsadzenia (d_4, d_5, d_6)
const COLOR_WRIST = "#a1a1aa";  // sferyczna obudowa nadgarstka

/**
 * Schematyczny model 3D ES5 zgodnie z Rys. 6.1 dysertacji.
 * Konwencja Z-up (z_world wzwyż). Kalkowany z `puma560-model.tsx`.
 */
export function Es5Model({
  joints,
  showFrames = false,
  showCom = false,
  showInertiaEllipsoids = false,
  tcpLength = 0.08,
}: Props) {
  const robotWithTool = useMemo(
    () => ({
      ...ES5,
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
  const links = useMemo(() => linkIntermediates(ES5, joints), [joints]);

  // frames: [base, T_0_1, T_0_2, ..., T_0_6, T_0_tcp]
  const tcpPos = decomposeFrame(frames[7]).position;

  return (
    <group>
      {/* Cokół ES5 — krótki cylinder pionowy */}
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.10, 0.12, 0.1, 24]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.7} />
      </mesh>

      {/* Łańcuch kinematyczny */}
      {links.map((L, i) => {
        const A = decomposeFrame(L.Tprev).position;
        const B = decomposeFrame(L.TafterA).position;
        const C = decomposeFrame(L.Tfinal).position;
        const isWrist = i >= 3;
        const radius = isWrist ? 0.025 : 0.038;
        return (
          <group key={i}>
            {L.aLen > 1e-4 && (
              <Segment from={A} to={B} radius={radius} color={COLOR_LINK} />
            )}
            {Math.abs(L.dLen) > 1e-4 && (
              <Segment from={B} to={C} radius={radius} color={COLOR_OFFSET} />
            )}
          </group>
        );
      })}

      {/* Sferyczna obudowa nadgarstka (na frame 5) */}
      <mesh position={decomposeFrame(frames[5]).position}>
        <sphereGeometry args={[0.04, 20, 20]} />
        <meshStandardMaterial color={COLOR_WRIST} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Łącznik narzędzia */}
      <Segment
        from={decomposeFrame(frames[6]).position}
        to={tcpPos}
        radius={0.012}
        color="#fbbf24"
      />

      {/* Markery przegubów */}
      {[1, 2, 3].map((i) => (
        <JointMarker key={i} T={frames[i]} color="#facc15" radius={0.034} />
      ))}
      {[4, 5, 6].map((i) => (
        <JointMarker key={i} T={frames[i]} color="#f97316" radius={0.026} />
      ))}

      {/* TCP */}
      <mesh position={tcpPos}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.3} />
      </mesh>

      {/* Środki masy (jeśli włączone) — fioletowe kuleczki w lokalnym układzie ogniwa */}
      {(showCom || showInertiaEllipsoids) &&
        frames.slice(1, 7).map((T, i) => {
          const inertia = ES5_INERTIA[i];
          const { position: linkPos, quaternion: linkQ } = decomposeFrame(T);
          // pCom w bazie: T_0_(i+1) · pCom_local — używamy lokalnego układu ogniwa
          // przesuniętego o pCom (lokalnie).
          const pComLocal = new Vector3(inertia.pCom[0], inertia.pCom[1], inertia.pCom[2]);
          const pComWorld = pComLocal.clone().applyQuaternion(linkQ).add(linkPos);
          return (
            <group key={`com-${i}`}>
              {showCom && (
                <mesh position={pComWorld}>
                  <sphereGeometry args={[0.015, 12, 12]} />
                  <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={0.4} />
                </mesh>
              )}
              {showInertiaEllipsoids && (
                <InertiaEllipsoid
                  centerWorld={pComWorld}
                  linkQuaternion={linkQ}
                  Ixx={inertia.I[0][0]}
                  Iyy={inertia.I[1][1]}
                  Izz={inertia.I[2][2]}
                  mass={inertia.m}
                />
              )}
            </group>
          );
        })}

      {/* Triad osi DH (jeśli włączone) */}
      {showFrames &&
        frames.map((T, i) => {
          const { position, quaternion } = decomposeFrame(T);
          return (
            <group key={i} position={position} quaternion={quaternion}>
              <FrameAxes size={i === frames.length - 1 ? 0.10 : 0.06} />
            </group>
          );
        })}

      {/* Szkielet (przerywana linia przez początki układów) */}
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
