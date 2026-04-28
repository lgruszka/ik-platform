/**
 * Wizualizacja: jak MDN POPRAWNIE radzi sobie z multi-modalnością. Tam gdzie
 * MLP zwraca jedną (błędną) średnią, MDN zwraca dwa „garby" — każdy z własną
 * średnią i wagą. Suma garbów odtwarza prawdziwy rozkład p(q|T).
 */
export function MDNSuccessDiagram() {
  const W = 680, H = 280;
  const pad = { l: 48, r: 24, t: 32, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const xMin = -3, xMax = 3;
  const yMin = 0, yMax = 1.2;

  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * plotH;

  // Dwie poprawne odpowiedzi
  const q1 = -1.5, q2 = 1.5;
  const sigma = 0.3;

  // Prawdziwy rozkład (suma dwóch gaussów)
  const N = 200;
  const realDist: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (i / N) * (xMax - xMin);
    const p1 = Math.exp(-((x - q1) * (x - q1)) / (2 * sigma * sigma));
    const p2 = Math.exp(-((x - q2) * (x - q2)) / (2 * sigma * sigma));
    realDist.push([x, 0.5 * p1 + 0.5 * p2]);
  }
  const realPath = realDist.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");

  // Predykcja MDN — komponent 1 (lewy), z wagą α₁ = 0.5
  const mdn1: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (i / N) * (xMax - xMin);
    mdn1.push([x, 0.5 * Math.exp(-((x - q1) * (x - q1)) / (2 * sigma * sigma))]);
  }
  // Komponent 2 (prawy)
  const mdn2: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (i / N) * (xMax - xMin);
    mdn2.push([x, 0.5 * Math.exp(-((x - q2) * (x - q2)) / (2 * sigma * sigma))]);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      <g stroke="#e5e7eb" strokeWidth={0.5}>
        {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
          <line key={x} x1={sx(x)} y1={pad.t} x2={sx(x)} y2={pad.t + plotH} />
        ))}
      </g>
      <line x1={pad.l} y1={sy(0)} x2={pad.l + plotW} y2={sy(0)} stroke="#94a3b8" />

      <text x={pad.l + plotW - 4} y={sy(0) + 16} fontSize={11} fontFamily="monospace" fill="#64748b" textAnchor="end">q (kąt przegubu)</text>
      {[-2, -1, 0, 1, 2].map((x) => (
        <text key={x} x={sx(x)} y={sy(0) + 14} fontSize={10} fontFamily="monospace" fill="#94a3b8" textAnchor="middle">{x}</text>
      ))}

      {/* Prawdziwy rozkład — niebieskie wypełnienie */}
      <path
        d={`M ${sx(xMin)} ${sy(0)} L ${realPath} L ${sx(xMax)} ${sy(0)} Z`}
        fill="#0ea5e9" opacity={0.15}
      />
      <polyline points={realPath} fill="none" stroke="#0ea5e9" strokeWidth={2.4} />

      {/* MDN: dwa zielone „garby", suma daje prawdę */}
      <polyline points={mdn1.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")} fill="none" stroke="#10b981" strokeWidth={2.4} strokeDasharray="6 3" />
      <polyline points={mdn2.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")} fill="none" stroke="#10b981" strokeWidth={2.4} strokeDasharray="6 3" />

      {/* Etykiety komponentów */}
      <text x={sx(q1)} y={sy(0.55)} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700} textAnchor="middle">
        komponent 1
      </text>
      <text x={sx(q1)} y={sy(0.55) + 14} fontSize={10} fontFamily="system-ui" fill="#10b981" textAnchor="middle">
        α₁ = 0.5, μ₁ = −1.5
      </text>
      <text x={sx(q2)} y={sy(0.55)} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700} textAnchor="middle">
        komponent 2
      </text>
      <text x={sx(q2)} y={sy(0.55) + 14} fontSize={10} fontFamily="system-ui" fill="#10b981" textAnchor="middle">
        α₂ = 0.5, μ₂ = +1.5
      </text>

      {/* Tytuł */}
      <text x={W / 2} y={20} fontSize={13} fontFamily="system-ui" fill="#334155" textAnchor="middle" fontWeight={600}>
        MDN: zamiast zwracać jedną liczbę, zwraca DWA garby — po jednym na każdą poprawną odpowiedź.
      </text>

      {/* Legenda */}
      <g transform={`translate(${W - 220}, ${pad.t + 4})`}>
        <rect x={0} y={0} width={208} height={56} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
        <line x1={10} y1={16} x2={36} y2={16} stroke="#0ea5e9" strokeWidth={2} />
        <text x={42} y={20} fontSize={10} fontFamily="system-ui" fill="#334155">prawdziwy rozkład p(q|T)</text>
        <line x1={10} y1={36} x2={36} y2={36} stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" />
        <text x={42} y={40} fontSize={10} fontFamily="system-ui" fill="#334155">predykcja MDN (suma garbów)</text>
      </g>
    </svg>
  );
}
