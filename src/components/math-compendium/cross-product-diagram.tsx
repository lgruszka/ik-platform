/**
 * Schemat iloczynu wektorowego — pokazuje a, b i wynikowy a×b prostopadły do
 * obu, z regułą prawej dłoni i geometryczną interpretacją wartości |a||b|sin θ
 * jako pola równoległoboku.
 */
export function CrossProductDiagram() {
  const W = 480, H = 280;
  const cx = 180, cy = 200; // origin

  // wektory w 2D (rzut perspektywiczny "z góry-lewo")
  const a = { x: 120, y: -30 };
  const b = { x: 50, y: -100 };
  // Wynik a×b — symbolicznie wystaje "ku obserwatorowi"; pokazujemy z lekkim
  // skosem w górę
  const c = { x: -10, y: -110 };

  const r = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="not-prose my-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-white">
        <defs>
          <marker id="cp-arr-a" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#0ea5e9" />
          </marker>
          <marker id="cp-arr-b" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#10b981" />
          </marker>
          <marker id="cp-arr-c" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#a855f7" />
          </marker>
        </defs>

        {/* Równoległobok (a, b) — geometryczna interpretacja |a×b| jako pole */}
        <polygon
          points={`${cx},${cy} ${r(cx + a.x)},${r(cy + a.y)} ${r(cx + a.x + b.x)},${r(cy + a.y + b.y)} ${r(cx + b.x)},${r(cy + b.y)}`}
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          fillOpacity={0.5}
        />
        <text x={r(cx + (a.x + b.x) / 2)} y={r(cy + (a.y + b.y) / 2)} textAnchor="middle"
              fontSize={11} fontFamily="monospace" fill="#92400e" fontWeight={600}>
          |a×b| = pole
        </text>

        {/* Wektor a */}
        <line x1={cx} y1={cy} x2={r(cx + a.x)} y2={r(cy + a.y)}
              stroke="#0ea5e9" strokeWidth={3} markerEnd="url(#cp-arr-a)" />
        <text x={r(cx + a.x + 8)} y={r(cy + a.y + 4)}
              fontSize={14} fontFamily="monospace" fontWeight={700} fill="#0ea5e9">a</text>

        {/* Wektor b */}
        <line x1={cx} y1={cy} x2={r(cx + b.x)} y2={r(cy + b.y)}
              stroke="#10b981" strokeWidth={3} markerEnd="url(#cp-arr-b)" />
        <text x={r(cx + b.x - 10)} y={r(cy + b.y - 4)}
              fontSize={14} fontFamily="monospace" fontWeight={700} fill="#10b981">b</text>

        {/* Wynikowy a×b */}
        <line x1={cx} y1={cy} x2={r(cx + c.x)} y2={r(cy + c.y)}
              stroke="#a855f7" strokeWidth={3} markerEnd="url(#cp-arr-c)" />
        <text x={r(cx + c.x - 24)} y={r(cy + c.y - 4)}
              fontSize={14} fontFamily="monospace" fontWeight={700} fill="#a855f7">a × b</text>

        {/* Origin */}
        <circle cx={cx} cy={cy} r={3} fill="#0f172a" />
        <text x={cx + 6} y={cy + 16} fontSize={10} fontFamily="monospace" fill="#475569">0</text>

        {/* Legenda / formuła po prawej */}
        <g transform="translate(310, 30)">
          <rect x={0} y={0} width={155} height={210} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
          <text x={10} y={20} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#0f172a">
            Iloczyn wektorowy
          </text>
          <text x={10} y={42} fontSize={11} fontFamily="monospace" fill="#475569">
            • prostopadły do a i b
          </text>
          <text x={10} y={58} fontSize={11} fontFamily="monospace" fill="#475569">
            • długość = pole
          </text>
          <text x={10} y={74} fontSize={11} fontFamily="monospace" fill="#475569">
            • kierunek: prawa dłoń
          </text>
          <text x={10} y={100} fontSize={10} fontFamily="monospace" fontWeight={600} fill="#0f172a">
            |a×b| = |a||b| sin θ
          </text>
          <text x={10} y={118} fontSize={9} fontFamily="monospace" fill="#94a3b8">
            (θ — kąt między)
          </text>
          <text x={10} y={144} fontSize={10} fontFamily="monospace" fontWeight={600} fill="#0f172a">
            a × b = -b × a
          </text>
          <text x={10} y={158} fontSize={9} fontFamily="monospace" fill="#94a3b8">
            (antysymetryczne)
          </text>
          <text x={10} y={184} fontSize={10} fontFamily="monospace" fontWeight={600} fill="#0f172a">
            a × a = 0
          </text>
          <text x={10} y={198} fontSize={9} fontFamily="monospace" fill="#94a3b8">
            (zerowy kąt → pole 0)
          </text>
        </g>
      </svg>
    </div>
  );
}
