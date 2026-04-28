"use client";

import { useMemo, useRef, useState } from "react";
import { useRobotStore } from "@/lib/store";
import { useTargetStore } from "@/lib/target-store";
import { createMLP, createAdamState, trainStep, forward, type MLP, type AdamState } from "@/lib/ml/mlp";
import { generateDataset, denormaliseJoints, normalisePose } from "@/lib/ml/ik-dataset";
import { forwardKinematics, PUMA560 } from "@/lib/robots";
import { extractPosition, extractRotation } from "@/lib/math/matrix";
import { matrixToRpy } from "@/lib/math/rotations";
import { poseTwistError, errorNorms } from "@/lib/math/twist";
import { solveIterative } from "@/lib/solvers/jacobian-solvers";

type Loss = { step: number; value: number };

export function MLPDemo() {
  const { target, pose } = useTargetStore();
  const { setJoints } = useRobotStore();

  const [trainSize, setTrainSize] = useState(2000);
  const [steps, setSteps] = useState(3000);
  const [batchSize, setBatchSize] = useState(64);
  const [lr, setLr] = useState(3e-3);
  const [losses, setLosses] = useState<Loss[]>([]);
  const [training, setTraining] = useState(false);
  const mlpRef = useRef<MLP | null>(null);
  const stateRef = useRef<AdamState | null>(null);
  const [evaluation, setEvaluation] = useState<null | {
    qPred: number[];
    errLinRaw: number;
    errAngRaw: number;
    qRefined: number[];
    errLinRef: number;
    errAngRef: number;
  }>(null);

  const startTraining = async () => {
    setTraining(true);
    setLosses([]);
    setEvaluation(null);
    const mlp = createMLP([6, 64, 64, 6]);
    const state = createAdamState(mlp);
    mlpRef.current = mlp;
    stateRef.current = state;
    const data = generateDataset(trainSize, 7);
    const lossHistory: Loss[] = [];
    const chunk = 50;
    for (let s = 0; s < steps; s += chunk) {
      for (let k = 0; k < chunk && s + k < steps; k++) {
        const batch: { x: number[]; y: number[] }[] = [];
        for (let i = 0; i < batchSize; i++) {
          batch.push(data[Math.floor(Math.random() * data.length)]);
        }
        const loss = trainStep(mlp, batch, state, lr);
        if ((s + k) % 10 === 0) lossHistory.push({ step: s + k, value: loss });
      }
      setLosses([...lossHistory]);
      await new Promise((r) => setTimeout(r, 0));
    }
    setTraining(false);
  };

  const evaluate = () => {
    if (!mlpRef.current) return;
    const x = normalisePose(pose.position, pose.rpy);
    const yPred = forward(mlpRef.current, x);
    const qPred = denormaliseJoints(yPred);

    const Tpred = forwardKinematics(PUMA560, qPred);
    const errPred = errorNorms(poseTwistError(Tpred, target));

    // Hybrid: use MLP prediction as seed for DLS
    const refined = solveIterative(PUMA560, target, qPred, {
      method: "dls",
      maxIter: 100,
      tolLin: 1e-4,
      tolAng: 1e-3,
      lambda: 0.03,
    });
    const errRef = errorNorms(poseTwistError(forwardKinematics(PUMA560, refined.joints), target));

    setEvaluation({
      qPred: [...qPred],
      errLinRaw: errPred.lin,
      errAngRaw: errPred.ang,
      qRefined: [...refined.joints],
      errLinRef: errRef.lin,
      errAngRef: errRef.ang,
    });
  };

  const lossChart = useMemo(() => renderLossChart(losses), [losses]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold mb-3">Hiperparametry treningu</h3>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Rozmiar datasetu</span>
            <input type="number" min={500} max={10000} step={500} value={trainSize}
              onChange={(e) => setTrainSize(parseInt(e.target.value) || 2000)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
              disabled={training} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Kroki</span>
            <input type="number" min={200} max={10000} step={200} value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value) || 3000)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
              disabled={training} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Batch size</span>
            <input type="number" min={8} max={256} step={8} value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 64)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
              disabled={training} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Learning rate</span>
            <input type="number" step={1e-4} min={1e-5} max={1e-1} value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value) || 3e-3)}
              className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-xs"
              disabled={training} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={startTraining}
            disabled={training}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {training ? "trenuję…" : "▶ trenuj MLP"}
          </button>
          <button
            onClick={evaluate}
            disabled={!mlpRef.current || training}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md border border-[var(--panel-border)] hover:bg-[var(--code-bg)] disabled:opacity-50"
          >
            oceń na pozie T*
          </button>
        </div>
      </div>

      {losses.length > 0 && (
        <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3">
          <h3 className="text-sm font-semibold mb-1">Krzywa uczenia</h3>
          {lossChart}
        </div>
      )}

      {evaluation && (
        <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-xs font-mono space-y-2">
          <h3 className="text-sm font-semibold font-sans">Ewaluacja na bieżącej T*</h3>
          <div className="grid grid-cols-[8rem_1fr_1fr] gap-x-3 gap-y-1 tabular-nums">
            <span />
            <span className="text-[var(--muted)] text-[10px] uppercase tracking-wider">MLP (surowa)</span>
            <span className="text-[var(--muted)] text-[10px] uppercase tracking-wider">MLP → DLS (hybryda)</span>
            <span className="text-[var(--muted)]">‖Δp‖ [m]</span>
            <span>{evaluation.errLinRaw.toExponential(2)}</span>
            <span className={evaluation.errLinRef < 1e-4 ? "text-[var(--accent)]" : ""}>{evaluation.errLinRef.toExponential(2)}</span>
            <span className="text-[var(--muted)]">ΔR [rad]</span>
            <span>{evaluation.errAngRaw.toExponential(2)}</span>
            <span className={evaluation.errAngRef < 1e-3 ? "text-[var(--accent)]" : ""}>{evaluation.errAngRef.toExponential(2)}</span>
            <span className="text-[var(--muted)]">q° (6 przegubów)</span>
            <span>{evaluation.qPred.map((q) => (q * 180 / Math.PI).toFixed(0)).join(", ")}</span>
            <span>{evaluation.qRefined.map((q) => (q * 180 / Math.PI).toFixed(0)).join(", ")}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setJoints(evaluation.qPred as unknown as import("@/lib/types").JointConfig)}
              className="text-[var(--accent)] hover:underline text-xs"
            >
              wczytaj surową predykcję
            </button>
            <button
              onClick={() => setJoints(evaluation.qRefined as unknown as import("@/lib/types").JointConfig)}
              className="text-[var(--accent)] hover:underline text-xs"
            >
              wczytaj hybrydę
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderLossChart(losses: Loss[]) {
  if (losses.length === 0) return null;
  const width = 640, height = 180, pad = { l: 48, r: 12, t: 8, b: 24 };
  const plotW = width - pad.l - pad.r, plotH = height - pad.t - pad.b;
  const xMax = Math.max(1, ...losses.map((l) => l.step));
  const yPositive = losses.map((l) => l.value).filter((v) => v > 0);
  const yMin = Math.min(...yPositive, 1e-4);
  const yMax = Math.max(...yPositive);
  const logMin = Math.log10(Math.max(1e-8, yMin));
  const logMax = Math.log10(Math.max(yMin * 10, yMax));
  const xScale = (s: number) => pad.l + (s / xMax) * plotW;
  const yScale = (v: number) => pad.t + ((logMax - Math.log10(Math.max(1e-8, v))) / Math.max(1e-6, logMax - logMin)) * plotH;
  const pts = losses.map((l) => `${xScale(l.step)},${yScale(l.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="#94a3b8" />
      <line x1={pad.l} y1={pad.t + plotH} x2={pad.l + plotW} y2={pad.t + plotH} stroke="#94a3b8" />
      <polyline fill="none" stroke="#0ea5e9" strokeWidth={1.6} points={pts} />
      <text x={pad.l - 6} y={pad.t + 8} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="end">
        {Math.pow(10, logMax).toExponential(0)}
      </text>
      <text x={pad.l - 6} y={pad.t + plotH + 2} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="end">
        {Math.pow(10, logMin).toExponential(0)}
      </text>
      <text x={pad.l + plotW} y={pad.t + plotH + 14} fontSize={9} fontFamily="monospace" fill="#64748b" textAnchor="end">
        step {xMax}
      </text>
      <text x={pad.l + plotW / 2} y={height - 6} textAnchor="middle" fontSize={10} fill="#64748b">krok treningu</text>
      <text x={14} y={pad.t + plotH / 2} fontSize={10} fill="#64748b" transform={`rotate(-90 14 ${pad.t + plotH / 2})`} textAnchor="middle">
        loss (MSE)
      </text>
    </svg>
  );
}
