/**
 * Wizualizacja idei IKFlow / normalizing flow:
 *   - lewo: chmurka punktów z gaussowskiego szumu (rozproszone wszędzie)
 *   - środek: sieć (czarny prostokąt) — uczone odwzorowanie
 *   - prawo: te same punkty po przejściu przez sieć — dwa wyraźne klastry
 *     w miejscach poprawnych q (np. „shoulder right" i „shoulder left")
 *
 * Idea: sieć uczy się odwracać szum. Wystarczy losować z gaussa, a sieć
 * zamienia każdy punkt w jedną z poprawnych odpowiedzi IK.
 */
export function NormalizingFlowDiagram() {
  const W = 720, H = 320;

  // Deterministyczny generator pseudo-losowych punktów (mulberry32)
  function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let x = Math.imul(s ^ (s >>> 15), 1 | s);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Box-Muller dla gaussa
  function gauss(rand: () => number): [number, number] {
    const u = Math.max(1e-6, rand()), v = rand();
    return [Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v),
            Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v)];
  }

  const N = 60;
  const r = rng(123);
  const noisePoints: [number, number][] = [];
  const qPoints: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const [zx, zy] = gauss(r);
    noisePoints.push([zx, zy]);
    // „Sieć" — w naszej wizualizacji zamienia każdy punkt na jeden z dwóch klastrów
    // zależnie od znaku zx
    const cluster = zx > 0 ? 1 : -1;
    qPoints.push([cluster * 1.5 + zx * 0.18, zy * 0.25]);
  }

  // Lewa chmurka (szum) — środek (boxLeft.cx, boxLeft.cy), skala scaleL
  const boxLeft = { cx: 130, cy: 170, w: 180, h: 180 };
  const scaleL = 30;
  // Prawa chmurka (q) — środek
  const boxRight = { cx: 600, cy: 170, w: 200, h: 180 };
  const scaleR = 38;

  // Box „sieć"
  const network = { cx: 360, cy: 170, w: 110, h: 80 };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      <text x={W / 2} y={26} fontSize={13} fontFamily="system-ui" fill="#334155" textAnchor="middle" fontWeight={600}>
        IKFlow: sieć uczy się odwracać losowy szum w poprawne rozwiązania IK
      </text>

      {/* Lewa ramka — przestrzeń szumu */}
      <rect x={boxLeft.cx - boxLeft.w/2} y={boxLeft.cy - boxLeft.h/2} width={boxLeft.w} height={boxLeft.h}
            rx={6} fill="#f0f9ff" stroke="#0ea5e9" strokeWidth={1.5} />
      <text x={boxLeft.cx} y={boxLeft.cy - boxLeft.h/2 - 6} fontSize={11} fontFamily="monospace" fill="#0ea5e9" fontWeight={700} textAnchor="middle">
        z ~ N(0, I)
      </text>
      <text x={boxLeft.cx} y={boxLeft.cy + boxLeft.h/2 + 16} fontSize={10} fontFamily="system-ui" fill="#0ea5e9" textAnchor="middle">
        gaussowski szum
      </text>
      {noisePoints.map(([zx, zy], i) => (
        <circle key={i} cx={boxLeft.cx + zx * scaleL} cy={boxLeft.cy + zy * scaleL} r={2.5} fill="#0ea5e9" />
      ))}

      {/* Sieć — czarna ramka */}
      <rect x={network.cx - network.w/2} y={network.cy - network.h/2} width={network.w} height={network.h}
            rx={8} fill="#1e293b" stroke="#0f172a" strokeWidth={2} />
      <text x={network.cx} y={network.cy - 10} fontSize={12} fontFamily="system-ui" fill="white" fontWeight={600} textAnchor="middle">
        sieć IKFlow
      </text>
      <text x={network.cx} y={network.cy + 6} fontSize={10} fontFamily="monospace" fill="#cbd5e1" textAnchor="middle">
        g_θ(z; T)
      </text>
      <text x={network.cx} y={network.cy + 22} fontSize={9} fontFamily="system-ui" fill="#cbd5e1" textAnchor="middle">
        (warunkowa na pozie T)
      </text>

      {/* Strzałki */}
      <line x1={boxLeft.cx + boxLeft.w/2 + 4} y1={boxLeft.cy} x2={network.cx - network.w/2 - 4} y2={network.cy}
            stroke="#64748b" strokeWidth={1.6} markerEnd="url(#nf-arr)" />
      <line x1={network.cx + network.w/2 + 4} y1={network.cy} x2={boxRight.cx - boxRight.w/2 - 4} y2={network.cy}
            stroke="#64748b" strokeWidth={1.6} markerEnd="url(#nf-arr)" />
      <defs>
        <marker id="nf-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#64748b" />
        </marker>
      </defs>

      {/* Prawa ramka — przestrzeń konfiguracji */}
      <rect x={boxRight.cx - boxRight.w/2} y={boxRight.cy - boxRight.h/2} width={boxRight.w} height={boxRight.h}
            rx={6} fill="#f0fdf4" stroke="#10b981" strokeWidth={1.5} />
      <text x={boxRight.cx} y={boxRight.cy - boxRight.h/2 - 6} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700} textAnchor="middle">
        q = g_θ⁻¹(z; T)
      </text>
      <text x={boxRight.cx} y={boxRight.cy + boxRight.h/2 + 16} fontSize={10} fontFamily="system-ui" fill="#10b981" textAnchor="middle">
        poprawne rozwiązania IK
      </text>
      {qPoints.map(([qx, qy], i) => {
        const cluster = noisePoints[i][0] > 0 ? 1 : -1;
        return (
          <circle key={i}
            cx={boxRight.cx + qx * scaleR} cy={boxRight.cy + qy * scaleR}
            r={2.5} fill={cluster > 0 ? "#10b981" : "#a855f7"} />
        );
      })}
      <text x={boxRight.cx + 1.5*scaleR} y={boxRight.cy - 50} fontSize={10} fontFamily="monospace" fill="#10b981" fontWeight={600} textAnchor="middle">
        shoulder R
      </text>
      <text x={boxRight.cx - 1.5*scaleR} y={boxRight.cy - 50} fontSize={10} fontFamily="monospace" fill="#a855f7" fontWeight={600} textAnchor="middle">
        shoulder L
      </text>
    </svg>
  );
}
