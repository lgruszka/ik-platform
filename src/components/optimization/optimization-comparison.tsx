"use client";

import { useMemo, useState } from "react";
import { useTargetStore } from "@/lib/target-store";
import { useRobotStore } from "@/lib/store";
import { useMounted } from "@/lib/hooks";
import { Canvas } from "@react-three/fiber";
import { Grid, Line, OrbitControls } from "@react-three/drei";
import { Puma560Ghost } from "@/components/robot/puma560-ghost";
import { decomposeFrame } from "@/lib/math/three-interop";
import { solveByOptimization } from "@/lib/solvers/optimization";
import { solveIterative } from "@/lib/solvers/jacobian-solvers";
import type { IterationTrace } from "@/lib/solvers/jacobian-solvers";
import type { OptTrace } from "@/lib/solvers/optimization";
import { forwardKinematics, PUMA560 } from "@/lib/robots";
import { extractPosition } from "@/lib/math/matrix";
import type { JointConfig } from "@/lib/types";
import { CostChart } from "./cost-chart";

type Run = {
  label: string;
  color: string;
  iterations: number;
  timeMs: number;
  residual: number;
  success: boolean;
  joints: number[];
  trace: OptTrace[];
};

export function OptimizationComparison() {
  const { target } = useTargetStore();
  const { robot, joints } = useRobotStore();
  const mounted = useMounted();
  const [wPos, setWPos] = useState(1.0);
  const [wOri, setWOri] = useState(0.2);
  const [wJointLim, setWJointLim] = useState(10.0);

  const runs: Run[] = useMemo(() => {
    if (!mounted) return [];
    const weights = { lin: wPos, ang: wOri, jointPenalty: wJointLim };
    const nm = solveByOptimization(robot, target, joints, "nelder-mead", weights);
    const gd = solveByOptimization(robot, target, joints, "gradient", weights);
    const dls = solveIterative(robot, target, joints, {
      method: "dls",
      maxIter: 200,
      tolLin: 1e-4,
      tolAng: 1e-3,
      lambda: 0.03,
    });
    const dlsCostTrace: OptTrace[] = dls.trace.map((t: IterationTrace) => ({
      iter: t.iter,
      q: t.q,
      cost: wPos * t.errLin * t.errLin + wOri * t.errAng * t.errAng,
    }));

    return [
      { label: "Nelder-Mead", color: "#a855f7", iterations: nm.iterations!, timeMs: nm.timeMs!, residual: nm.residual!, success: nm.success, joints: [...nm.joints], trace: nm.trace },
      { label: "Gradient descent", color: "#f97316", iterations: gd.iterations!, timeMs: gd.timeMs!, residual: gd.residual!, success: gd.success, joints: [...gd.joints], trace: gd.trace },
      { label: "DLS (referencja z mod. 3)", color: "#10b981", iterations: dls.iterations!, timeMs: dls.timeMs!, residual: dls.residual!, success: dls.success, joints: [...dls.joints], trace: dlsCostTrace },
    ];
  }, [mounted, robot, target, joints, wPos, wOri, wJointLim]);

  const tcpPos = decomposeFrame(target).position;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold mb-3">Wagi w funkcji kosztu</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">w_pos (pozycja)</span>
            <input
              type="number" step={0.1} min={0} max={10} value={wPos}
              onChange={(e) => setWPos(parseFloat(e.target.value) || 1.0)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">w_ori (orientacja)</span>
            <input
              type="number" step={0.05} min={0} max={10} value={wOri}
              onChange={(e) => setWOri(parseFloat(e.target.value) || 0.2)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">w_lim (limity przegubów)</span>
            <input
              type="number" step={1} min={0} max={100} value={wJointLim}
              onChange={(e) => setWJointLim(parseFloat(e.target.value) || 10)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
            />
          </label>
        </div>
      </div>

      <CostChart
        series={runs.map((r) => ({ name: r.label, color: r.color, trace: r.trace }))}
      />

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--panel-border)]">
              <th className="px-3 py-2 text-left font-mono text-[var(--muted)] uppercase">metoda</th>
              <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">iteracje</th>
              <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">residuum</th>
              <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">czas [ms]</th>
              <th className="px-3 py-2 text-left font-mono text-[var(--muted)] uppercase">status</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.label} className="border-b border-[var(--panel-border)] last:border-0">
                <td className="px-3 py-2 font-mono">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: r.color }} />
                  {r.label}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.iterations}</td>
                <td className="px-3 py-2 text-right tabular-nums font-mono">{r.residual.toExponential(2)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-mono">{r.timeMs.toFixed(2)}</td>
                <td className="px-3 py-2">
                  {r.success ? <span className="text-[var(--accent)]">OK</span> : <span className="text-red-500">brak</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Trajektorie końcówki w trakcie iteracji</h4>
        <p className="text-xs text-[var(--muted)] mb-3">
          Każdy z trzech solverów startuje z tego samego seeda i zmierza do tej samej pozy docelowej
          (czerwona kropka). Pełna linia pokazuje <em>ścieżkę TCP</em> po kolejnych iteracjach —
          widać wprost, jak <strong>szybko</strong> i <strong>jaką drogą</strong> solver dochodzi do celu.
          Szary &bdquo;duch&rdquo; to robot w końcowej konfiguracji znalezionej przez metodę.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {runs.map((r) => (
            <OptMiniView
              key={r.label}
              run={r}
              targetTcp={tcpPos}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OptMiniView({
  run, targetTcp,
}: {
  run: Run;
  targetTcp: { x: number; y: number; z: number };
}) {
  const trajectory: [number, number, number][] = [];
  for (const step of run.trace) {
    const T = forwardKinematics(PUMA560, step.q as unknown as JointConfig);
    const p = extractPosition(T);
    trajectory.push([p[0], p[1], p[2]]);
  }

  return (
    <div className="rounded-lg border-2 bg-[var(--panel)] overflow-hidden" style={{ borderColor: run.color }}>
      <div className="px-3 py-2 border-b border-[var(--panel-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: run.color }} />
          <span className="text-xs font-semibold">{run.label}</span>
        </div>
        <span className="font-mono text-[10px] text-[var(--muted)]">
          {run.iterations} iter · {run.residual.toExponential(1)} · {run.success ? "OK" : "brak"}
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
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.1, 24]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.6} />
          </mesh>
          {trajectory.length >= 2 && (
            <Line points={trajectory} color={run.color} lineWidth={2} />
          )}
          {trajectory.length >= 1 && (
            <mesh position={trajectory[0]}>
              <sphereGeometry args={[0.012, 10, 10]} />
              <meshStandardMaterial color={run.color} transparent opacity={0.7} />
            </mesh>
          )}
          <mesh position={[targetTcp.x, targetTcp.y, targetTcp.z]}>
            <sphereGeometry args={[0.022, 18, 18]} />
            <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.4} />
          </mesh>
          <Puma560Ghost
            joints={run.joints as unknown as JointConfig}
            color={run.color}
            opacity={0.75}
          />
          <OrbitControls target={[0, 0.3, 0.2]} makeDefault />
        </Canvas>
      </div>
    </div>
  );
}
