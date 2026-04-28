// Web worker ładujący Pyodide i uruchamiający rozwiązanie analityczne IK
// Pumy560 w Pythonie. Celem jest pokazanie studentowi, że ta sama matematyka
// zapisana w dwóch językach (TypeScript i Python) daje identyczne wyniki —
// różnica jest tylko w stylistyce kodu.

importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

const PYTHON_IK_CODE = `
import math
import numpy as np

PUMA_A2 = 0.4318
PUMA_A3 = 0.0203
PUMA_D3 = 0.1254
PUMA_D4 = 0.4318

def solve_puma560_analytical(target_flat):
    """Analityczne IK dla Pumy560 (modyfikowane DH, konwencja Craiga).

    target_flat — 16-elementowa lista row-major macierzy T* ∈ SE(3).
    Zwraca listę słowników {'joints': [q1..q6], 'branch': {...}}.
    """
    T = np.array(target_flat, dtype=float).reshape(4, 4)
    R = T[:3, :3]
    px, py, pz = T[0, 3], T[1, 3], T[2, 3]

    solutions = []
    r_xy_sq = px * px + py * py
    disc_q1 = r_xy_sq - PUMA_D3 ** 2
    if disc_q1 < -1e-6:
        return solutions
    rho_abs = math.sqrt(max(0.0, disc_q1))
    phi = math.atan2(py, px)

    L = math.sqrt(PUMA_A3 ** 2 + PUMA_D4 ** 2)
    beta = math.atan2(PUMA_D4, PUMA_A3)

    for rho_sign in (+1, -1):
        rho = rho_sign * rho_abs
        q1 = phi - math.atan2(PUMA_D3, rho)
        shoulder = "right" if rho_sign > 0 else "left"

        K = (rho ** 2 + pz ** 2 - PUMA_A2 ** 2 - PUMA_A3 ** 2 - PUMA_D4 ** 2) / (2 * PUMA_A2)
        disc = L * L - K * K
        if disc < -1e-6:
            continue
        sqrtD = math.sqrt(max(0.0, disc))

        for elbow_sign in (+1, -1):
            q3 = math.atan2(elbow_sign * sqrtD, K) - beta
            elbow = "up" if elbow_sign > 0 else "down"

            c3, s3 = math.cos(q3), math.sin(q3)
            M = PUMA_A2 + PUMA_A3 * c3 - PUMA_D4 * s3
            N = PUMA_A3 * s3 + PUMA_D4 * c3
            denom = M * M + N * N
            if denom < 1e-12:
                continue
            c2 = (M * rho - N * pz) / denom
            s2 = (-M * pz - N * rho) / denom
            q2 = math.atan2(s2, c2)

            c1, s1 = math.cos(q1), math.sin(q1)
            c23, s23 = math.cos(q2 + q3), math.sin(q2 + q3)

            # R_3^6 = (R_0^3)^T · R
            R36 = np.empty((3, 3))
            R36[0, 0] =  c1 * c23 * R[0, 0] + s1 * c23 * R[1, 0] - s23 * R[2, 0]
            R36[0, 1] =  c1 * c23 * R[0, 1] + s1 * c23 * R[1, 1] - s23 * R[2, 1]
            R36[0, 2] =  c1 * c23 * R[0, 2] + s1 * c23 * R[1, 2] - s23 * R[2, 2]
            R36[1, 0] = -c1 * s23 * R[0, 0] - s1 * s23 * R[1, 0] - c23 * R[2, 0]
            R36[1, 1] = -c1 * s23 * R[0, 1] - s1 * s23 * R[1, 1] - c23 * R[2, 1]
            R36[1, 2] = -c1 * s23 * R[0, 2] - s1 * s23 * R[1, 2] - c23 * R[2, 2]
            R36[2, 0] = -s1 * R[0, 0] + c1 * R[1, 0]
            R36[2, 1] = -s1 * R[0, 1] + c1 * R[1, 1]
            R36[2, 2] = -s1 * R[0, 2] + c1 * R[1, 2]

            sq5_abs = math.hypot(R36[1, 0], R36[1, 1])
            cq5 = R36[1, 2]

            if sq5_abs < 1e-6:
                # singularność nadgarstka
                q5 = math.atan2(0.0, cq5)
                q4 = 0.0
                q6 = math.atan2(-R36[0, 1], R36[0, 0])
                solutions.append({
                    'joints': [q1, q2, q3, q4, q5, q6],
                    'branch': {'shoulder': shoulder, 'elbow': elbow, 'wrist': 'noflip'},
                })
                continue

            for wrist_sign in (+1, -1):
                sq5 = wrist_sign * sq5_abs
                q5 = math.atan2(sq5, cq5)
                q4 = math.atan2(wrist_sign * R36[2, 2], -wrist_sign * R36[0, 2])
                q6 = math.atan2(-wrist_sign * R36[1, 1], wrist_sign * R36[1, 0])
                wrist = "noflip" if wrist_sign > 0 else "flip"
                solutions.append({
                    'joints': [q1, q2, q3, q4, q5, q6],
                    'branch': {'shoulder': shoulder, 'elbow': elbow, 'wrist': wrist},
                })

    return solutions
`;

let pyodideReadyPromise = null;

async function initPyodide() {
  if (pyodideReadyPromise) return pyodideReadyPromise;
  pyodideReadyPromise = (async () => {
    self.postMessage({ id: 0, type: "status", payload: "loading-runtime" });
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
    });
    self.postMessage({ id: 0, type: "status", payload: "loading-numpy" });
    await pyodide.loadPackage(["numpy"]);
    self.postMessage({ id: 0, type: "status", payload: "compiling" });
    pyodide.runPython(PYTHON_IK_CODE);
    return pyodide;
  })();
  return pyodideReadyPromise;
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  try {
    if (type === "init") {
      await initPyodide();
      self.postMessage({ id, type: "ready" });
    } else if (type === "solve-analytical") {
      const pyodide = await initPyodide();
      const fn = pyodide.globals.get("solve_puma560_analytical");
      const t0 = performance.now();
      const pyResult = fn(payload.target);
      const timeMs = performance.now() - t0;
      const jsResult = pyResult.toJs({
        dict_converter: Object.fromEntries,
      });
      pyResult.destroy();
      fn.destroy();
      self.postMessage({ id, type: "result", payload: { solutions: jsResult, timeMs } });
    } else {
      self.postMessage({ id, type: "error", error: `nieznany typ: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, type: "error", error: String(err && err.message ? err.message : err) });
  }
};
