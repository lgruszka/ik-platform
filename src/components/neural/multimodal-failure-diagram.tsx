/**
 * Wizualizacja "awarii uśredniania" w naiwnym MLP. Pokazuje, że jeśli dla
 * tej samej pozy istnieją dwie poprawne odpowiedzi q (np. shoulder right
 * i shoulder left), to MSE-trenowana sieć uczy się ich średniej — która
 * **nie jest** żadnym poprawnym rozwiązaniem.
 */
export function MultimodalFailureDiagram() {
  const W = 680, H = 280;
  const pad = { l: 48, r: 24, t: 32, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  // Oś x = wartość parametru q (np. q1 dla danej pozy)
  // Oś y = pseudo-prawdopodobieństwo (rozkład możliwych q)
  const xMin = -3, xMax = 3;
  const yMin = 0, yMax = 1.2;

  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * plotH;

  // Dwie poprawne odpowiedzi: q = -1.5 i q = +1.5 (np. shoulder L vs shoulder R)
  const q1 = -1.5, q2 = 1.5;
  const sigma = 0.3;

  // Rzeczywisty rozkład p(q | T) — dwumodalny
  const N = 200;
  const realDist: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (i / N) * (xMax - xMin);
    const p1 = Math.exp(-((x - q1) * (x - q1)) / (2 * sigma * sigma));
    const p2 = Math.exp(-((x - q2) * (x - q2)) / (2 * sigma * sigma));
    realDist.push([x, 0.5 * p1 + 0.5 * p2]);
  }
  const realPath = realDist.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");

  // Predykcja MLP: średnia = 0
  const meanPred = 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      {/* Siatka */}
      <g stroke="#e5e7eb" strokeWidth={0.5}>
        {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
          <line key={x} x1={sx(x)} y1={pad.t} x2={sx(x)} y2={pad.t + plotH} />
        ))}
      </g>

      {/* Osie */}
      <line x1={pad.l} y1={sy(0)} x2={pad.l + plotW} y2={sy(0)} stroke="#94a3b8" strokeWidth={1} />
      <line x1={sx(0)} y1={pad.t} x2={sx(0)} y2={pad.t + plotH} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />

      <text x={pad.l + plotW - 4} y={sy(0) + 16} fontSize={11} fontFamily="monospace" fill="#64748b" textAnchor="end">q (kąt przegubu)</text>

      {/* Etykiety x */}
      {[-2, -1, 0, 1, 2].map((x) => (
        <text key={x} x={sx(x)} y={sy(0) + 14} fontSize={10} fontFamily="monospace" fill="#94a3b8" textAnchor="middle">{x}</text>
      ))}

      {/* Rzeczywisty rozkład p(q|T) — pełny niebieski */}
      <polyline points={realPath} fill="none" stroke="#0ea5e9" strokeWidth={2} />
      <path d={`M ${sx(xMin)} ${sy(0)} L ${realPath} L ${sx(xMax)} ${sy(0)} Z`} fill="#0ea5e9" opacity={0.15} />

      {/* Markery dwóch poprawnych odpowiedzi */}
      {[q1, q2].map((q, i) => (
        <g key={i}>
          <line x1={sx(q)} y1={sy(0)} x2={sx(q)} y2={sy(1.0)} stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray="2 2" />
          <circle cx={sx(q)} cy={sy(1.0)} r={5} fill="#0ea5e9" />
          <text x={sx(q)} y={sy(1.0) - 10} fontSize={11} fontFamily="monospace" fill="#0ea5e9" fontWeight={700} textAnchor="middle">
            q*<tspan fontSize={9} dy={2}>{i + 1}</tspan>
          </text>
        </g>
      ))}

      {/* Predykcja MLP — czerwona strzałka i kropka */}
      <line x1={sx(meanPred)} y1={sy(0)} x2={sx(meanPred)} y2={sy(0.55)} stroke="#ef4444" strokeWidth={2.4} />
      <circle cx={sx(meanPred)} cy={sy(0.55)} r={7} fill="#ef4444" />
      <text x={sx(meanPred)} y={sy(0.55) - 12} fontSize={12} fontFamily="monospace" fill="#ef4444" fontWeight={700} textAnchor="middle">
        MLP
      </text>
      <text x={sx(meanPred)} y={sy(0.55) - 26} fontSize={10} fontFamily="system-ui" fill="#ef4444" fontStyle="italic" textAnchor="middle">
        średnia = błędna!
      </text>

      {/* Tytuł */}
      <text x={W / 2} y={20} fontSize={13} fontFamily="system-ui" fill="#334155" textAnchor="middle" fontWeight={600}>
        Dla jednej pozy T istnieją DWIE poprawne wartości q. MLP uczy się ich średniej.
      </text>

      {/* Legenda */}
      <g transform={`translate(${W - 230}, ${pad.t + 4})`}>
        <rect x={0} y={0} width={216} height={56} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
        <line x1={10} y1={16} x2={36} y2={16} stroke="#0ea5e9" strokeWidth={2} />
        <text x={42} y={20} fontSize={10} fontFamily="system-ui" fill="#334155">prawdziwy rozkład p(q|T)</text>
        <circle cx={22} cy={36} r={5} fill="#ef4444" />
        <text x={36} y={40} fontSize={10} fontFamily="system-ui" fill="#334155">predykcja MLP (jedna liczba)</text>
      </g>
    </svg>
  );
}
