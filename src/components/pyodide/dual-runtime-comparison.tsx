"use client";

import { useEffect, useMemo, useState } from "react";
import { useTargetStore } from "@/lib/target-store";
import { solvePuma560Analytical } from "@/lib/solvers";
import { useMounted } from "@/lib/hooks";
import { pySolveAnalyticalPuma, subscribeStatus, pyodideInit } from "@/lib/pyodide/client";
import { branchKey, branchLabel, BRANCH_COLOURS } from "@/lib/branch-colors";
import type { IKSolution } from "@/lib/types";
import { deg } from "@/lib/utils";
import { PyodideStatusBadge } from "./pyodide-status";

/**
 * Uruchamia rozwiązanie analityczne Pumy560 w dwóch niezależnych środowiskach
 * (TypeScript natywnie + Python przez Pyodide w web workerze) i pokazuje
 * zestawienie. Cel dydaktyczny: udowodnić, że ta sama matematyka daje
 * identyczne liczby, niezależnie od języka implementacji.
 */
export function DualRuntimeComparison() {
  const { target } = useTargetStore();
  const mounted = useMounted();
  const [status, setStatus] = useState<string>("idle");
  const [pyResult, setPyResult] = useState<{
    solutions: IKSolution[];
    timeMs: number;
  } | null>(null);
  const [pyError, setPyError] = useState<string | null>(null);

  useEffect(() => subscribeStatus(setStatus), []);

  // TS — dopiero po mount, żeby uniknąć hydration mismatch (performance.now()
  // zwraca inne wartości w SSR i na kliencie).
  const tsRun = useMemo(() => {
    if (!mounted) return null;
    const t0 = performance.now();
    const sols = solvePuma560Analytical(target);
    return { solutions: sols, timeMs: performance.now() - t0 };
  }, [mounted, target]);
  const tsSolutions = tsRun?.solutions ?? [];
  const tsTimeMs = tsRun?.timeMs ?? null;

  // Python — tylko gdy runtime gotowy
  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    setPyError(null);
    pySolveAnalyticalPuma(target)
      .then((res) => { if (!cancelled) setPyResult(res); })
      .catch((err) => { if (!cancelled) setPyError(String(err.message || err)); });
    return () => { cancelled = true; };
  }, [target, status]);

  const load = () => pyodideInit().catch((e) => setPyError(String(e)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold">
          Porównanie uruchomień: <span className="font-mono font-normal text-[var(--muted)]">TypeScript vs Python</span>
        </h3>
        <PyodideStatusBadge />
      </div>

      {status === "idle" && (
        <div className="rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-6 text-center">
          <p className="text-sm text-[var(--muted)] mb-3">
            Python runtime (Pyodide) uruchamiany jest w web workerze i wymaga
            jednorazowego pobrania ~10 MB zasobów. Kliknij, by go zainicjować.
          </p>
          <button
            onClick={load}
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-md bg-[var(--accent)] text-white hover:opacity-90"
          >
            ▶ załaduj Python
          </button>
        </div>
      )}

      {pyError && (
        <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950 px-4 py-3 text-xs font-mono text-red-700 dark:text-red-300">
          Błąd Pyodide: {pyError}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <SolutionsColumn
          title="TypeScript (natywnie)"
          accent="#0ea5e9"
          solutions={tsRun?.solutions ?? null}
          timeMs={tsTimeMs}
          ready={mounted}
        />
        <SolutionsColumn
          title="Python 3.12 (Pyodide + NumPy)"
          accent="#facc15"
          solutions={pyResult?.solutions ?? null}
          timeMs={pyResult?.timeMs ?? null}
          ready={status === "ready"}
        />
      </div>

      {pyResult && (
        <ComparisonNote tsSolutions={tsSolutions} pySolutions={pyResult.solutions} />
      )}
    </div>
  );
}

function SolutionsColumn({
  title, accent, solutions, timeMs, ready,
}: {
  title: string;
  accent: string;
  solutions: IKSolution[] | null;
  timeMs: number | null;
  ready: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--panel-border)] flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: accent }} />
          {title}
        </h4>
        {timeMs != null && (
          <span className="font-mono text-xs text-[var(--muted)] tabular-nums">
            {timeMs < 1 ? `${(timeMs * 1000).toFixed(0)} µs` : `${timeMs.toFixed(2)} ms`}
          </span>
        )}
      </div>
      {!ready ? (
        <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">
          środowisko jeszcze się ładuje…
        </div>
      ) : !solutions ? (
        <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">
          oczekuję na wynik…
        </div>
      ) : solutions.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">
          brak rozwiązań dla zadanej pozy
        </div>
      ) : (
        <table className="w-full text-[10px] font-mono tabular-nums">
          <thead className="text-[var(--muted)]">
            <tr className="border-b border-[var(--panel-border)]">
              <th className="px-2 py-1.5 text-left">gałąź</th>
              <th className="px-2 py-1.5 text-right">q₁</th>
              <th className="px-2 py-1.5 text-right">q₂</th>
              <th className="px-2 py-1.5 text-right">q₃</th>
              <th className="px-2 py-1.5 text-right">q₄</th>
              <th className="px-2 py-1.5 text-right">q₅</th>
              <th className="px-2 py-1.5 text-right">q₆</th>
            </tr>
          </thead>
          <tbody>
            {solutions.map((sol, i) => {
              const c = sol.branch ? BRANCH_COLOURS[branchKey(sol.branch)] : "#94a3b8";
              return (
                <tr key={i} className="border-b border-[var(--panel-border)] last:border-0">
                  <td className="px-2 py-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: c }} />
                    {sol.branch ? branchLabel(sol.branch).replace(/ · /g, "/") : "?"}
                  </td>
                  {sol.joints.map((q, j) => (
                    <td key={j} className="px-2 py-1.5 text-right">
                      {deg(q).toFixed(1)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ComparisonNote({
  tsSolutions, pySolutions,
}: { tsSolutions: IKSolution[]; pySolutions: IKSolution[] }) {
  if (tsSolutions.length !== pySolutions.length) {
    return (
      <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs font-mono text-red-700 dark:text-red-300">
        Różna liczba rozwiązań: TS {tsSolutions.length}, Py {pySolutions.length}
      </div>
    );
  }
  const byKey = new Map(
    tsSolutions.map((s) => [s.branch ? branchKey(s.branch) : "?", s.joints]),
  );
  let maxDiff = 0;
  for (const s of pySolutions) {
    const k = s.branch ? branchKey(s.branch) : "?";
    const ts = byKey.get(k);
    if (!ts) continue;
    for (let i = 0; i < 6; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(ts[i] - s.joints[i]));
    }
  }
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-3 py-2 text-xs font-mono">
      Maksymalna różnica |q_TS − q_PY| po wszystkich gałęziach i przegubach:{" "}
      <span className={maxDiff < 1e-10 ? "text-[var(--accent)] font-semibold" : "text-amber-600"}>
        {maxDiff.toExponential(2)} rad
      </span>
      {maxDiff < 1e-10 && (
        <span className="text-[var(--muted)] ml-2">
          (zgodność na poziomie precyzji zmiennoprzecinkowej)
        </span>
      )}
    </div>
  );
}
