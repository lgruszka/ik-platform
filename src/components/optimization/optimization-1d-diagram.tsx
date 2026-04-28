/**
 * Wizualizacja prostej optymalizacji 1D — szukamy minimum funkcji f(x).
 * Trzy iteracje gradient descent z malejącym krokiem (każda kropka coraz
 * niżej w dolinie). Cel: dać studentowi intuicję, czym jest „minimalizowanie
 * funkcji kosztu" zanim zobaczy 6-wymiarowy odpowiednik dla IK.
 */
export function Optimization1DDiagram() {
  const W = 680, H = 320;
  const pad = { l: 48, r: 24, t: 24, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  // Funkcja f(x) = (x − 2)² + 0.4 — parabola z minimum w (2, 0.4)
  const f = (x: number) => (x - 2) * (x - 2) + 0.4;
  const df = (x: number) => 2 * (x - 2);

  const xMin = -1, xMax = 5;
  const yMin = 0, yMax = 10;

  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * plotH;

  // Krzywa funkcji
  const N = 200;
  const curve: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (i / N) * (xMax - xMin);
    curve.push([x, f(x)]);
  }
  const curvePath = curve.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");

  // Iteracje gradient descent — start w x = -0.5, krok α = 0.3
  const alpha = 0.3;
  const iters: { x: number; y: number }[] = [];
  let x = -0.5;
  for (let k = 0; k < 5; k++) {
    iters.push({ x, y: f(x) });
    x = x - alpha * df(x);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      {/* Siatka */}
      <g stroke="#e5e7eb" strokeWidth={0.5}>
        {[0, 1, 2, 3, 4, 5].map((x) => (
          <line key={`vx${x}`} x1={sx(x)} y1={pad.t} x2={sx(x)} y2={pad.t + plotH} />
        ))}
        {[0, 2, 4, 6, 8, 10].map((y) => (
          <line key={`hy${y}`} x1={pad.l} y1={sy(y)} x2={pad.l + plotW} y2={sy(y)} />
        ))}
      </g>

      {/* Osie */}
      <line x1={pad.l} y1={sy(0)} x2={pad.l + plotW} y2={sy(0)} stroke="#94a3b8" strokeWidth={1} />
      <line x1={sx(xMin)} y1={pad.t} x2={sx(xMin)} y2={pad.t + plotH} stroke="#94a3b8" strokeWidth={1} />
      <text x={pad.l + plotW - 4} y={sy(0) - 6} fontSize={11} fontFamily="monospace" fill="#64748b" textAnchor="end">x (parametr)</text>
      <text x={sx(xMin) + 6} y={pad.t + 10} fontSize={11} fontFamily="monospace" fill="#64748b">f(x) = koszt</text>

      {/* Etykiety osi */}
      {[0, 1, 2, 3, 4, 5].map((x) => (
        <text key={`lx${x}`} x={sx(x)} y={pad.t + plotH + 14} fontSize={10} fontFamily="monospace" fill="#94a3b8" textAnchor="middle">{x}</text>
      ))}

      {/* Krzywa funkcji */}
      <polyline points={curvePath} fill="none" stroke="#334155" strokeWidth={2} />
      <text x={sx(4.2)} y={sy(f(4.2)) - 8} fontSize={11} fontFamily="monospace" fill="#334155">f(x) = (x − 2)² + 0.4</text>

      {/* Minimum globalne */}
      <circle cx={sx(2)} cy={sy(f(2))} r={6} fill="#10b981" stroke="white" strokeWidth={1.5} />
      <text x={sx(2) + 12} y={sy(f(2)) + 4} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700}>
        x* — minimum
      </text>

      {/* Iteracje — kropki połączone strzałkami w dół zbocza */}
      {iters.map((p, k) => (
        <g key={k}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={5} fill="#ef4444" stroke="white" strokeWidth={1.2} />
          <text
            x={sx(p.x)}
            y={sy(p.y) - 12}
            fontSize={10}
            fontFamily="monospace"
            fill="#ef4444"
            fontWeight={700}
            textAnchor="middle"
          >
            x<tspan fontSize={8} dy={2}>{k}</tspan>
          </text>
          {/* Strzałka do następnej iteracji */}
          {k < iters.length - 1 && (
            <line
              x1={sx(p.x) + 3} y1={sy(p.y) + 3}
              x2={sx(iters[k + 1].x) - 3} y2={sy(iters[k + 1].y) - 3}
              stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2" opacity={0.7}
            />
          )}
        </g>
      ))}

      {/* Box z opisem */}
      <g transform={`translate(${pad.l + 16}, ${pad.t + 12})`}>
        <rect x={0} y={0} width={210} height={68} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
        <text x={8} y={16} fontSize={11} fontFamily="system-ui" fill="#334155" fontWeight={600}>
          Optymalizacja = znajdź x*,
        </text>
        <text x={8} y={30} fontSize={11} fontFamily="system-ui" fill="#334155" fontWeight={600}>
          dla którego f(x*) jest najmniejsze.
        </text>
        <text x={8} y={48} fontSize={10} fontFamily="monospace" fill="#ef4444">
          Krok GD: xₖ₊₁ = xₖ − α·f′(xₖ)
        </text>
        <text x={8} y={62} fontSize={9} fontFamily="system-ui" fill="#64748b" fontStyle="italic">
          („idź w dół zbocza")
        </text>
      </g>
    </svg>
  );
}
