/**
 * Schemat budowy macierzy jednorodnej 4×4 jako bloków: rotacja R (3×3) +
 * translacja t (3×1) + wiersz [0 0 0 1]. Pokazuje wizualnie dlaczego SE(3)
 * potrzebuje 16 elementów (a nie 12) — żeby kompozycja transformacji
 * sprowadzała się do mnożenia macierzy.
 */
export function HomogeneousMatrixDiagram() {
  const W = 540, H = 240;

  return (
    <div className="not-prose my-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-white">
        {/* Macierz T 4×4 — z kolorowymi blokami */}
        <g transform="translate(40, 30)">
          {/* Geometria wewnętrznych bloków:
             - R: x=28..166, y=18..126
             - t: x=172..214, y=18..126
             - [0001]: x=28..214, y=132..164
             Cała macierz: x=28..214, y=18..164
             Nawiasy: 8 px po obu stronach, 4 px ponad/poniżej. */}

          {/* Etykieta nad macierzą */}
          <text x={121} y={10} textAnchor="middle" fontSize={14} fontFamily="monospace" fontWeight={700} fill="#0f172a">
            T ∈ SE(3)
          </text>

          {/* Lewa klamra [ — SVG path, pokrywa pełną wysokość macierzy */}
          <path
            d="M 24 14 L 14 14 L 14 168 L 24 168"
            fill="none"
            stroke="#475569"
            strokeWidth={2.5}
            strokeLinejoin="miter"
          />

          {/* Blok R 3×3 — niebieski */}
          <rect x={28} y={18} width={138} height={108} fill="#dbeafe" stroke="#0284c7" strokeWidth={1.8} rx={3} />
          <text x={97} y={75} textAnchor="middle" fontSize={22} fontFamily="monospace" fontWeight={700} fill="#0284c7">
            R
          </text>
          <text x={97} y={94} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#0284c7">
            3 × 3
          </text>

          {/* Blok t 3×1 — zielony */}
          <rect x={172} y={18} width={42} height={108} fill="#dcfce7" stroke="#10b981" strokeWidth={1.8} rx={3} />
          <text x={193} y={75} textAnchor="middle" fontSize={22} fontFamily="monospace" fontWeight={700} fill="#10b981">
            t
          </text>
          <text x={193} y={94} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#10b981">
            3 × 1
          </text>

          {/* Wiersz [0 0 0 1] — szary */}
          <rect x={28} y={132} width={186} height={32} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} rx={3} />
          <text x={121} y={154} textAnchor="middle" fontSize={16} fontFamily="monospace" fill="#475569">
            0&nbsp;&nbsp;0&nbsp;&nbsp;0&nbsp;&nbsp;1
          </text>

          {/* Prawa klamra ] — SVG path symetryczna do lewej */}
          <path
            d="M 218 14 L 228 14 L 228 168 L 218 168"
            fill="none"
            stroke="#475569"
            strokeWidth={2.5}
            strokeLinejoin="miter"
          />

          {/* Etykieta wymiaru */}
          <text x={121} y={185} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#64748b">
            macierz 4 × 4
          </text>
        </g>

        {/* Legenda po prawej */}
        <g transform="translate(300, 30)">
          <rect x={0} y={0} width={210} height={180} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
          <text x={10} y={20} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#0f172a">
            Składowe T:
          </text>

          <rect x={10} y={32} width={12} height={12} fill="#dbeafe" stroke="#0284c7" />
          <text x={28} y={42} fontSize={11} fontFamily="monospace" fill="#0284c7" fontWeight={600}>R</text>
          <text x={42} y={42} fontSize={11} fontFamily="monospace" fill="#475569">— macierz rotacji</text>
          <text x={28} y={55} fontSize={9} fontFamily="monospace" fill="#94a3b8">  R ∈ SO(3), RᵀR = I</text>

          <rect x={10} y={68} width={12} height={12} fill="#dcfce7" stroke="#10b981" />
          <text x={28} y={78} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={600}>t</text>
          <text x={42} y={78} fontSize={11} fontFamily="monospace" fill="#475569">— wektor translacji</text>
          <text x={28} y={91} fontSize={9} fontFamily="monospace" fill="#94a3b8">  t ∈ ℝ³</text>

          <rect x={10} y={104} width={12} height={12} fill="#f1f5f9" stroke="#94a3b8" />
          <text x={28} y={114} fontSize={11} fontFamily="monospace" fill="#475569" fontWeight={600}>[0 0 0 1]</text>
          <text x={28} y={127} fontSize={9} fontFamily="monospace" fill="#94a3b8">  „padding" dla mnożenia</text>

          <text x={10} y={150} fontSize={10} fontFamily="monospace" fontWeight={600} fill="#0f172a">
            T = R + t złożone w jeden
          </text>
          <text x={10} y={164} fontSize={10} fontFamily="monospace" fill="#0f172a">
            obiekt → T₁·T₂ = składanie
          </text>
        </g>
      </svg>
    </div>
  );
}
