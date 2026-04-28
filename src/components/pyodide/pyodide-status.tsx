"use client";

import { useEffect, useState } from "react";
import { subscribeStatus, pyodideInit } from "@/lib/pyodide/client";

const LABELS: Record<string, string> = {
  idle: "Python: nie załadowany",
  "loading-runtime": "Pobieranie środowiska Pyodide (~ 10 MB)…",
  "loading-numpy": "Ładowanie NumPy…",
  compiling: "Kompilacja kodu Python…",
  ready: "Python: gotowy",
  error: "Python: błąd ładowania",
};

export function PyodideStatusBadge() {
  const [status, setStatus] = useState<string>("idle");
  useEffect(() => subscribeStatus((s) => setStatus(s)), []);

  const color =
    status === "ready" ? "var(--accent)"
    : status === "error" ? "#ef4444"
    : status === "idle" ? "var(--muted)"
    : "#f59e0b";

  const loading = status !== "ready" && status !== "idle" && status !== "error";

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          background: color,
          animation: loading ? "pulse 1.5s ease-in-out infinite" : undefined,
        }}
      />
      <span className="text-[var(--muted)]">{LABELS[status] ?? status}</span>
      {status === "idle" && (
        <button
          onClick={() => pyodideInit().catch(() => {})}
          className="text-[var(--accent)] hover:underline ml-2"
        >
          załaduj
        </button>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
