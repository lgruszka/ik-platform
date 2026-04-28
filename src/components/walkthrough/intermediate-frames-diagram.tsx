/**
 * Rysunek: dekompozycja transformacji T_{i-1}^i na cztery kolejne operacje
 *
 *   {i-1}  --Rx(α_{i-1})-->  {R}  --Tx(a_{i-1})-->  {Q}  --Rz(θ_i)-->  {P}  --Tz(d_i)-->  {i}
 *
 * Każdy pośredni układ dziedziczy z poprzedniego wszystko oprócz jednej
 * operacji — dzięki temu student widzi, że cztery parametry DH to po prostu
 * cztery kolejne kroki „pojedyncza rotacja lub translacja wzdłuż jednej osi".
 *
 * Odsyłacz: Figure 3.15 u Craiga (wyd. 3). Nasza stylistyka jest uproszczona —
 * tylko osie, bez obudów i cylindrów — bo celem jest matematyczny rozkład.
 */
export function IntermediateFramesDiagram() {
  const W = 760, H = 340;

  // Cztery „pozycje" na rysunku: {i-1}, {R}, {Q} razem (w tym samym punkcie, bo Rz
  // nie przesuwa initial point; choć {Q} jest już przed Tz, więc zostaje w B),
  // i {P}. Dla czytelności pokażmy oddzielne punkty.
  const origPrev = { x: 110, y: 240 };
  const origR = { x: 110, y: 240 };      // {R} ma ten sam origin co {i-1}, zmienia tylko orientację osi Z
  const origQ = { x: 400, y: 240 };      // po Tx o a_{i-1} wzdłuż x_{i-1}
  const origP = { x: 400, y: 240 };      // {P} ma ten sam origin co {Q} — Rz nie rusza punktu
  const origI = { x: 400, y: 110 };      // po Tz o d_i wzdłuż z_i

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      <defs>
        <marker id="if-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#10b981" /></marker>
        <marker id="if-arr-r" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#ef4444" /></marker>
        <marker id="if-arr-gray" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#64748b" /></marker>
      </defs>

      {/* Podział na 4 strefy ułatwiający czytanie */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * (W / 4)} y={0} width={W / 4} height={H} fill={i % 2 === 0 ? "#f8fafc" : "#ffffff"} />
      ))}

      {/* Nagłówki stref */}
      {["{i−1}", "{R}", "{Q}", "{P} i {i}"].map((label, i) => (
        <text key={i} x={i * (W / 4) + W / 8} y={30} fontSize={13} fill="#334155" fontFamily="monospace" fontWeight={700} textAnchor="middle">
          {label}
        </text>
      ))}

      {/* 1. {i-1}: x w prawo, z w górę */}
      <g transform={`translate(${110}, 0)`}>
        <line x1={0} y1={240} x2={40} y2={240} stroke="#ef4444" strokeWidth={2} markerEnd="url(#if-arr-r)" />
        <text x={48} y={244} fontSize={11} fill="#ef4444" fontFamily="monospace">x̂<tspan fontSize={9} dy={2}>i−1</tspan></text>
        <line x1={0} y1={240} x2={0} y2={180} stroke="#10b981" strokeWidth={2} markerEnd="url(#if-arr)" />
        <text x={6} y={174} fontSize={11} fill="#10b981" fontFamily="monospace">ẑ<tspan fontSize={9} dy={2}>i−1</tspan></text>
        <circle cx={0} cy={240} r={3} fill="#334155" />
      </g>
      {/* Operacja 1 → Rx(α) */}
      <g transform={`translate(${W / 4}, 240)`}>
        <text x={-22} y={-48} fontSize={12} fill="#a855f7" fontFamily="monospace" fontWeight={700}>Rx(αᵢ₋₁)</text>
        <path d={`M -40 0 Q -20 -30 -5 -5`} fill="none" stroke="#a855f7" strokeWidth={1.6} markerEnd="url(#if-arr-gray)" />
      </g>

      {/* 2. {R}: x nadal w prawo, z obrócone o α */}
      <g transform={`translate(${W / 4 + 80}, 0)`}>
        <line x1={0} y1={240} x2={40} y2={240} stroke="#ef4444" strokeWidth={2} markerEnd="url(#if-arr-r)" />
        <text x={48} y={244} fontSize={11} fill="#ef4444" fontFamily="monospace">x̂<tspan fontSize={9} dy={2}>R</tspan></text>
        <line x1={0} y1={240} x2={20} y2={180} stroke="#10b981" strokeWidth={2} markerEnd="url(#if-arr)" />
        <text x={24} y={174} fontSize={11} fill="#10b981" fontFamily="monospace">ẑ<tspan fontSize={9} dy={2}>R</tspan></text>
        <circle cx={0} cy={240} r={3} fill="#334155" />
      </g>
      {/* Operacja 2 → Tx(a) */}
      <g transform={`translate(${2 * W / 4}, 240)`}>
        <text x={-26} y={-40} fontSize={12} fill="#c87941" fontFamily="monospace" fontWeight={700}>Tx(aᵢ₋₁)</text>
        <path d={`M -35 -2 L -5 -2`} fill="none" stroke="#c87941" strokeWidth={1.6} markerEnd="url(#if-arr-gray)" />
      </g>

      {/* 3. {Q}: origin przesunięty o a wzdłuż x */}
      <g transform={`translate(${2 * W / 4 + 60}, 0)`}>
        <line x1={0} y1={240} x2={40} y2={240} stroke="#ef4444" strokeWidth={2} markerEnd="url(#if-arr-r)" />
        <text x={48} y={244} fontSize={11} fill="#ef4444" fontFamily="monospace">x̂<tspan fontSize={9} dy={2}>Q</tspan></text>
        <line x1={0} y1={240} x2={20} y2={180} stroke="#10b981" strokeWidth={2} markerEnd="url(#if-arr)" />
        <text x={24} y={174} fontSize={11} fill="#10b981" fontFamily="monospace">ẑ<tspan fontSize={9} dy={2}>Q</tspan></text>
        <circle cx={0} cy={240} r={3} fill="#334155" />
      </g>
      {/* Operacja 3 → Rz(θ) */}
      <g transform={`translate(${3 * W / 4}, 240)`}>
        <text x={-26} y={-48} fontSize={12} fill="#a855f7" fontFamily="monospace" fontWeight={700}>Rz(θᵢ)</text>
        <path d={`M -38 0 Q -20 -30 -5 -5`} fill="none" stroke="#a855f7" strokeWidth={1.6} markerEnd="url(#if-arr-gray)" />
      </g>

      {/* 4. {P} = po Rz, następnie Tz → {i} */}
      <g transform={`translate(${3 * W / 4 + 60}, 0)`}>
        <line x1={0} y1={240} x2={35} y2={255} stroke="#ef4444" strokeWidth={2} markerEnd="url(#if-arr-r)" />
        <text x={40} y={262} fontSize={11} fill="#ef4444" fontFamily="monospace">x̂<tspan fontSize={9} dy={2}>i</tspan></text>
        <line x1={0} y1={240} x2={20} y2={180} stroke="#10b981" strokeWidth={2.4} markerEnd="url(#if-arr)" />
        <line x1={20} y1={180} x2={40} y2={120} stroke="#c87941" strokeWidth={3} strokeDasharray="5 3" markerEnd="url(#if-arr-gray)" />
        <text x={44} y={118} fontSize={11} fill="#c87941" fontFamily="monospace" fontWeight={700}>dᵢ</text>
        <text x={24} y={174} fontSize={11} fill="#10b981" fontFamily="monospace">ẑ<tspan fontSize={9} dy={2}>i</tspan></text>
        <circle cx={0} cy={240} r={3} fill="#334155" />
        <circle cx={40} cy={120} r={3} fill="#334155" />
        <text x={46} y={134} fontSize={10} fill="#334155" fontFamily="monospace">{"{i}"}</text>
      </g>

      {/* Dolny pasek: pełna macierz */}
      <g transform={`translate(0, ${H - 50})`}>
        <rect x={18} y={0} width={W - 36} height={40} fill="#0f172a" stroke="#334155" rx={6} />
        <text x={W / 2} y={24} fontSize={13} fill="#f8fafc" fontFamily="monospace" textAnchor="middle">
          <tspan fontWeight={600}>T_{'{i−1}'}^{'{i}'}</tspan> = Rx(αᵢ₋₁) · Tx(aᵢ₋₁) · Rz(θᵢ) · Tz(dᵢ)
        </text>
      </g>

      {/* Atrybucja */}
      <text x={W - 12} y={14} fontSize={9} fill="#94a3b8" fontFamily="system-ui" textAnchor="end">
        por. Craig, „Introduction to Robotics", wyd. 3, Fig. 3.15
      </text>
    </svg>
  );
}
