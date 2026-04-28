import { PUMA_A2, PUMA_A3, PUMA_D3, PUMA_D4 } from "@/lib/robots/puma560";

/**
 * Schemat kinematyczny Pumy560 w konwencji DH Craiga, w rzucie 3/4 (izometria).
 * Stylizowany — celem jest pokazanie wszystkich czterech znaczących offsetów
 * (a₂, a₃, d₃, d₄) z zachowaniem wzajemnych połączeń i jednolitej skali.
 *
 * Uwaga: a₃ ≈ 0.02 m jest realnie znacznie mniejsze od pozostałych długości
 * — w rysunku jest powiększone w stosunku do skali, żeby było widoczne. Ten
 * fakt jest zaznaczony w legendzie.
 */
export function PumaDHSchematic() {
  const W = 720, H = 460;

  // Skala bazowa: 1 m → tyle pikseli (przy realistycznym a₃ byłby ledwie widoczny;
  // dlatego wartości a, d są pokazane proporcjonalnie poza a₃, które jest powiększone)
  const S = 220;

  // Pedestał (układ {0}/{1})
  const baseX = 110;
  const groundY = 410;
  const pedestalTopY = 200;
  const pedestalWidth = 40;

  // Bark — przegub q₂, w górnej części pedestału
  const shoulder = { x: baseX, y: pedestalTopY };

  // Ramię a₂ — poziomo w prawo
  const elbow = { x: shoulder.x + PUMA_A2 * S, y: shoulder.y };

  // d₃ — odsadzenie boczne (prostopadle do ekranu w rzeczywistości; w rzucie 3/4
  // pokazujemy je ukośnie „w głąb i w dół")
  const isoDx = 0.65, isoDy = 0.75; // kierunek osi y świata w rzucie izometrycznym
  const d3End = {
    x: elbow.x + PUMA_D3 * S * isoDx,
    y: elbow.y + PUMA_D3 * S * isoDy,
  };

  // a₃ — mały segment w przedłużeniu ramienia. POWIĘKSZONY (z 0.02 m do efektywnego
  // ekwiwalentu ~0.05 m), bo realnie byłby ledwie widoczny.
  const A3_VISUAL_BOOST = 2.5;
  const a3End = {
    x: d3End.x + PUMA_A3 * S * A3_VISUAL_BOOST,
    y: d3End.y,
  };

  // d₄ — przedramię, pionowo w dół
  const wrist = { x: a3End.x, y: a3End.y + PUMA_D4 * S };

  // Narzędzie — krótki odcinek od wrist
  const tool = { x: wrist.x + 20, y: wrist.y + 38 };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      {/* Tło — siatka delikatna */}
      <g stroke="#f1f5f9" strokeWidth={0.5}>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h-${i}`} x1={0} y1={50 + i * 80} x2={W} y2={50 + i * 80} />
        ))}
      </g>

      {/* Podłoga */}
      <line x1={50} y1={groundY} x2={W - 280} y2={groundY} stroke="#94a3b8" strokeWidth={1.5} />
      <g>
        {Array.from({ length: 12 }, (_, i) => i * 30 + 60).map((x) => (
          <line key={x} x1={x} y1={groundY} x2={x - 8} y2={groundY + 8} stroke="#94a3b8" strokeWidth={0.8} />
        ))}
      </g>

      {/* Stopa robota */}
      <rect x={baseX - 38} y={groundY - 14} width={76} height={14} fill="#1f2937" />

      {/* Pedestał (osłona przegubu 1, oś pionowa) */}
      <rect
        x={baseX - pedestalWidth / 2}
        y={pedestalTopY + 12}
        width={pedestalWidth}
        height={groundY - 14 - (pedestalTopY + 12)}
        fill="#3f3f46"
      />

      {/* Oś z₁ (pionowa, przerywana) */}
      <line
        x1={shoulder.x} y1={pedestalTopY - 30}
        x2={shoulder.x} y2={groundY - 4}
        stroke="#10b981" strokeWidth={1.2} strokeDasharray="5 4"
      />
      <text x={shoulder.x + 8} y={pedestalTopY - 22} fontSize={12} fill="#10b981" fontFamily="monospace" fontWeight={700}>
        z₁
      </text>

      {/* Osłona barku (przegub q₂) */}
      <rect
        x={shoulder.x - 24} y={shoulder.y - 12}
        width={48} height={26}
        rx={6}
        fill="#52525b" stroke="#1f2937" strokeWidth={1}
      />

      {/* Oś z₂ — prostopadła do ekranu (kółko z kropką) */}
      <circle cx={shoulder.x} cy={shoulder.y} r={9} fill="white" stroke="#3b82f6" strokeWidth={1.6} />
      <circle cx={shoulder.x} cy={shoulder.y} r={2.2} fill="#3b82f6" />
      <text x={shoulder.x - 14} y={shoulder.y - 18} fontSize={11} fill="#3b82f6" fontFamily="monospace" fontWeight={700}>
        z₂ ⊙
      </text>
      <text x={shoulder.x - 14} y={shoulder.y + 32} fontSize={11} fill="#334155" fontFamily="monospace" textAnchor="end">
        q₂
      </text>

      {/* Ramię a₂ */}
      <line
        x1={shoulder.x + 9} y1={shoulder.y}
        x2={elbow.x - 8} y2={elbow.y}
        stroke="#52525b" strokeWidth={9} strokeLinecap="round"
      />
      {/* Etykieta a₂ */}
      <text
        x={(shoulder.x + elbow.x) / 2} y={shoulder.y - 16}
        fontSize={14} fill="#334155" fontFamily="monospace" fontWeight={700}
        textAnchor="middle"
      >
        a₂
      </text>
      {/* Wskaźniki długości a₂ */}
      <line
        x1={shoulder.x + 9} y1={shoulder.y - 26}
        x2={elbow.x - 8} y2={shoulder.y - 26}
        stroke="#94a3b8" strokeWidth={0.8} markerEnd="url(#dh-arrow)" markerStart="url(#dh-arrow-rev)"
      />
      <defs>
        <marker id="dh-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L5,3 L0,6 Z" fill="#94a3b8" />
        </marker>
        <marker id="dh-arrow-rev" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
          <path d="M5,0 L0,3 L5,6 Z" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Łokieć (przegub q₃) */}
      <circle cx={elbow.x} cy={elbow.y} r={9} fill="white" stroke="#f59e0b" strokeWidth={2} />
      <circle cx={elbow.x} cy={elbow.y} r={2.5} fill="#f59e0b" />
      <text x={elbow.x + 12} y={elbow.y - 12} fontSize={11} fill="#334155" fontFamily="monospace">
        q₃
      </text>

      {/* d₃ — odsunięcie boczne, ukośnie w głąb w rzucie 3/4 */}
      <line
        x1={elbow.x + 6} y1={elbow.y + 4}
        x2={d3End.x - 4} y2={d3End.y - 3}
        stroke="#c87941" strokeWidth={7} strokeLinecap="round"
      />
      <text
        x={(elbow.x + d3End.x) / 2 + 14} y={(elbow.y + d3End.y) / 2 - 4}
        fontSize={14} fill="#c87941" fontFamily="monospace" fontWeight={700}
      >
        d₃
      </text>
      <text
        x={(elbow.x + d3End.x) / 2 + 14} y={(elbow.y + d3End.y) / 2 + 12}
        fontSize={9} fill="#c87941" fontFamily="system-ui" fontStyle="italic"
      >
        (w głąb)
      </text>

      {/* a₃ — mały segment w prawo */}
      <line
        x1={d3End.x} y1={d3End.y}
        x2={a3End.x - 4} y2={a3End.y}
        stroke="#52525b" strokeWidth={6} strokeLinecap="round"
      />
      <text
        x={(d3End.x + a3End.x) / 2} y={a3End.y + 18}
        fontSize={12} fill="#334155" fontFamily="monospace" fontWeight={700}
        textAnchor="middle"
      >
        a₃
      </text>

      {/* d₄ — przedramię pionowo w dół */}
      <line
        x1={a3End.x} y1={a3End.y + 4}
        x2={wrist.x} y2={wrist.y - 9}
        stroke="#c87941" strokeWidth={9} strokeLinecap="round"
      />
      <text
        x={wrist.x + 16} y={(a3End.y + wrist.y) / 2 + 5}
        fontSize={14} fill="#334155" fontFamily="monospace" fontWeight={700}
      >
        d₄
      </text>

      {/* Wrist center — środek nadgarstka (przeguby q₄, q₅, q₆ przecinają się tutaj) */}
      <circle cx={wrist.x} cy={wrist.y} r={16} fill="#a855f7" opacity={0.22} />
      <circle cx={wrist.x} cy={wrist.y} r={9} fill="white" stroke="#a855f7" strokeWidth={2.4} />
      <circle cx={wrist.x} cy={wrist.y} r={3} fill="#a855f7" />
      <text x={wrist.x + 22} y={wrist.y + 4} fontSize={11} fill="#a855f7" fontFamily="monospace" fontWeight={700}>
        wrist center
      </text>

      {/* Trzy osie nadgarstka schematycznie */}
      <line x1={wrist.x - 30} y1={wrist.y} x2={wrist.x + 30} y2={wrist.y} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3 2" />
      <line x1={wrist.x} y1={wrist.y - 30} x2={wrist.x} y2={wrist.y + 30} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3 2" />
      <line x1={wrist.x - 22} y1={wrist.y - 22} x2={wrist.x + 22} y2={wrist.y + 22} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3 2" />

      {/* Tool — krótki odcinek do TCP */}
      <line
        x1={wrist.x + 6} y1={wrist.y + 6}
        x2={tool.x} y2={tool.y}
        stroke="#fbbf24" strokeWidth={4} strokeLinecap="round"
      />
      <circle cx={tool.x} cy={tool.y} r={5.5} fill="#ef4444" stroke="white" strokeWidth={1} />
      <text x={tool.x + 10} y={tool.y + 4} fontSize={11} fill="#ef4444" fontFamily="monospace" fontWeight={600}>
        TCP
      </text>

      {/* Legenda */}
      <g transform={`translate(${W - 240}, 30)`}>
        <rect x={0} y={0} width={224} height={208} fill="#f8fafc" stroke="#e5e7eb" rx={6} />
        <text x={12} y={20} fontSize={12} fontFamily="system-ui" fill="#334155" fontWeight={700}>
          Puma 560 (Craig, wym. [m])
        </text>
        <line x1={12} y1={28} x2={212} y2={28} stroke="#e5e7eb" />
        <text x={12} y={44} fontSize={11} fontFamily="monospace" fill="#334155">a₂ = {PUMA_A2.toFixed(4)}</text>
        <text x={132} y={44} fontSize={10} fontFamily="system-ui" fill="#64748b">ramię</text>
        <text x={12} y={62} fontSize={11} fontFamily="monospace" fill="#334155">a₃ = {PUMA_A3.toFixed(4)}</text>
        <text x={132} y={62} fontSize={10} fontFamily="system-ui" fill="#64748b">offset łokcia</text>
        <text x={12} y={80} fontSize={11} fontFamily="monospace" fill="#334155">d₃ = {PUMA_D3.toFixed(4)}</text>
        <text x={132} y={80} fontSize={10} fontFamily="system-ui" fill="#64748b">odsunięcie</text>
        <text x={12} y={98} fontSize={11} fontFamily="monospace" fill="#334155">d₄ = {PUMA_D4.toFixed(4)}</text>
        <text x={132} y={98} fontSize={10} fontFamily="system-ui" fill="#64748b">przedramię</text>
        <text x={12} y={116} fontSize={11} fontFamily="monospace" fill="#334155">d₆ = 0</text>
        <line x1={12} y1={126} x2={212} y2={126} stroke="#e5e7eb" />
        <g transform="translate(12, 138)">
          <line x1={0} y1={4} x2={20} y2={4} stroke="#52525b" strokeWidth={5} strokeLinecap="round" />
          <text x={28} y={8} fontSize={10} fontFamily="system-ui" fill="#64748b">szare odcinki = długości aᵢ</text>
        </g>
        <g transform="translate(12, 156)">
          <line x1={0} y1={4} x2={20} y2={4} stroke="#c87941" strokeWidth={5} strokeLinecap="round" />
          <text x={28} y={8} fontSize={10} fontFamily="system-ui" fill="#64748b">brązowe odcinki = odsunięcia dᵢ</text>
        </g>
        <g transform="translate(12, 174)">
          <circle cx={10} cy={4} r={6} fill="white" stroke="#3b82f6" strokeWidth={1.4} />
          <circle cx={10} cy={4} r={1.6} fill="#3b82f6" />
          <text x={28} y={8} fontSize={10} fontFamily="system-ui" fill="#64748b">⊙ = oś prostopadła do ekranu</text>
        </g>
        <text x={12} y={196} fontSize={9} fontFamily="system-ui" fill="#94a3b8" fontStyle="italic">
          a₃ na rysunku celowo powiększone (~×2.5)
        </text>
      </g>
    </svg>
  );
}
