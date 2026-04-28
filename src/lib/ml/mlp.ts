/**
 * Minimal feed-forward MLP with tanh hidden activations and linear output.
 * Trained with Adam over MSE. Written in plain JS for didactic transparency —
 * no dependencies, the whole thing fits on one screen.
 */

export type MLPLayer = { W: number[][]; b: number[] };
export type MLP = MLPLayer[];

function randn(): number {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function createMLP(shape: number[]): MLP {
  const layers: MLP = [];
  for (let i = 0; i < shape.length - 1; i++) {
    const din = shape[i], dout = shape[i + 1];
    const stddev = Math.sqrt(2 / (din + dout)); // Glorot-ish
    const W: number[][] = Array.from({ length: dout }, () =>
      Array.from({ length: din }, () => randn() * stddev),
    );
    const b: number[] = new Array(dout).fill(0);
    layers.push({ W, b });
  }
  return layers;
}

function tanhArr(x: number[]): number[] {
  return x.map(Math.tanh);
}

function linear(W: number[][], x: number[], b: number[]): number[] {
  const m = W.length, n = W[0].length;
  const y = new Array(m);
  for (let i = 0; i < m; i++) {
    let s = b[i];
    for (let j = 0; j < n; j++) s += W[i][j] * x[j];
    y[i] = s;
  }
  return y;
}

export type Activations = { pre: number[]; post: number[] }[];

export function forwardCollect(mlp: MLP, x: number[]): { y: number[]; acts: Activations } {
  const acts: Activations = [];
  let a = x;
  for (let i = 0; i < mlp.length; i++) {
    const pre = linear(mlp[i].W, a, mlp[i].b);
    const post = i === mlp.length - 1 ? pre : tanhArr(pre); // last layer linear
    acts.push({ pre, post });
    a = post;
  }
  return { y: a, acts };
}

export function forward(mlp: MLP, x: number[]): number[] {
  return forwardCollect(mlp, x).y;
}

type Grads = { dW: number[][]; db: number[] }[];

export function backward(mlp: MLP, x: number[], yTrue: number[]): { grads: Grads; loss: number } {
  const { y, acts } = forwardCollect(mlp, x);
  const m = y.length;
  // MSE loss and dL/dy = 2(y - yTrue)/m
  let loss = 0;
  const delta = new Array(m);
  for (let i = 0; i < m; i++) {
    const d = y[i] - yTrue[i];
    loss += d * d;
    delta[i] = (2 / m) * d;
  }
  loss /= m;

  const grads: Grads = mlp.map((l) => ({
    dW: l.W.map((row) => row.map(() => 0)),
    db: l.b.map(() => 0),
  }));

  let dOut = delta;
  for (let li = mlp.length - 1; li >= 0; li--) {
    const layer = mlp[li];
    const inputAct = li === 0 ? x : acts[li - 1].post;
    // For non-last layers we applied tanh. delta' = delta * (1 - tanh²(pre))
    const dPre = li === mlp.length - 1
      ? dOut
      : dOut.map((d, i) => d * (1 - acts[li].post[i] * acts[li].post[i]));
    // dW[i][j] = dPre[i] * inputAct[j];  db[i] = dPre[i]
    for (let i = 0; i < layer.W.length; i++) {
      grads[li].db[i] = dPre[i];
      for (let j = 0; j < layer.W[0].length; j++) {
        grads[li].dW[i][j] = dPre[i] * inputAct[j];
      }
    }
    // propagate to input: dIn[j] = sum_i W[i][j] * dPre[i]
    if (li > 0) {
      const dIn = new Array(layer.W[0].length).fill(0);
      for (let j = 0; j < layer.W[0].length; j++) {
        let s = 0;
        for (let i = 0; i < layer.W.length; i++) s += layer.W[i][j] * dPre[i];
        dIn[j] = s;
      }
      dOut = dIn;
    }
  }
  return { grads, loss };
}

export type AdamState = {
  m: Grads;
  v: Grads;
  t: number;
};

export function createAdamState(mlp: MLP): AdamState {
  return {
    t: 0,
    m: mlp.map((l) => ({
      dW: l.W.map((row) => row.map(() => 0)),
      db: l.b.map(() => 0),
    })),
    v: mlp.map((l) => ({
      dW: l.W.map((row) => row.map(() => 0)),
      db: l.b.map(() => 0),
    })),
  };
}

export function adamStep(
  mlp: MLP,
  grads: Grads,
  state: AdamState,
  lr = 1e-3,
  b1 = 0.9,
  b2 = 0.999,
  eps = 1e-8,
): void {
  state.t += 1;
  const t = state.t;
  const bc1 = 1 / (1 - Math.pow(b1, t));
  const bc2 = 1 / (1 - Math.pow(b2, t));
  for (let li = 0; li < mlp.length; li++) {
    for (let i = 0; i < mlp[li].W.length; i++) {
      for (let j = 0; j < mlp[li].W[0].length; j++) {
        state.m[li].dW[i][j] = b1 * state.m[li].dW[i][j] + (1 - b1) * grads[li].dW[i][j];
        state.v[li].dW[i][j] = b2 * state.v[li].dW[i][j] + (1 - b2) * grads[li].dW[i][j] * grads[li].dW[i][j];
        const mHat = state.m[li].dW[i][j] * bc1;
        const vHat = state.v[li].dW[i][j] * bc2;
        mlp[li].W[i][j] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
      }
      state.m[li].db[i] = b1 * state.m[li].db[i] + (1 - b1) * grads[li].db[i];
      state.v[li].db[i] = b2 * state.v[li].db[i] + (1 - b2) * grads[li].db[i] * grads[li].db[i];
      const mHat = state.m[li].db[i] * bc1;
      const vHat = state.v[li].db[i] * bc2;
      mlp[li].b[i] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
    }
  }
}

/** Accumulate gradients across a mini-batch (average) and apply one Adam step. */
export function trainStep(
  mlp: MLP,
  batch: { x: number[]; y: number[] }[],
  state: AdamState,
  lr = 1e-3,
): number {
  const nSamp = batch.length;
  let totalLoss = 0;
  const accum: Grads = mlp.map((l) => ({
    dW: l.W.map((row) => row.map(() => 0)),
    db: l.b.map(() => 0),
  }));
  for (const { x, y } of batch) {
    const { grads, loss } = backward(mlp, x, y);
    totalLoss += loss;
    for (let li = 0; li < mlp.length; li++) {
      for (let i = 0; i < mlp[li].W.length; i++) {
        for (let j = 0; j < mlp[li].W[0].length; j++) {
          accum[li].dW[i][j] += grads[li].dW[i][j] / nSamp;
        }
        accum[li].db[i] += grads[li].db[i] / nSamp;
      }
    }
  }
  adamStep(mlp, accum, state, lr);
  return totalLoss / nSamp;
}
