"use client";

import { useCallback, useState } from "react";
import {
  aggregate,
  generateBenchmark,
  runSolverOnCase,
  type Aggregate,
  type PerCaseResult,
  type SolverId,
} from "@/lib/benchmark";

const SOLVER_LABELS: Record<SolverId, string> = {
  analytical: "Analityczny (Pieper)",
  transpose: "Jacobian Transpose",
  pinv: "Pseudoinverse",
  dls: "DLS",
  sdls: "Adaptive DLS",
  "nelder-mead": "Nelder-Mead",
  gradient: "Gradient descent",
};

const SOLVER_COLOURS: Record<SolverId, string> = {
  analytical: "#0b5ed7",
  transpose: "#ef4444",
  pinv: "#0ea5e9",
  dls: "#10b981",
  sdls: "#a855f7",
  "nelder-mead": "#ec4899",
  gradient: "#f97316",
};

const ALL_SOLVERS: SolverId[] = [
  "analytical", "pinv", "dls", "sdls", "transpose", "nelder-mead", "gradient",
];

export function BenchmarkRunner() {
  const [n, setN] = useState(100);
  const [seed, setSeed] = useState(42);
  const [results, setResults] = useState<PerCaseResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);
    const cases = generateBenchmark(n, seed);
    const total = cases.length * ALL_SOLVERS.length;
    const out: PerCaseResult[] = [];
    let done = 0;
    for (const c of cases) {
      for (const s of ALL_SOLVERS) {
        out.push(runSolverOnCase(s, c));
        done++;
      }
      setProgress(done / total);
      // Yield to the browser every case
      await new Promise((r) => setTimeout(r, 0));
    }
    setResults(out);
    setRunning(false);
    setProgress(1);
  }, [n, seed]);

  const agg: Aggregate[] = aggregate(results);
  const maxTime = Math.max(1e-3, ...agg.map((a) => a.timeMeanMs));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="grid grid-cols-[1fr_auto_auto] items-end gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)] text-xs">Liczba przypadków testowych</span>
              <input
                type="number"
                min={10}
                max={1000}
                step={10}
                value={n}
                onChange={(e) => setN(parseInt(e.target.value) || 100)}
                className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-sm"
                disabled={running}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)] text-xs">Ziarno RNG (deterministyczne)</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                className="bg-[var(--code-bg)] rounded px-2 py-1 font-mono text-sm"
                disabled={running}
              />
            </label>
          </div>
          <button
            onClick={run}
            disabled={running}
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {running ? "uruchamianie…" : "▶ uruchom benchmark"}
          </button>
        </div>
        {running && (
          <div className="mt-3">
            <div className="h-1.5 bg-[var(--code-bg)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="text-xs text-[var(--muted)] mt-1 font-mono">
              {(progress * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {agg.length > 0 && (
        <>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--panel-border)]">
                  <th className="px-3 py-2 text-left font-mono text-[var(--muted)] uppercase">solver</th>
                  <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">success %</th>
                  <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">czas mean [ms]</th>
                  <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">czas median [ms]</th>
                  <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">czas p95 [ms]</th>
                  <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">iter mean</th>
                  <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">‖Δp‖ median</th>
                  <th className="px-3 py-2 text-right font-mono text-[var(--muted)] uppercase">ΔR median</th>
                </tr>
              </thead>
              <tbody>
                {agg
                  .sort((a, b) => b.successRate - a.successRate || a.timeMeanMs - b.timeMeanMs)
                  .map((a) => (
                    <tr key={a.solver} className="border-b border-[var(--panel-border)] last:border-0">
                      <td className="px-3 py-2 font-mono">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                          style={{ background: SOLVER_COLOURS[a.solver] }}
                        />
                        {SOLVER_LABELS[a.solver]}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono">
                        {(a.successRate * 100).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono">{a.timeMeanMs.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono">{a.timeMedianMs.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono">{a.timeP95Ms.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono">{a.iterMean.toFixed(0)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono">{a.errLinMedian.toExponential(1)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono">{a.errAngMedian.toExponential(1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <h3 className="text-sm font-semibold mb-3">Rozkład czasu (średni)</h3>
            <div className="space-y-1.5">
              {agg
                .sort((a, b) => a.timeMeanMs - b.timeMeanMs)
                .map((a) => (
                  <div key={a.solver} className="grid grid-cols-[10rem_1fr_4rem] items-center gap-2 text-xs">
                    <span className="font-mono truncate">{SOLVER_LABELS[a.solver]}</span>
                    <div className="h-3 bg-[var(--code-bg)] rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.max(1, (a.timeMeanMs / maxTime) * 100)}%`,
                          background: SOLVER_COLOURS[a.solver],
                        }}
                      />
                    </div>
                    <span className="font-mono tabular-nums text-[var(--muted)]">
                      {a.timeMeanMs.toFixed(2)}ms
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
