/**
 * Rysunek: cztery parametry Denavita–Hartenberga (konwencja Crig / modified)
 * w jednej scenie. Każdy parametr — α, a, d, θ — ma osobny kolor i przypisane
 * geometryczne znaczenie.
 *
 * Odsyłacz: pokrewna treść w Figure 3.4 u Craiga; my rozbijamy prezentację
 * na cztery panele pomocnicze pod rysunkiem głównym, żeby student mógł je
 * czytać jeden po drugim.
 */
export function DhParametersDiagram() {
  const W = 720, H = 440;

  // Podstawowa scena: dwie proste osie (z_{i-1}, z_i) i ich wspólna normalna.
  const A = { x: 200, y: 300 };     // punkt na osi z_{i-1} gdzie dotyka wspólna normalna
  const zPrevTop = { x: 180, y: 100 };
  const B = { x: 520, y: 280 };     // punkt na osi z_i gdzie dotyka wspólna normalna
  const zCurTop = { x: 580, y: 70 };

  const ARROW = `<path d="M0,0 L7,3 L0,6 Z" />`;

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
        <defs>
          <marker id="dp-arr-g" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#10b981" /></marker>
          <marker id="dp-arr-p" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#a855f7" /></marker>
          <marker id="dp-arr-o" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#c87941" /></marker>
          <marker id="dp-arr-gray" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#64748b" /></marker>
        </defs>

        {/* Osie przegubów — wydłużone poza punkty dotyku */}
        <line x1={A.x + 20} y1={A.y + 80} x2={zPrevTop.x - 5} y2={zPrevTop.y - 30}
              stroke="#10b981" strokeWidth={2.2} markerEnd="url(#dp-arr-g)" />
        <line x1={B.x - 30} y1={B.y + 80} x2={zCurTop.x} y2={zCurTop.y - 20}
              stroke="#10b981" strokeWidth={2.2} markerEnd="url(#dp-arr-g)" />

        <text x={zPrevTop.x - 12} y={zPrevTop.y - 14} fontSize={12} fill="#10b981" fontFamily="monospace" fontWeight={600}>ẑ<tspan fontSize={10} dy={3}>i−1</tspan></text>
        <text x={zCurTop.x + 8} y={zCurTop.y - 4} fontSize={12} fill="#10b981" fontFamily="monospace" fontWeight={600}>ẑ<tspan fontSize={10} dy={3}>i</tspan></text>

        {/* Parametr a_{i-1}: długość wspólnej normalnej (pomarańczowy-brązowy) */}
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="#334155" strokeWidth={2.2} markerEnd="url(#dp-arr-gray)" />
        <rect x={(A.x + B.x) / 2 - 22} y={(A.y + B.y) / 2 - 22} width={44} height={18} fill="#fff7ed" stroke="#c87941" rx={4} />
        <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 8} fontSize={13} fill="#c87941" fontFamily="monospace" fontWeight={700} textAnchor="middle">
          a<tspan fontSize={10} dy={3}>i−1</tspan>
        </text>

        {/* Kąt α_{i-1}: między ẑ_{i-1} a ẑ_i (w płaszczyźnie normalnej do x_{i-1}) */}
        <path d={arc(A, {x: -0.1, y: -1}, dir(A, B), 40)} fill="none" stroke="#a855f7" strokeWidth={1.8} />
        <text x={A.x + 54} y={A.y - 20} fontSize={13} fill="#a855f7" fontFamily="monospace" fontWeight={700}>
          α<tspan fontSize={10} dy={3}>i−1</tspan>
        </text>

        {/* x_{i-1} — wzdłuż wspólnej normalnej */}
        <text x={A.x + 10} y={A.y + 22} fontSize={11} fill="#ef4444" fontFamily="monospace" fontWeight={600}>
          x̂<tspan fontSize={9} dy={2}>i−1</tspan>
        </text>

        {/* d_i i θ_i — zaczepione na osi z_i, początek układu {i} w B + d_i·ẑ_i */}
        {(() => {
          const zi = normalize(sub(zCurTop, B));
          const d_i_vis = 70;
          const origI = add(B, scale(zi, d_i_vis));
          return (
            <>
              {/* d_i — pomarańczowy double-stripe */}
              <line x1={B.x - 3} y1={B.y} x2={origI.x - 3} y2={origI.y} stroke="#c87941" strokeWidth={2} />
              <line x1={B.x + 3} y1={B.y} x2={origI.x + 3} y2={origI.y} stroke="#c87941" strokeWidth={2} markerEnd="url(#dp-arr-o)" />
              <rect x={origI.x + 8} y={(B.y + origI.y) / 2 - 10} width={34} height={18} fill="#fff7ed" stroke="#c87941" rx={4} />
              <text x={origI.x + 25} y={(B.y + origI.y) / 2 + 4} fontSize={13} fill="#c87941" fontFamily="monospace" fontWeight={700} textAnchor="middle">
                d<tspan fontSize={10} dy={3}>i</tspan>
              </text>

              {/* θ_i — łuk między x_{i-1} a x_i przy origI */}
              {(() => {
                const xPrev = normalize(sub(B, A));  // kierunek x_{i-1}
                // obrót tego wektora w płaszczyźnie o ~35° (dla czytelnej ilustracji kąta)
                const c = Math.cos(0.6), s = Math.sin(0.6);
                const xCur = { x: xPrev.x * c - xPrev.y * s, y: xPrev.x * s + xPrev.y * c };
                return (
                  <>
                    <line x1={origI.x} y1={origI.y} x2={origI.x + xCur.x * 54} y2={origI.y + xCur.y * 54}
                          stroke="#ef4444" strokeWidth={2} />
                    <text x={origI.x + xCur.x * 66} y={origI.y + xCur.y * 66 + 4} fontSize={12} fill="#ef4444" fontFamily="monospace" fontWeight={700}>
                      x̂<tspan fontSize={10} dy={3}>i</tspan>
                    </text>
                    <path d={arc(origI, xPrev, xCur, 34)} fill="none" stroke="#a855f7" strokeWidth={1.8} />
                    <text x={origI.x + 48} y={origI.y + 8} fontSize={13} fill="#a855f7" fontFamily="monospace" fontWeight={700}>
                      θ<tspan fontSize={10} dy={3}>i</tspan>
                    </text>
                  </>
                );
              })()}

              {/* Origin marker of {i} */}
              <circle cx={origI.x} cy={origI.y} r={3.5} fill="#334155" />
              <text x={origI.x - 14} y={origI.y + 18} fontSize={11} fill="#334155" fontFamily="monospace" textAnchor="end">{"{i}"}</text>
            </>
          );
        })()}

        {/* Origin marker of {i-1} */}
        <circle cx={A.x} cy={A.y} r={3.5} fill="#334155" />
        <text x={A.x - 10} y={A.y + 20} fontSize={11} fill="#334155" fontFamily="monospace" textAnchor="end">{"{i−1}"}</text>

        {/* Atrybucja */}
        <text x={W - 12} y={14} fontSize={9} fill="#94a3b8" fontFamily="system-ui" textAnchor="end">
          por. Craig, „Introduction to Robotics", wyd. 3, Fig. 3.4
        </text>
      </svg>

      {/* Cztery pod-panele wyjaśniające */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <Panel color="#c87941" symbol="aᵢ₋₁" name="długość ogniwa i−1">
          Odległość między osiami przegubów i−1 oraz i, mierzona wzdłuż wspólnej normalnej.
        </Panel>
        <Panel color="#a855f7" symbol="αᵢ₋₁" name="skręcenie ogniwa i−1">
          Kąt obrotu osi <i>ẑ</i><sub>i−1</sub> do <i>ẑ</i><sub>i</sub>, obracany wokół wspólnej normalnej.
        </Panel>
        <Panel color="#c87941" symbol="dᵢ" name="odsadzenie przegubu i">
          Przesunięcie początku układu {"{i}"} wzdłuż osi <i>ẑ</i><sub>i</sub> od wspólnej normalnej.
        </Panel>
        <Panel color="#a855f7" symbol="θᵢ" name="kąt przegubu i">
          Kąt obrotu osi <i>x̂</i><sub>i−1</sub> do <i>x̂</i><sub>i</sub>, obracany wokół <i>ẑ</i><sub>i</sub>. Dla przegubu obrotowego jest to zmienna konfiguracji.
        </Panel>
      </div>
    </div>
  );
}

function Panel({ color, symbol, name, children }: { color: string; symbol: string; name: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono font-bold text-base" style={{ color }}>{symbol}</span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{name}</span>
      </div>
      <p className="text-[11px] leading-snug text-[var(--foreground)]">{children}</p>
    </div>
  );
}

// --- geometry helpers (local duplicates — komponent samodzielny) ---
type Pt = { x: number; y: number };
function sub(a: Pt, b: Pt): Pt { return { x: a.x - b.x, y: a.y - b.y }; }
function add(a: Pt, b: Pt): Pt { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(a: Pt, s: number): Pt { return { x: a.x * s, y: a.y * s }; }
function normalize(a: Pt): Pt { const L = Math.hypot(a.x, a.y) || 1; return { x: a.x / L, y: a.y / L }; }
function dir(from: Pt, to: Pt): Pt { return normalize(sub(to, from)); }
function arc(center: Pt, from: Pt, to: Pt, r: number): string {
  const a1 = Math.atan2(from.y, from.x);
  const a2 = Math.atan2(to.y, to.x);
  const x1 = center.x + r * Math.cos(a1);
  const y1 = center.y + r * Math.sin(a1);
  const x2 = center.x + r * Math.cos(a2);
  const y2 = center.y + r * Math.sin(a2);
  const sweep = ((a2 - a1 + 2 * Math.PI) % (2 * Math.PI)) > Math.PI ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
}
