/**
 * Statyczny diagram ilustrujący prawo cosinusów dla podproblemu 2R Pumy:
 * trójkąt bark–łokieć–nadgarstek z bokami a₂, L, D oraz wewnętrznym kątem γ
 * przy łokciu. Pokazuje skąd się bierze wzór K = a₃c₃ − d₄s₃, krok po kroku
 * od strony geometrycznej (prawo cosinusów) zamiast czysto algebraicznej.
 */
export function CosineTriangleDiagram() {
  const W = 720, H = 320;
  // Wierzchołki w przestrzeni rysunku (px)
  const A = { x: 90,  y: 240 };  // bark (Shoulder)
  const E = { x: 320, y: 70  };  // łokieć (Elbow)
  const Wp = { x: 600, y: 200 }; // wrist centre (W)

  // Helpery
  const mid = (P: typeof A, Q: typeof A) => ({ x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 });
  const ang = (P: typeof A, Q: typeof A) => Math.atan2(Q.y - P.y, Q.x - P.x);

  // Łuk kąta γ przy E (od kierunku E→A do kierunku E→W)
  const gammaR = 32; // promień łuku
  const a1 = ang(E, A);
  const a2 = ang(E, Wp);
  // mały arc path
  const arcStart = { x: E.x + gammaR * Math.cos(a1), y: E.y + gammaR * Math.sin(a1) };
  const arcEnd   = { x: E.x + gammaR * Math.cos(a2), y: E.y + gammaR * Math.sin(a2) };
  // SVG arc kierunek
  const sweep = ((a2 - a1 + 2 * Math.PI) % (2 * Math.PI)) > Math.PI ? 0 : 1;

  return (
    <div className="space-y-2 not-prose">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]"
      >
        {/* Boki trójkąta */}
        <line x1={A.x}  y1={A.y}  x2={E.x}  y2={E.y}  stroke="#0b5ed7" strokeWidth={4} />
        <line x1={E.x}  y1={E.y}  x2={Wp.x} y2={Wp.y} stroke="#10b981" strokeWidth={4} />
        <line x1={A.x}  y1={A.y}  x2={Wp.x} y2={Wp.y} stroke="#a855f7" strokeWidth={3} strokeDasharray="6 4" />

        {/* Wierzchołki */}
        <circle cx={A.x}  cy={A.y}  r={7} fill="#0b5ed7" />
        <circle cx={E.x}  cy={E.y}  r={7} fill="#334155" />
        <circle cx={Wp.x} cy={Wp.y} r={7} fill="#ef4444" />

        {/* Etykiety wierzchołków */}
        <text x={A.x - 12}  y={A.y + 22}  fontSize={13} fill="#0b5ed7" fontFamily="monospace" fontWeight={700} textAnchor="end">A — bark</text>
        <text x={E.x}       y={E.y - 18}  fontSize={13} fill="#334155" fontFamily="monospace" fontWeight={700} textAnchor="middle">E — łokieć</text>
        <text x={Wp.x + 14} y={Wp.y + 6}  fontSize={13} fill="#ef4444" fontFamily="monospace" fontWeight={700}>W — środek nadgarstka</text>

        {/* Etykiety boków */}
        <text x={mid(A, E).x - 30} y={mid(A, E).y - 6} fontSize={14} fill="#0b5ed7" fontFamily="monospace" fontWeight={700}>a₂</text>
        <text x={mid(E, Wp).x + 8} y={mid(E, Wp).y - 12} fontSize={14} fill="#10b981" fontFamily="monospace" fontWeight={700}>L</text>
        <text x={mid(A, Wp).x - 6} y={mid(A, Wp).y + 24} fontSize={14} fill="#a855f7" fontFamily="monospace" fontWeight={700}>D</text>

        {/* Łuk kąta γ przy E */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${gammaR} ${gammaR} 0 0 ${sweep} ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2.5}
        />
        <text
          x={E.x + 8}
          y={E.y + 38}
          fontSize={15}
          fill="#f59e0b"
          fontFamily="monospace"
          fontWeight={700}
        >
          γ
        </text>

        {/* Panel z formułami po prawej */}
        <g transform={`translate(${W - 290}, 10)`}>
          <rect x={0} y={0} width={280} height={150} fill="white" stroke="#e5e7eb" rx={6} />
          <text x={12} y={20} fontSize={11} fontFamily="monospace" fill="#64748b" fontWeight={600}>
            Prawo cosinusów dla △ AEW:
          </text>
          <text x={12} y={42} fontSize={12} fontFamily="monospace" fill="#0f172a">
            D² = a₂² + L² − 2·a₂·L·cos γ
          </text>
          <text x={12} y={68} fontSize={11} fontFamily="monospace" fill="#64748b" fontWeight={600}>
            Stąd:
          </text>
          <text x={12} y={86} fontSize={12} fontFamily="monospace" fill="#0f172a">
            cos γ = (a₂² + L² − D²) / (2·a₂·L)
          </text>
          <text x={12} y={114} fontSize={11} fontFamily="monospace" fill="#64748b" fontWeight={600}>
            Kąt q₃ względem γ:
          </text>
          <text x={12} y={132} fontSize={12} fontFamily="monospace" fill="#0f172a">
            q₃ = π − γ − β
          </text>
        </g>

        {/* Mały marker prostego kąta — opcjonalnie pomijamy, kąt nie jest 90° */}

        {/* Strzałki na bokach pokazujące kierunek */}
      </svg>

      <p className="text-xs text-[var(--muted)]">
        Trzy znane długości — <span className="text-[#0b5ed7] font-mono font-semibold">a₂</span> (ramię),{" "}
        <span className="text-[#10b981] font-mono font-semibold">L</span> (efektywne przedramię,{" "}
        <code>L = √(a₃² + d₄²)</code>), <span className="text-[#a855f7] font-mono font-semibold">D</span>{" "}
        (odległość bark↔nadgarstek, <code>D = √(ρ² + p_z²)</code>) — domykają trójkąt.
        Wewnętrzny kąt <span className="text-[#f59e0b] font-mono font-semibold">γ</span> przy
        łokciu wynika wprost z prawa cosinusów. Drugie rozwiązanie (elbow ↑ vs ↓) odpowiada
        odbiciu trójkąta względem boku <code>D</code> — znak <code>sin γ</code> przy
        rekonstrukcji <code>γ = atan2(±sin γ, cos γ)</code>.
      </p>
    </div>
  );
}
