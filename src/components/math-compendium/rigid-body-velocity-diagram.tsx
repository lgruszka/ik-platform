/**
 * Schemat „prędkość punktu na bryle sztywnej": pokazuje punkt O (środek bryły)
 * z prędkością v_O, oraz punkt P odległy o r od O. Bryła obraca się z ω.
 * Wynikowa prędkość v_P = v_O + ω × r — co jest najczęściej używanym wzorem
 * w dynamice manipulatorów (forward sweep Newton-Eulera).
 */
export function RigidBodyVelocityDiagram() {
  const W = 520, H = 270;
  const r = (n: number) => Math.round(n * 100) / 100;

  const O = { x: 130, y: 180 };
  const P = { x: 270, y: 90 };
  const vO = { x: 60, y: 10 };  // prędkość O
  const omegaCrossR = { x: -45, y: -45 }; // składowa ω×r (prostopadła do r)
  const vPx = vO.x + omegaCrossR.x;
  const vPy = vO.y + omegaCrossR.y;

  return (
    <div className="not-prose my-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-white">
        <defs>
          <marker id="rb-arr-vo" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#0ea5e9" />
          </marker>
          <marker id="rb-arr-r" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#64748b" />
          </marker>
          <marker id="rb-arr-w" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#a855f7" />
          </marker>
          <marker id="rb-arr-vp" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#10b981" />
          </marker>
          <marker id="rb-arr-wr" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#9333ea" />
          </marker>
        </defs>

        {/* Bryła sztywna — owalna sylwetka */}
        <ellipse cx={(O.x + P.x) / 2 - 10} cy={(O.y + P.y) / 2 + 10} rx={120} ry={80}
                 fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={0.6}
                 transform={`rotate(-25 ${(O.x + P.x) / 2 - 10} ${(O.y + P.y) / 2 + 10})`} />

        {/* Wektor r (od O do P) */}
        <line x1={O.x} y1={O.y} x2={P.x} y2={P.y}
              stroke="#64748b" strokeWidth={2} markerEnd="url(#rb-arr-r)" strokeDasharray="4 3" />
        <text x={r((O.x + P.x) / 2 + 8)} y={r((O.y + P.y) / 2 + 6)}
              fontSize={13} fontFamily="monospace" fontWeight={700} fill="#64748b">r</text>

        {/* Prędkość v_O w punkcie O */}
        <line x1={O.x} y1={O.y} x2={r(O.x + vO.x)} y2={r(O.y + vO.y)}
              stroke="#0ea5e9" strokeWidth={2.5} markerEnd="url(#rb-arr-vo)" />
        <text x={r(O.x + vO.x + 6)} y={r(O.y + vO.y + 4)}
              fontSize={13} fontFamily="monospace" fontWeight={700} fill="#0ea5e9">v_O</text>

        {/* ω wokół O (łuk + strzałka) */}
        <path d={`M ${O.x + 30} ${O.y - 10} A 22 22 0 1 1 ${O.x - 5} ${O.y + 28}`}
              fill="none" stroke="#a855f7" strokeWidth={2}
              markerEnd="url(#rb-arr-w)" />
        <text x={O.x - 20} y={O.y - 5} fontSize={14} fontFamily="monospace" fontWeight={700} fill="#a855f7">ω</text>

        {/* Punkt O */}
        <circle cx={O.x} cy={O.y} r={4} fill="#0f172a" />
        <text x={O.x + 6} y={O.y + 18} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#0f172a">O</text>

        {/* Punkt P */}
        <circle cx={P.x} cy={P.y} r={4} fill="#0f172a" />
        <text x={P.x + 8} y={P.y - 4} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#0f172a">P</text>

        {/* W punkcie P: v_P jako suma v_O + ω×r */}
        {/* składowa v_O przeniesiona do P */}
        <line x1={P.x} y1={P.y} x2={r(P.x + vO.x)} y2={r(P.y + vO.y)}
              stroke="#0ea5e9" strokeWidth={1.5} markerEnd="url(#rb-arr-vo)" strokeDasharray="2 3" opacity={0.7} />
        {/* składowa ω×r */}
        <line x1={r(P.x + vO.x)} y1={r(P.y + vO.y)}
              x2={r(P.x + vO.x + omegaCrossR.x)} y2={r(P.y + vO.y + omegaCrossR.y)}
              stroke="#9333ea" strokeWidth={1.5} markerEnd="url(#rb-arr-wr)" strokeDasharray="2 3" opacity={0.7} />
        <text x={r(P.x + vO.x + omegaCrossR.x / 2 - 35)} y={r(P.y + vO.y + omegaCrossR.y / 2 - 5)}
              fontSize={10} fontFamily="monospace" fill="#9333ea">ω×r</text>

        {/* Wypadkowa v_P */}
        <line x1={P.x} y1={P.y} x2={r(P.x + vPx)} y2={r(P.y + vPy)}
              stroke="#10b981" strokeWidth={2.5} markerEnd="url(#rb-arr-vp)" />
        <text x={r(P.x + vPx - 14)} y={r(P.y + vPy - 6)}
              fontSize={13} fontFamily="monospace" fontWeight={700} fill="#10b981">v_P</text>

        {/* Formuła w prawym dolnym rogu */}
        <g transform="translate(310, 200)">
          <rect x={0} y={0} width={195} height={60} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
          <text x={10} y={20} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#0f172a">
            Bryła sztywna:
          </text>
          <text x={10} y={42} fontSize={14} fontFamily="monospace" fontWeight={700} fill="#10b981">
            v_P = v_O + ω × r
          </text>
        </g>
      </svg>
    </div>
  );
}
