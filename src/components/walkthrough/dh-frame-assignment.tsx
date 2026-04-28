/**
 * Rysunek: przypisanie układu współrzędnych {i} do ogniwa i.
 *
 * Pokazuje dwie osie obrotu przegubów (z_{i-1} i z_i) w 3D (rzut izometryczny),
 * ich wspólną normalną (długość a_{i-1}) oraz pełne triady osi dla obu układów
 * w ich początkach. Celem jest uświadomienie studentowi, że „układ
 * współrzędnych" to trójka wzajemnie prostopadłych wektorów jednostkowych
 * zaczepiona w konkretnym punkcie — a nie tylko osie z_i.
 *
 * Odsyłacz: ten rysunek pokrywa temat Figure 3.5 w Craig, „Introduction to
 * Robotics", wyd. 3, §3.4 — warto zerknąć na oryginał dla porównania stylu
 * (Craig używa stylizowanych walców jako ogniw; my zostajemy przy konwencji
 * czysto matematycznej).
 */
export function DhFrameAssignmentDiagram() {
  const W = 680, H = 360;

  // Dwie osie obrotu (z_{i-1}, z_i) w rzucie 2D imitującym 3D.
  const origPrev = { x: 160, y: 250 };        // początek układu {i-1}
  const tipPrev = { x: 150, y: 60 };          // koniec z_{i-1} (lekki skos)
  const origCur = { x: 500, y: 230 };         // punkt przecięcia wspólnej normalnej z osią z_i
  const tipCur = { x: 560, y: 40 };           // koniec z_i (większy skos, imituje 3D)

  // Początek układu {i} leży na osi z_i, przesunięty o d_i od wspólnej normalnej:
  const unitZi = normalize(sub(tipCur, origCur));
  const d_i_vis = 70;
  const origI = add(origCur, scale(unitZi, d_i_vis));

  // x_{i-1} biegnie wzdłuż wspólnej normalnej (od origPrev do origCur).
  const xPrevDir = normalize(sub(origCur, origPrev));

  // x_i biegnie pod kątem θ_i wokół osi z_i od kierunku x_{i-1}.
  // Dla czytelności rysunku przyjmijmy θ_i ≈ 30°.
  const theta = (30 * Math.PI) / 180;
  const xCurDir = rotAround(xPrevDir, unitZi, theta);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      {/* Osie obrotu jako cienkie proste przedłużające się poza punkty */}
      <defs>
        <marker id="fa-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#10b981" />
        </marker>
        <marker id="fa-arr-b" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#3b82f6" />
        </marker>
        <marker id="fa-arr-r" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#ef4444" />
        </marker>
        <marker id="fa-arr-gray" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#64748b" />
        </marker>
      </defs>

      {/* Przedłużenia osi (cienkie) */}
      <line x1={origPrev.x} y1={origPrev.y + 60} x2={tipPrev.x - 3} y2={tipPrev.y - 20} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={origCur.x} y1={origCur.y + 60} x2={tipCur.x - 3} y2={tipCur.y - 20} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />

      {/* Napisy "Oś przegubu i-1" i "Oś przegubu i" */}
      <text x={origPrev.x - 8} y={origPrev.y + 80} fontSize={11} fill="#64748b" fontFamily="system-ui" textAnchor="end">
        oś przegubu i−1
      </text>
      <text x={origCur.x + 12} y={origCur.y + 75} fontSize={11} fill="#64748b" fontFamily="system-ui">
        oś przegubu i
      </text>

      {/* Wspólna normalna między osiami (odcinek a_{i-1}) */}
      <line x1={origPrev.x} y1={origPrev.y} x2={origCur.x} y2={origCur.y}
            stroke="#64748b" strokeWidth={2.4} markerEnd="url(#fa-arr-gray)" />
      <text x={(origPrev.x + origCur.x) / 2} y={(origPrev.y + origCur.y) / 2 - 6}
            fontSize={13} fill="#334155" fontFamily="monospace" fontWeight={600} textAnchor="middle">
        a<tspan fontSize={10} dy={3}>i−1</tspan>
      </text>

      {/* Triada osi w {i-1}: z zielona, x szara wzdłuż a, y niebieska w głąb */}
      <Triad origin={origPrev} z={sub(tipPrev, origPrev)} x={xPrevDir} label="i−1" />

      {/* Oś z_i (od origCur w górę do tipCur) zaznaczona kolorem */}
      <line x1={origCur.x} y1={origCur.y} x2={tipCur.x} y2={tipCur.y}
            stroke="#10b981" strokeWidth={2.6} markerEnd="url(#fa-arr)" />
      <text x={tipCur.x + 8} y={tipCur.y + 4} fontSize={12} fill="#10b981" fontFamily="monospace" fontWeight={600}>
        ẑ<tspan fontSize={10} dy={3}>i</tspan>
      </text>

      {/* Odsadzenie d_i — od origCur do origI wzdłuż z_i */}
      <g>
        <line x1={origCur.x - 3} y1={origCur.y} x2={origI.x - 3} y2={origI.y} stroke="#c87941" strokeWidth={2} />
        <line x1={origCur.x + 3} y1={origCur.y} x2={origI.x + 3} y2={origI.y} stroke="#c87941" strokeWidth={2} />
        <text x={origI.x + 10} y={(origCur.y + origI.y) / 2 + 3}
              fontSize={12} fill="#c87941" fontFamily="monospace" fontWeight={600}>
          d<tspan fontSize={10} dy={3}>i</tspan>
        </text>
      </g>

      {/* Triada osi w {i}: zaczepiona w origI, z wzdłuż z_i, x pod kątem θ_i */}
      <Triad origin={origI} z={unitZi} x={xCurDir} label="i" />

      {/* Kąt θ_i przy początku {i} — łuk między x_{i-1} (kontynuacja) a x_i */}
      <path d={arcPath(origI, xPrevDir, xCurDir, 32)} fill="none" stroke="#a855f7" strokeWidth={1.5} />
      <text x={origI.x + 40} y={origI.y + 14} fontSize={12} fill="#a855f7" fontFamily="monospace" fontWeight={600}>
        θ<tspan fontSize={10} dy={3}>i</tspan>
      </text>

      {/* Kąt α_{i-1} przy początku {i-1} — między z_{i-1} a z_i (w dół wokół x_{i-1}) */}
      <path d={arcPath(origPrev, normalize(sub(tipPrev, origPrev)), unitZi, 30)} fill="none" stroke="#a855f7" strokeWidth={1.5} />
      <text x={origPrev.x + 36} y={origPrev.y - 26} fontSize={12} fill="#a855f7" fontFamily="monospace" fontWeight={600}>
        α<tspan fontSize={10} dy={3}>i−1</tspan>
      </text>

      {/* Opis pod rysunkiem */}
      <g transform={`translate(18, ${H - 50})`}>
        <rect x={0} y={0} width={W - 36} height={40} fill="#f8fafc" stroke="#e5e7eb" rx={6} />
        <text x={12} y={16} fontSize={11} fill="#334155" fontFamily="system-ui" fontWeight={600}>
          Układ {"{i}"} związany z ogniwem i — zorientowany tak, że ẑ<tspan fontSize={9} dy={2}>i</tspan> pokrywa się z osią przegubu i,
        </text>
        <text x={12} y={32} fontSize={11} fill="#334155" fontFamily="system-ui">
          a x̂<tspan fontSize={9} dy={2}>i−1</tspan> leży wzdłuż wspólnej normalnej łączącej oś przegubu i−1 z osią przegubu i.
        </text>
      </g>

      {/* Atrybucja */}
      <text x={W - 12} y={14} fontSize={9} fill="#94a3b8" fontFamily="system-ui" textAnchor="end">
        por. Craig, „Introduction to Robotics", wyd. 3, Fig. 3.5
      </text>
    </svg>
  );
}

// ------------------- helpers -------------------

type Pt = { x: number; y: number };

function sub(a: Pt, b: Pt): Pt { return { x: a.x - b.x, y: a.y - b.y }; }
function add(a: Pt, b: Pt): Pt { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(a: Pt, s: number): Pt { return { x: a.x * s, y: a.y * s }; }
function len(a: Pt): number { return Math.hypot(a.x, a.y); }
function normalize(a: Pt): Pt { const L = len(a) || 1; return { x: a.x / L, y: a.y / L }; }
function rotAround(v: Pt, axis: Pt, theta: number): Pt {
  // W rzucie 2D przyjmujemy, że rotacja wokół "osi z_i" przechyla kierunek
  // x_{i-1}. Dla prostoty — mały obrót 2D (pełna matematyka 3D byłaby tu
  // przesadą w rysunku dydaktycznym).
  const c = Math.cos(theta), s = Math.sin(theta);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

function arcPath(center: Pt, from: Pt, to: Pt, r: number): string {
  const a1 = Math.atan2(from.y, from.x);
  const a2 = Math.atan2(to.y, to.x);
  const x1 = center.x + r * Math.cos(a1);
  const y1 = center.y + r * Math.sin(a1);
  const x2 = center.x + r * Math.cos(a2);
  const y2 = center.y + r * Math.sin(a2);
  const sweep = ((a2 - a1 + 2 * Math.PI) % (2 * Math.PI)) > Math.PI ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
}

function Triad({ origin, z, x, label }: { origin: Pt; z: Pt; x: Pt; label: string }) {
  const len = 36;
  const zN = normalize(z);
  const xN = normalize(x);
  // y = z × x (prawoskrętność) — w 2D przybliżamy jako prostopadły w płaszczyźnie rysunku
  const yN: Pt = { x: -zN.y * 0.6 + xN.y * 0.3, y: zN.x * 0.6 - xN.x * 0.3 };
  const yLen = Math.hypot(yN.x, yN.y) || 1;
  const yNorm = { x: yN.x / yLen, y: yN.y / yLen };
  return (
    <g>
      <line x1={origin.x} y1={origin.y} x2={origin.x + zN.x * len} y2={origin.y + zN.y * len}
            stroke="#10b981" strokeWidth={2} markerEnd="url(#fa-arr)" />
      <line x1={origin.x} y1={origin.y} x2={origin.x + xN.x * len} y2={origin.y + xN.y * len}
            stroke="#ef4444" strokeWidth={2} markerEnd="url(#fa-arr-r)" />
      <line x1={origin.x} y1={origin.y} x2={origin.x + yNorm.x * len * 0.7} y2={origin.y + yNorm.y * len * 0.7}
            stroke="#3b82f6" strokeWidth={1.6} strokeDasharray="3 2" markerEnd="url(#fa-arr-b)" />
      {/* Etykiety */}
      <text x={origin.x + zN.x * (len + 12)} y={origin.y + zN.y * (len + 12) + 4}
            fontSize={11} fill="#10b981" fontFamily="monospace" fontWeight={600}>ẑ<tspan fontSize={9} dy={2}>{label}</tspan></text>
      <text x={origin.x + xN.x * (len + 12)} y={origin.y + xN.y * (len + 12) + 4}
            fontSize={11} fill="#ef4444" fontFamily="monospace" fontWeight={600}>x̂<tspan fontSize={9} dy={2}>{label}</tspan></text>
      <text x={origin.x + yNorm.x * (len * 0.8 + 8)} y={origin.y + yNorm.y * (len * 0.8 + 8) + 4}
            fontSize={11} fill="#3b82f6" fontFamily="monospace" fontWeight={600}>ŷ<tspan fontSize={9} dy={2}>{label}</tspan></text>
      <circle cx={origin.x} cy={origin.y} r={3} fill="#334155" />
    </g>
  );
}
