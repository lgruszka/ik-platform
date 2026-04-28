/**
 * Wizualizacja metody Newtona-Raphsona w 1D: f(x) = x³ − 4x − 1. Pokazuje
 * trzy iteracje x₀ → x₁ → x₂ → x₃ z liniami stycznymi. Celem jest dać
 * studentowi intuicję, na której potem buduje się 6-wymiarową analogię
 * z Jakobianem.
 */
export function NewtonMethod1DDiagram() {
  const W = 680, H = 340;
  const pad = { l: 48, r: 24, t: 24, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const xMin = -2.6, xMax = 2.8;
  const yMin = -6, yMax = 6;

  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * plotH;

  const f = (x: number) => x * x * x - 4 * x - 1;
  const df = (x: number) => 3 * x * x - 4;

  // Dyskretyzacja krzywej
  const N = 200;
  const curve: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (i / N) * (xMax - xMin);
    curve.push([x, f(x)]);
  }
  const curvePath = curve.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");

  // Iteracje Newtona — start z lewej, zbieżność do pierwiastka x* ≈ −1.8608
  const iters: { x: number; fx: number; nextX: number }[] = [];
  let x = -2.4;
  for (let k = 0; k < 3; k++) {
    const fx = f(x);
    const nextX = x - fx / df(x);
    iters.push({ x, fx, nextX });
    x = nextX;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      {/* Siatka */}
      <g stroke="#e5e7eb" strokeWidth={0.5}>
        {[-2, -1, 0, 1, 2].map((x) => (
          <line key={`vx${x}`} x1={sx(x)} y1={pad.t} x2={sx(x)} y2={pad.t + plotH} />
        ))}
        {[-4, -2, 0, 2, 4].map((y) => (
          <line key={`hy${y}`} x1={pad.l} y1={sy(y)} x2={pad.l + plotW} y2={sy(y)} />
        ))}
      </g>

      {/* Osie */}
      <line x1={pad.l} y1={sy(0)} x2={pad.l + plotW} y2={sy(0)} stroke="#94a3b8" strokeWidth={1} />
      <line x1={sx(0)} y1={pad.t} x2={sx(0)} y2={pad.t + plotH} stroke="#94a3b8" strokeWidth={1} />
      <text x={pad.l + plotW - 4} y={sy(0) - 6} fontSize={11} fontFamily="monospace" fill="#64748b" textAnchor="end">x</text>
      <text x={sx(0) + 6} y={pad.t + 10} fontSize={11} fontFamily="monospace" fill="#64748b">f(x)</text>

      {/* Podpisy osi X */}
      {[-2, -1, 1, 2].map((x) => (
        <text key={`lx${x}`} x={sx(x)} y={pad.t + plotH + 14} fontSize={10} fontFamily="monospace" fill="#94a3b8" textAnchor="middle">{x}</text>
      ))}

      {/* Krzywa f(x) */}
      <polyline points={curvePath} fill="none" stroke="#334155" strokeWidth={2} />
      <text x={sx(2.0)} y={sy(f(2.0)) - 8} fontSize={11} fontFamily="monospace" fill="#334155">f(x) = x³ − 4x − 1</text>

      {/* Iteracje — styczne, kropki, pionowe odcinki */}
      {iters.map((it, k) => {
        const color = ["#ef4444", "#f59e0b", "#0ea5e9"][k];
        // Styczna: y − it.fx = df(it.x)·(x − it.x)
        // Narysuj od it.x (punkt na krzywej) do it.nextX (punkt na osi X gdzie styczna przecina zero)
        return (
          <g key={k}>
            {/* Pionowa linia od osi X do punktu na krzywej */}
            <line
              x1={sx(it.x)} y1={sy(0)}
              x2={sx(it.x)} y2={sy(it.fx)}
              stroke={color} strokeWidth={1} strokeDasharray="3 3"
            />
            {/* Styczna od punktu na krzywej do nextX na osi X */}
            <line
              x1={sx(it.x)} y1={sy(it.fx)}
              x2={sx(it.nextX)} y2={sy(0)}
              stroke={color} strokeWidth={1.8}
            />
            {/* Kropka na krzywej */}
            <circle cx={sx(it.x)} cy={sy(it.fx)} r={4} fill={color} />
            {/* Kropka na osi */}
            <circle cx={sx(it.x)} cy={sy(0)} r={3.5} fill={color} />
            {/* Etykieta x_k pod osią */}
            <text
              x={sx(it.x)} y={sy(0) + 18}
              fontSize={11} fontFamily="monospace" fill={color} fontWeight={700} textAnchor="middle"
            >
              x<tspan fontSize={9} dy={2}>{k}</tspan>
            </text>
          </g>
        );
      })}
      {/* Ostateczna kropka x_3 (zbieżność) */}
      <circle cx={sx(iters[2].nextX)} cy={sy(0)} r={5} fill="#10b981" stroke="white" strokeWidth={1.5} />
      <text
        x={sx(iters[2].nextX)} y={sy(0) + 20}
        fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700} textAnchor="middle"
      >
        x<tspan fontSize={9} dy={2}>3</tspan> ≈ x*
      </text>

      {/* Legenda */}
      <g transform={`translate(${W - 220}, ${pad.t + 4})`}>
        <rect x={0} y={0} width={200} height={52} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
        <text x={8} y={14} fontSize={10} fontFamily="monospace" fill="#334155" fontWeight={600}>Iteracja Newtona:</text>
        <text x={8} y={30} fontSize={10} fontFamily="monospace" fill="#334155">xₖ₊₁ = xₖ − f(xₖ) / f′(xₖ)</text>
        <text x={8} y={44} fontSize={9} fontFamily="system-ui" fill="#64748b">styczna → przecięcie z osią x</text>
      </g>
    </svg>
  );
}
