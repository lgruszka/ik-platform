/**
 * Wspólne tło dla wizualizacji 2D optymalizacji — kontury, osie, minimum.
 * Każdy komponent wizualizacji nakłada na to swoje elementy (simpleks/punkty).
 */
import { contourPoints, LEVELS, X_STAR, makeProjector } from "./optimization-2d-utils";

// Zaokrąglenie współrzędnych SVG do 2 miejsc — eliminuje rozjazd hydration
// wynikający z minimalnych różnic Math.cos/sin między SSR a klientem.
const r = (n: number) => Math.round(n * 100) / 100;

type Props = {
  width: number;
  height: number;
  pad?: { l: number; r: number; t: number; b: number };
};

export function OptimizationContourBackground({
  width, height, pad = { l: 40, r: 24, t: 20, b: 36 },
}: Props) {
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const proj = makeProjector(pad.l, pad.t, plotW, plotH);

  return (
    <g>
      {/* Tło wykresu */}
      <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="#fafbfc" stroke="#e5e7eb" />

      {/* Siatka */}
      <g stroke="#e5e7eb" strokeWidth={0.5}>
        {[-3, -2, -1, 0, 1, 2, 3, 4, 5].map((x) => (
          <line key={`gx${x}`} x1={proj.sx(x)} y1={pad.t} x2={proj.sx(x)} y2={pad.t + plotH} />
        ))}
        {[-3, -2, -1, 0, 1, 2, 3, 4].map((y) => (
          <line key={`gy${y}`} x1={pad.l} y1={proj.sy(y)} x2={pad.l + plotW} y2={proj.sy(y)} />
        ))}
      </g>

      {/* Kontury */}
      {LEVELS.map((level, i) => {
        const pts = contourPoints(level);
        const path = pts.map((p) => `${r(proj.sx(p.x))},${r(proj.sy(p.y))}`).join(" ");
        const opacity = Math.round((0.3 + (LEVELS.length - i) * 0.07) * 100) / 100;
        const stroke = i < 3 ? "#10b981" : i < 5 ? "#f59e0b" : "#ef4444";
        return (
          <polygon
            key={level}
            points={path}
            fill="none"
            stroke={stroke}
            strokeWidth={1}
            opacity={opacity}
          />
        );
      })}

      {/* Osie X i Y w (0,0) */}
      <line x1={pad.l} y1={proj.sy(0)} x2={pad.l + plotW} y2={proj.sy(0)} stroke="#94a3b8" strokeWidth={0.8} />
      <line x1={proj.sx(0)} y1={pad.t} x2={proj.sx(0)} y2={pad.t + plotH} stroke="#94a3b8" strokeWidth={0.8} />

      {/* Etykiety osi X */}
      {[-2, 0, 2, 4].map((x) => (
        <text key={`lx${x}`} x={proj.sx(x)} y={pad.t + plotH + 14} fontSize={9} fontFamily="monospace" fill="#94a3b8" textAnchor="middle">
          {x}
        </text>
      ))}
      {/* Etykiety osi Y */}
      {[-2, 0, 2, 4].map((y) => (
        <text key={`ly${y}`} x={pad.l - 6} y={proj.sy(y) + 3} fontSize={9} fontFamily="monospace" fill="#94a3b8" textAnchor="end">
          {y}
        </text>
      ))}

      {/* Minimum globalne x* */}
      <circle cx={proj.sx(X_STAR.x)} cy={proj.sy(X_STAR.y)} r={6} fill="#10b981" stroke="white" strokeWidth={2} />
      <text x={proj.sx(X_STAR.x) + 10} y={proj.sy(X_STAR.y) - 6} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700}>
        x* (minimum)
      </text>
    </g>
  );
}

export { makeProjector } from "./optimization-2d-utils";
