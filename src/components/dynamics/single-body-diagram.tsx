import { Math as M } from "@/components/ui/math";

/**
 * Schemat dla kroku 0 — pojedyncze ciało sztywne (cylinder) z zaznaczonymi
 * F_C (siła bezwładności w środku masy), N_C (moment bezwładności), ω, ε.
 * Cała dynamika Newtona-Eulera w jednym widoku — bez łańcucha, bez indeksów.
 */
export function SingleBodyDiagram() {
  const W = 560, H = 280;
  const cx = W / 2;
  const cy = H / 2;

  return (
    <div className="not-prose my-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-white">
        <defs>
          <marker id="arr-f" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#ef4444" />
          </marker>
          <marker id="arr-n" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#a855f7" />
          </marker>
          <marker id="arr-w" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#0ea5e9" />
          </marker>
        </defs>

        {/* Cylinder jako prostokąt z lekkim cieniowaniem */}
        <ellipse cx={cx - 140} cy={cy} rx={20} ry={50} fill="#cbd5e1" stroke="#475569" strokeWidth={1.5} />
        <rect x={cx - 140} y={cy - 50} width={280} height={100} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
        <ellipse cx={cx + 140} cy={cy} rx={20} ry={50} fill="#f1f5f9" stroke="#475569" strokeWidth={1.5} />

        {/* Środek masy — kropka */}
        <circle cx={cx} cy={cy} r={5} fill="#0f172a" />
        <text x={cx + 10} y={cy + 4} fontSize={12} fontFamily="monospace" fontWeight={600} fill="#0f172a">C</text>
        <text x={cx + 10} y={cy + 20} fontSize={10} fontFamily="monospace" fill="#64748b">m, I_C</text>

        {/* Strzałka F_C — w dół-prawo z C */}
        <line x1={cx} y1={cy} x2={cx + 80} y2={cy + 75} stroke="#ef4444" strokeWidth={2.5} markerEnd="url(#arr-f)" />
        <text x={cx + 85} y={cy + 80} fontSize={13} fontFamily="monospace" fontWeight={700} fill="#ef4444">F_C = m·a_C</text>

        {/* Łuk + strzałka N_C (rotacja wokół C) */}
        <path d={`M ${cx - 60} ${cy - 35} A 60 35 0 1 1 ${cx + 60} ${cy - 35}`}
              fill="none" stroke="#a855f7" strokeWidth={2.5} markerEnd="url(#arr-n)" />
        <text x={cx - 60} y={cy - 50} fontSize={13} fontFamily="monospace" fontWeight={700} fill="#a855f7">
          N_C = I·ε + ω×(I·ω)
        </text>

        {/* Strzałka ω — wzdłuż osi cylindra */}
        <line x1={cx - 175} y1={cy} x2={cx - 240} y2={cy} stroke="#0ea5e9" strokeWidth={2.5} markerEnd="url(#arr-w)" />
        <text x={cx - 245} y={cy - 6} textAnchor="end" fontSize={13} fontFamily="monospace" fontWeight={700} fill="#0ea5e9">ω</text>
        <text x={cx - 245} y={cy + 12} textAnchor="end" fontSize={10} fontFamily="monospace" fill="#0ea5e9">(zadane)</text>

        {/* Legenda — w prawym dolnym rogu */}
        <g transform={`translate(${W - 170}, ${H - 60})`}>
          <rect x={0} y={0} width={160} height={50} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
          <text x={8} y={16} fontSize={10} fontFamily="monospace" fill="#0ea5e9">■ ω, ε (zadane)</text>
          <text x={8} y={30} fontSize={10} fontFamily="monospace" fill="#ef4444">■ F_C (siła)</text>
          <text x={8} y={44} fontSize={10} fontFamily="monospace" fill="#a855f7">■ N_C (moment)</text>
        </g>
      </svg>
      <p className="text-xs text-[var(--muted)] mt-2">
        Pojedyncze sztywne ciało (cylinder) z zadanym ruchem (<M tex="\boldsymbol\omega, \boldsymbol\varepsilon, \mathbf{a}_C" />)
        i wynikającymi z niego siłą bezwładności <M tex="\mathbf{F}_C" /> oraz momentem bezwładności <M tex="\mathbf{N}_C" />
        w środku masy. Cała dynamika Newtona-Eulera <em>dla jednego ciała</em> to dwa równania widoczne wyżej.
      </p>
    </div>
  );
}
