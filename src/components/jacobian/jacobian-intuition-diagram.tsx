/**
 * Intuicja fizyczna Jakobianu: pokazuje jak ruch POJEDYNCZEGO przegubu
 * (obrotowego) tłumaczy się na ruch końcówki. Schemat 2D z dwoma przegubami
 * obrotowymi; dla każdego zaznaczamy, w którym kierunku „pojechałby"
 * koniec, gdyby obrócić TYLKO ten przegub. Te dwa wektory prędkości to
 * pierwsze dwie kolumny Jakobianu.
 */
export function JacobianIntuitionDiagram() {
  const W = 720, H = 380;

  // Ramię planarne 2R — konfiguracja dobrana tak, żeby cała scena (łuki + wektory
  // prędkości) mieściła się w viewBox i nie wchodziła w pasek legendy po prawej.
  const j1 = { x: 150, y: 290 };
  const l1 = 150;
  const l2 = 120;
  const q1 = -0.55;
  const q2 = -0.55;
  const j2 = { x: j1.x + l1 * Math.cos(q1), y: j1.y + l1 * Math.sin(q1) };
  const ee = { x: j2.x + l2 * Math.cos(q1 + q2), y: j2.y + l2 * Math.sin(q1 + q2) };

  // Wektor prędkości końcówki przy obrocie tylko q1 (jednostkowa prędkość kątowa).
  // Rysunek pokazuje tylko styczny kierunek (wektor) — łuki pominięto, bo
  // krzywizna łuku okręgu zawsze kieruje się do przegubu, co wizualnie bywa
  // interpretowane jako „wygięcie w przeciwną stronę niż wektor".
  const r1 = { x: ee.x - j1.x, y: ee.y - j1.y };
  const v1 = { x: -r1.y, y: r1.x };
  const scale1 = 0.3;

  const r2 = { x: ee.x - j2.x, y: ee.y - j2.y };
  const v2 = { x: -r2.y, y: r2.x };
  const scale2 = 0.32;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      <defs>
        <marker id="jac-arr-red" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#ef4444" /></marker>
        <marker id="jac-arr-blue" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#0ea5e9" /></marker>
      </defs>

      {/* Tytuł-zdanie */}
      <text x={260} y={28} fontSize={13} fill="#334155" fontFamily="system-ui" textAnchor="middle">
        „Jeśli obrócę przegub <tspan fontFamily="monospace" fontWeight={700}>qᵢ</tspan> o maleńki kąt —
      </text>
      <text x={260} y={46} fontSize={13} fill="#334155" fontFamily="system-ui" textAnchor="middle">
        w którą stronę pojedzie końcówka?"
      </text>

      {/* Ogniwo 1 */}
      <line x1={j1.x} y1={j1.y} x2={j2.x} y2={j2.y} stroke="#52525b" strokeWidth={7} strokeLinecap="round" />
      {/* Ogniwo 2 */}
      <line x1={j2.x} y1={j2.y} x2={ee.x} y2={ee.y} stroke="#71717a" strokeWidth={6} strokeLinecap="round" />

      {/* Przegub 1 */}
      <circle cx={j1.x} cy={j1.y} r={10} fill="#facc15" stroke="#334155" strokeWidth={1.5} />
      <text x={j1.x - 18} y={j1.y + 5} fontSize={12} fill="#334155" fontFamily="monospace" fontWeight={700} textAnchor="end">q₁</text>
      {/* Przegub 2 */}
      <circle cx={j2.x} cy={j2.y} r={8} fill="#facc15" stroke="#334155" strokeWidth={1.5} />
      <text x={j2.x - 6} y={j2.y + 20} fontSize={12} fill="#334155" fontFamily="monospace" fontWeight={700} textAnchor="end">q₂</text>

      {/* Końcówka (TCP) */}
      <circle cx={ee.x} cy={ee.y} r={6} fill="#ef4444" />
      <text x={ee.x - 10} y={ee.y + 18} fontSize={11} fill="#334155" fontFamily="monospace" textAnchor="end">końcówka (TCP)</text>

      {/* Wektor v1 (kolumna J_1) — czerwony, styczny kierunek ruchu przy obrocie samego q₁ */}
      <line
        x1={ee.x} y1={ee.y}
        x2={ee.x + v1.x * scale1} y2={ee.y + v1.y * scale1}
        stroke="#ef4444" strokeWidth={2.6} markerEnd="url(#jac-arr-red)"
      />
      <text
        x={ee.x + v1.x * scale1 + 6} y={ee.y + v1.y * scale1 + 15}
        fontSize={12} fill="#ef4444" fontFamily="monospace" fontWeight={700}
      >
        J₁ · q̇₁
      </text>

      {/* Wektor v2 (kolumna J_2) — niebieski, styczny kierunek ruchu przy obrocie samego q₂ */}
      <line
        x1={ee.x} y1={ee.y}
        x2={ee.x + v2.x * scale2} y2={ee.y + v2.y * scale2}
        stroke="#0ea5e9" strokeWidth={2.6} markerEnd="url(#jac-arr-blue)"
      />
      <text
        x={ee.x + v2.x * scale2 + 6} y={ee.y + v2.y * scale2 - 6}
        fontSize={12} fill="#0ea5e9" fontFamily="monospace" fontWeight={700}
      >
        J₂ · q̇₂
      </text>

      {/* Podpowiedź pod wektorami */}
      <text
        x={(ee.x + v1.x * scale1 + ee.x + v2.x * scale2) / 2}
        y={ee.y + Math.max(v1.y * scale1, v2.y * scale2) + 40}
        fontSize={10} fill="#64748b" fontFamily="system-ui" fontStyle="italic" textAnchor="middle"
      >
        strzałki = chwilowy kierunek ruchu końcówki
      </text>
      <text
        x={(ee.x + v1.x * scale1 + ee.x + v2.x * scale2) / 2}
        y={ee.y + Math.max(v1.y * scale1, v2.y * scale2) + 54}
        fontSize={10} fill="#64748b" fontFamily="system-ui" fontStyle="italic" textAnchor="middle"
      >
        przy obrocie <tspan fontFamily="monospace" fontWeight={700}>TYLKO</tspan> tego przegubu
      </text>

      {/* Box po prawej z objaśnieniem */}
      <g transform={`translate(${W - 220}, 70)`}>
        <rect x={0} y={0} width={204} height={228} fill="#f8fafc" stroke="#e5e7eb" rx={6} />
        <text x={10} y={18} fontSize={11} fill="#334155" fontFamily="system-ui" fontWeight={600}>
          Każda kolumna jakobianu =
        </text>
        <text x={10} y={33} fontSize={11} fill="#334155" fontFamily="system-ui" fontWeight={600}>
          wkład jednego przegubu
        </text>
        <text x={10} y={48} fontSize={11} fill="#334155" fontFamily="system-ui" fontWeight={600}>
          do ruchu końcówki.
        </text>
        <line x1={10} y1={60} x2={194} y2={60} stroke="#e5e7eb" />
        <text x={10} y={78} fontSize={10.5} fill="#ef4444" fontFamily="monospace" fontWeight={700}>Kolumna J₁:</text>
        <text x={10} y={94} fontSize={10} fill="#334155" fontFamily="system-ui">prędkość końcówki,</text>
        <text x={10} y={108} fontSize={10} fill="#334155" fontFamily="system-ui">gdy q̇₁ = 1, reszta = 0</text>
        <text x={10} y={134} fontSize={10.5} fill="#0ea5e9" fontFamily="monospace" fontWeight={700}>Kolumna J₂:</text>
        <text x={10} y={150} fontSize={10} fill="#334155" fontFamily="system-ui">prędkość końcówki,</text>
        <text x={10} y={164} fontSize={10} fill="#334155" fontFamily="system-ui">gdy q̇₂ = 1, reszta = 0</text>
        <line x1={10} y1={176} x2={194} y2={176} stroke="#e5e7eb" />
        <text x={10} y={194} fontSize={10} fill="#64748b" fontFamily="system-ui" fontStyle="italic">Suma wkładów:</text>
        <text x={10} y={212} fontSize={11} fill="#334155" fontFamily="monospace" fontWeight={700}>ξ = J₁q̇₁ + J₂q̇₂</text>
        <text x={10} y={224} fontSize={11} fill="#334155" fontFamily="monospace" fontWeight={700}>   = J(q) · q̇</text>
      </g>
    </svg>
  );
}
