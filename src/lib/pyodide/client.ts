"use client";

import type { IKSolution, JointConfig, Matrix4 } from "@/lib/types";

type PyodideStatus =
  | "idle"
  | "loading-runtime"
  | "loading-numpy"
  | "compiling"
  | "ready"
  | "error";

type PyMessage =
  | { id: number; type: "status"; payload: PyodideStatus }
  | { id: number; type: "ready" }
  | { id: number; type: "result"; payload: { solutions: PyRawSolution[]; timeMs: number } }
  | { id: number; type: "error"; error: string };

type PyRawSolution = {
  joints: number[];
  branch: { shoulder: "left" | "right"; elbow: "up" | "down"; wrist: "noflip" | "flip" };
};

let worker: Worker | null = null;
let requestId = 0;
let status: PyodideStatus = "idle";
const statusListeners = new Set<(s: PyodideStatus) => void>();

function setStatus(s: PyodideStatus) {
  status = s;
  for (const cb of statusListeners) cb(s);
}

function ensureWorker(): Worker {
  if (typeof window === "undefined") {
    throw new Error("Pyodide client działa tylko po stronie klienta");
  }
  if (!worker) {
    worker = new Worker("/pyodide-worker.js");
    worker.onmessage = (e: MessageEvent<PyMessage>) => {
      const msg = e.data;
      if (msg.type === "status") {
        setStatus(msg.payload);
      } else if (msg.type === "ready") {
        setStatus("ready");
      } else if (msg.type === "error") {
        setStatus("error");
      }
    };
    worker.onerror = () => setStatus("error");
  }
  return worker;
}

export function subscribeStatus(cb: (s: PyodideStatus) => void): () => void {
  statusListeners.add(cb);
  cb(status);
  return () => statusListeners.delete(cb);
}

export function getStatus(): PyodideStatus {
  return status;
}

function pyCall<T>(type: string, payload?: unknown): Promise<T> {
  const w = ensureWorker();
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent<PyMessage>) => {
      if ((event.data as { id?: number }).id !== id) return;
      if (event.data.type === "error") {
        w.removeEventListener("message", handler);
        reject(new Error(event.data.error));
      } else if (event.data.type === "result" || event.data.type === "ready") {
        w.removeEventListener("message", handler);
        resolve((event.data as { payload?: unknown }).payload as T);
      }
    };
    w.addEventListener("message", handler);
    w.postMessage({ id, type, payload });
  });
}

export async function pyodideInit(): Promise<void> {
  if (status === "ready") return;
  await pyCall<void>("init");
}

export async function pySolveAnalyticalPuma(target: Matrix4): Promise<{
  solutions: IKSolution[];
  timeMs: number;
}> {
  // serializuj 4×4 do płaskiej tablicy row-major
  const flat: number[] = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) flat.push(target[i][j]);
  const res = await pyCall<{ solutions: PyRawSolution[]; timeMs: number }>(
    "solve-analytical",
    { target: flat },
  );
  return {
    timeMs: res.timeMs,
    solutions: res.solutions.map((s) => ({
      joints: s.joints as unknown as JointConfig,
      branch: s.branch,
      success: true,
      residual: 0,
    })),
  };
}
