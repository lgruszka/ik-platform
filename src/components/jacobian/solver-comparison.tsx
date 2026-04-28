"use client";

import { useMemo, useState } from "react";
import { useTargetStore } from "@/lib/target-store";
import { useRobotStore } from "@/lib/store";
import { useMounted } from "@/lib/hooks";
import { solveIterative, type JacobianMethod, type IterationTrace } from "@/lib/solvers/jacobian-solvers";
import { ConvergenceChart } from "./convergence-chart";
import { Canvas } from "@react-three/fiber";
import { Grid, Line, OrbitControls } from "@react-three/drei";
import { Puma560Ghost } from "@/components/robot/puma560-ghost";
import { decomposeFrame } from "@/lib/math/three-interop";
import { forwardKinematics, PUMA560 } from "@/lib/robots";
import { extractPosition } from "@/lib/math/matrix";
import type { JointConfig, Matrix4 } from "@/lib/types";

const METHOD_COLOURS: Record<JacobianMethod, string> = {
  transpose: "#ef4444",
  pinv: "#0ea5e9",
  dls: "#10b981",
  sdls: "#a855f7",
};

const METHOD_LABELS: Record<JacobianMethod, string> = {
  transpose: "Jacobian Transpose",
  pinv: "Pseudoinverse",
  dls: "DLS (Levenberg-Marquardt)",
  sdls: "Adaptive DLS",
};

export function SolverComparison() {
  const { target } = useTargetStore();
  const { robot, joints } = useRobotStore();
  const mounted = useMounted();
  const [tolLin, setTolLin] = useState(1e-4);
  const [tolAng, setTolAng] = useState(1e-3);
  const [lambda, setLambda] = useState(0.03);

  const runs = useMemo(() => {
    if (!mounted) return [];
    return (["transpose", "pinv", "dls", "sdls"] as JacobianMethod[]).map((m) => ({
      method: m,
      result: solveIterative(robot, target, joints, {
        method: m,
        maxIter: m === "transpose" ? 2000 : 500,
        tolLin,
        tolAng,
        lambda,
        stepSize: 1.0,
      }),
    }));
  }, [mounted, robot, target, joints, tolLin, tolAng, lambda]);

  const tcpPos = decomposeFrame(target).position;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold mb-3">Parametry porównania</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Tolerancja pozycji [m]</span>
            <input
              type="number"
              step={1e-5}
              min={1e-8}
              max={1e-2}
              value={tolLin}
              onChange={(e) => setTolLin(parseFloat(e.target.value) || 1e-4)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Tolerancja orientacji [rad]</span>
            <input
              type="number"
              step={1e-4}
              min={1e-6}
              max={1e-1}
              value={tolAng}
              onChange={(e) => setTolAng(parseFloat(e.target.value) || 1e-3)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Tłumienie λ (DLS/SDLS)</span>
            <input
              type="number"
              step={0.01}
              min={0.001}
              max={0.5}
              value={lambda}
              onChange={(e) => setLambda(parseFloat(e.target.value) || 0.03)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ConvergenceChart
          metric="lin"
          series={runs.map(({ method, result }) => ({
            name: METHOD_LABELS[method],
            color: METHOD_COLOURS[method],
            trace: result.trace,
          }))}
        />
        <ConvergenceChart
          metric="ang"
          series={runs.map(({ method, result }) => ({
            name: METHOD_LABELS[method],
            color: METHOD_COLOURS[method],
            trace: result.trace,
          }))}
        />
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--panel-border)]">
              <th className="px-3 py-2 text-left font-mono text-[var(--muted)] uppercase">metoda</th>
              <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">iteracje</th>
              <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">‖Δp‖ końcowe [m]</th>
              <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">ΔR końcowe [rad]</th>
              <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">czas [ms]</th>
              <th className="px-3 py-2 text-left font-mono text-[var(--muted)] uppercase">status</th>
            </tr>
          </thead>
          <tbody>
            {runs.map(({ method, result }) => {
              const last = result.trace[result.trace.length - 1];
              return (
                <tr key={method} className="border-b border-[var(--panel-border)] last:border-0">
                  <td className="px-3 py-2 font-mono">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                      style={{ background: METHOD_COLOURS[method] }}
                    />
                    {METHOD_LABELS[method]}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{result.iterations}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono">
                    {last.errLin.toExponential(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono">
                    {last.errAng.toExponential(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono">
                    {result.timeMs!.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {result.success ? (
                      <span className="text-[var(--accent)]">zbieżny</span>
                    ) : (
                      <span className="text-red-500">brak zbieżności</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Trajektorie końcówki w trakcie iteracji</h4>
        <p className="text-xs text-[var(--muted)] mb-3">
          Każdy z czterech solverów startuje z tego samego seeda (aktualna
          konfiguracja głównego kontrolera) i zmierza do tej samej pozy docelowej
          (czerwona kropka). Pełna linia pokazuje <em>ścieżkę TCP</em> po
          kolejnych iteracjach — widać wprost, jak <strong>szybko</strong> solver
          dochodzi do celu i <strong>jaką drogą</strong> (prosta, kręta,
          oscylująca).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {runs.map(({ method, result }) => (
            <SolverMiniView
              key={method}
              method={method}
              result={result}
              targetTcp={tcpPos}
              color={METHOD_COLOURS[method]}
              label={METHOD_LABELS[method]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SolverMiniView({
  method, result, targetTcp, color, label,
}: {
  method: JacobianMethod;
  result: { joints: JointConfig; iterations?: number; success: boolean; trace: IterationTrace[] };
  targetTcp: { x: number; y: number; z: number };
  color: string;
  label: string;
}) {
  // Policz pozycje TCP w każdej iteracji (dla trajektorii)
  const trajectory: [number, number, number][] = [];
  for (const step of result.trace) {
    const T = forwardKinematics(PUMA560, step.q as unknown as JointConfig);
    const p = extractPosition(T);
    trajectory.push([p[0], p[1], p[2]]);
  }
  const finalIter = result.trace[result.trace.length - 1];

  return (
    <div className="rounded-lg border-2 border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden" style={{ borderColor: color }}>
      <div className="px-3 py-2 border-b border-[var(--panel-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <span className="font-mono text-[10px] text-[var(--muted)]">
          {result.iterations} iter · {finalIter.errLin.toExponential(1)} m · {result.success ? "OK" : "brak"}
        </span>
      </div>
      <div style={{ height: 260 }}>
        <Canvas camera={{ position: [1.4, 1.0, 1.4], fov: 45, up: [0, 0, 1] }} gl={{ antialias: true }} dpr={[1, 1.5]}>
          <color attach="background" args={["#f8fafc"]} />
          <ambientLight intensity={0.55} />
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
          {/* Baza — pionowa */}
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.1, 24]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.6} />
          </mesh>
          {/* Trajektoria TCP przez iteracje (pełna linia w kolorze metody) */}
          {trajectory.length >= 2 && (
            <Line
              points={trajectory}
              color={color}
              lineWidth={2}
            />
          )}
          {/* Kropki startowa i końcowa */}
          {trajectory.length >= 1 && (
            <mesh position={trajectory[0]}>
              <sphereGeometry args={[0.012, 10, 10]} />
              <meshStandardMaterial color={color} transparent opacity={0.7} />
            </mesh>
          )}
          {/* Cel TCP */}
          <mesh position={[targetTcp.x, targetTcp.y, targetTcp.z]}>
            <sphereGeometry args={[0.022, 18, 18]} />
            <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
          </mesh>
          {/* Ghost robota w końcowej konfiguracji */}
          <Puma560Ghost
            joints={result.joints}
            color={color}
            opacity={0.75}
          />
          <OrbitControls target={[0, 0.3, 0.2]} makeDefault />
        </Canvas>
      </div>
    </div>
  );
}
