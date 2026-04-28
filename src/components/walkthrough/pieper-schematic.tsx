/**
 * Schemat poglądowy warunku Piepera — trzy kolejne osie obrotu (tu 4, 5, 6)
 * przecinające się w jednym punkcie (środku nadgarstka). Ilustracja tłumaczy,
 * dlaczego orientacja i pozycja dają się rozdzielić: kąty q₄, q₅, q₆ nie
 * zmieniają położenia punktu przecięcia.
 */
export function PieperSchematic() {
  const W = 560, H = 340;
  // Centralny punkt — środek nadgarstka
  const cx = 300, cy = 180;
  // Kierunki osi (dla czytelności nie-ortogonalne w 2D — imitacja rzutu 3D)
  const axes = [
    { name: "z₄", dx: 1.0, dy: 0.0, color: "#ef4444" },    // wzdłuż przedramienia
    { name: "z₅", dx: -0.1, dy: -1.0, color: "#10b981" },  // pionowa
    { name: "z₆", dx: 0.75, dy: 0.55, color: "#3b82f6" },  // wzdłuż narzędzia
  ];
  const len = 90;

  // Pozycja TCP — d₆ wzdłuż z₆
  const d6 = 60;
  const tcpX = cx + d6 * axes[2].dx;
  const tcpY = cy + d6 * axes[2].dy;

  // Przedramię (schematycznie) — wchodzi od lewej
  const upperArmStart = { x: 70, y: 220 };
  const elbow = { x: 170, y: 170 };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
        {/* Bark i ramię */}
        <circle cx={upperArmStart.x} cy={upperArmStart.y} r={8} fill="#0b5ed7" />
        <text x={upperArmStart.x - 10} y={upperArmStart.y + 20} fontSize={11} fill="#0b5ed7" fontFamily="monospace" textAnchor="end">bark (q₂)</text>
        <line x1={upperArmStart.x} y1={upperArmStart.y} x2={elbow.x} y2={elbow.y} stroke="#52525b" strokeWidth={6} />
        <text x={(upperArmStart.x + elbow.x) / 2} y={(upperArmStart.y + elbow.y) / 2 - 8} fontSize={12} fill="#334155" fontFamily="monospace" textAnchor="middle">a₂</text>

        {/* Łokieć */}
        <circle cx={elbow.x} cy={elbow.y} r={7} fill="#f59e0b" />
        <text x={elbow.x - 6} y={elbow.y + 20} fontSize={11} fill="#f59e0b" fontFamily="monospace" textAnchor="end">łokieć (q₃)</text>

        {/* Przedramię do środka nadgarstka */}
        <line x1={elbow.x} y1={elbow.y} x2={cx} y2={cy} stroke="#52525b" strokeWidth={6} />
        <text x={(elbow.x + cx) / 2 + 10} y={(elbow.y + cy) / 2 - 4} fontSize={12} fill="#334155" fontFamily="monospace">L = √(a₃²+d₄²)</text>

        {/* Środek nadgarstka — wyróżniony */}
        <circle cx={cx} cy={cy} r={14} fill="#a855f7" opacity={0.25} />
        <circle cx={cx} cy={cy} r={7} fill="#a855f7" />
        <text x={cx} y={cy - 22} fontSize={12} fill="#a855f7" fontFamily="monospace" textAnchor="middle" fontWeight={600}>
          środek nadgarstka
        </text>

        {/* Osie q₄, q₅, q₆ przechodzące przez jeden punkt */}
        {axes.map((ax) => (
          <g key={ax.name}>
            <line
              x1={cx - ax.dx * len}
              y1={cy - ax.dy * len}
              x2={cx + ax.dx * len}
              y2={cy + ax.dy * len}
              stroke={ax.color}
              strokeWidth={1.6}
              markerEnd={`url(#arrow-${ax.name})`}
            />
            <defs>
              <marker id={`arrow-${ax.name}`} markerWidth={10} markerHeight={10} refX={6} refY={3} orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={ax.color} />
              </marker>
            </defs>
            <text
              x={cx + ax.dx * (len + 10)}
              y={cy + ax.dy * (len + 10) + 4}
              fontSize={13}
              fill={ax.color}
              fontFamily="monospace"
              fontWeight={600}
              textAnchor={ax.dx > 0.3 ? "start" : ax.dx < -0.3 ? "end" : "middle"}
            >
              {ax.name}
            </text>
          </g>
        ))}

        {/* TCP */}
        <circle cx={tcpX} cy={tcpY} r={5} fill="#ef4444" />
        <text x={tcpX + 8} y={tcpY + 4} fontSize={11} fill="#ef4444" fontFamily="monospace">TCP</text>
        {/* Odcinek d₆ */}
        <line x1={cx} y1={cy} x2={tcpX} y2={tcpY} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 2" />
        <text x={(cx + tcpX) / 2} y={(cy + tcpY) / 2 - 6} fontSize={11} fill="#ef4444" fontFamily="monospace">d₆</text>

        {/* Opis — dolne wyjaśnienie */}
        <g transform={`translate(24, ${H - 72})`}>
          <rect x={0} y={0} width={W - 48} height={60} fill="#f8fafc" stroke="#e5e7eb" rx={6} />
          <text x={10} y={18} fontSize={11} fill="#334155" fontFamily="system-ui" fontWeight={600}>Warunek Piepera (spełniony dla Puma560):</text>
          <text x={10} y={34} fontSize={11} fill="#334155" fontFamily="system-ui">Trzy kolejne osie obrotu q₄, q₅, q₆ przecinają się w jednym punkcie — środku nadgarstka.</text>
          <text x={10} y={50} fontSize={11} fill="#334155" fontFamily="system-ui">W efekcie: pozycja środka zależy tylko od q₁, q₂, q₃, a orientacja efektora — od q₄, q₅, q₆.</text>
        </g>
      </svg>
    </div>
  );
}
