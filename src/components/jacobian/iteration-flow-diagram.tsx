/**
 * Schemat blokowy pojedynczej iteracji solvera Jakobianowego IK. Pokazuje
 * pięć etapów w kolejności wykonania z pętlą zwrotną i warunkiem stopu.
 */
type Block = {
  color: string;
  title: string;
  body: string | string[];
  height: number;
};

export function IterationFlowDiagram() {
  const W = 820, H = 420;
  const cx = W / 2;
  const boxW = 280;
  const gap = 18;
  const topMargin = 40;

  const blockSpecs: Block[] = [
    { color: "#0b5ed7", title: "1. FK aktualnej konfiguracji", body: "Tₖ = f(qₖ)", height: 48 },
    { color: "#ef4444", title: "2. Oblicz błąd pozy (twist)", body: "eₖ = log(T* · Tₖ⁻¹) ∈ ℝ⁶", height: 48 },
    { color: "#f59e0b", title: "3. Oblicz jakobian J(qₖ)", body: "macierz 6×n, zależna od qₖ", height: 48 },
    {
      color: "#10b981",
      title: "4. Wyznacz krok Δqₖ (zależnie od wariantu)",
      body: [
        "α · Jᵀ · e              — transpose",
        "J† · e                    — pseudoinverse",
        "Jᵀ(JJᵀ + λ²I)⁻¹ · e    — DLS",
      ],
      height: 92,
    },
    { color: "#0ea5e9", title: "5. Aktualizuj konfigurację", body: "qₖ₊₁ = qₖ + Δqₖ", height: 48 },
  ];

  // Pozycje Y obliczone kumulatywnie
  const blocks = blockSpecs.reduce<(Block & { y: number })[]>((acc, b) => {
    const y = acc.length === 0 ? topMargin : acc[acc.length - 1].y + acc[acc.length - 1].height + gap;
    acc.push({ ...b, y });
    return acc;
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      <defs>
        <marker id="flow-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#334155" />
        </marker>
        <marker id="flow-arr-loop" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#a855f7" />
        </marker>
      </defs>

      {/* Bloki */}
      {blocks.map((b, i) => (
        <g key={i}>
          <rect
            x={cx - boxW / 2} y={b.y} width={boxW} height={b.height}
            rx={8} fill="white" stroke={b.color} strokeWidth={2}
          />
          <text
            x={cx} y={b.y + 20}
            fontSize={11} fontFamily="system-ui" fill="#334155" fontWeight={600} textAnchor="middle"
          >
            {b.title}
          </text>
          {Array.isArray(b.body) ? (
            b.body.map((line, li) => (
              <text
                key={li}
                x={cx - boxW / 2 + 20}
                y={b.y + 40 + li * 16}
                fontSize={11}
                fontFamily="monospace"
                fill={b.color}
                textAnchor="start"
              >
                {line}
              </text>
            ))
          ) : (
            <text
              x={cx} y={b.y + 37}
              fontSize={11} fontFamily="monospace" fill={b.color} textAnchor="middle"
            >
              {b.body}
            </text>
          )}
          {/* Strzałka w dół do następnego bloku */}
          {i < blocks.length - 1 && (
            <line
              x1={cx} y1={b.y + b.height}
              x2={cx} y2={b.y + b.height + gap - 2}
              stroke="#334155" strokeWidth={1.4} markerEnd="url(#flow-arr)"
            />
          )}
        </g>
      ))}

      {/* Warunek stopu — diamond po prawej na wysokości bloku "błąd" */}
      <g transform={`translate(${cx + 220}, ${blocks[1].y + blocks[1].height / 2})`}>
        <path
          d="M 0 -28 L 60 0 L 0 28 L -60 0 Z"
          fill="white" stroke="#a855f7" strokeWidth={2}
        />
        <text x={0} y={-3} fontSize={11} fontFamily="monospace" fill="#a855f7" fontWeight={700} textAnchor="middle">‖eₖ‖ &lt; ε?</text>
        <text x={0} y={14} fontSize={9} fontFamily="system-ui" fill="#64748b" textAnchor="middle">warunek stopu</text>
      </g>
      {/* Strzałka od bloku 2 do warunku stopu */}
      <line
        x1={cx + boxW / 2} y1={blocks[1].y + blocks[1].height / 2}
        x2={cx + 220 - 60} y2={blocks[1].y + blocks[1].height / 2}
        stroke="#a855f7" strokeWidth={1.4} strokeDasharray="4 2"
      />
      {/* "tak — koniec" */}
      <line
        x1={cx + 280} y1={blocks[1].y + blocks[1].height / 2}
        x2={cx + 340} y2={blocks[1].y + blocks[1].height / 2}
        stroke="#10b981" strokeWidth={1.8} markerEnd="url(#flow-arr)"
      />
      <text x={cx + 310} y={blocks[1].y + blocks[1].height / 2 - 8} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700} textAnchor="middle">tak</text>
      <text x={cx + 345} y={blocks[1].y + blocks[1].height / 2 + 4} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={700}>q* = qₖ</text>

      {/* Pętla zwrotna z ostatniego bloku do pierwszego */}
      <path
        d={`M ${cx - boxW / 2} ${blocks[4].y + blocks[4].height / 2}
            L ${cx - boxW / 2 - 50} ${blocks[4].y + blocks[4].height / 2}
            L ${cx - boxW / 2 - 50} ${blocks[0].y + blocks[0].height / 2}
            L ${cx - boxW / 2 - 8} ${blocks[0].y + blocks[0].height / 2}`}
        fill="none" stroke="#a855f7" strokeWidth={1.6} markerEnd="url(#flow-arr-loop)"
      />
      <text
        x={cx - boxW / 2 - 56}
        y={(blocks[0].y + blocks[4].y + blocks[4].height) / 2}
        fontSize={11} fontFamily="monospace" fill="#a855f7" fontWeight={700} textAnchor="end"
      >
        k ← k+1
      </text>

      {/* Startowa strzałka z "q₀" */}
      <text x={cx - boxW / 2 - 80} y={blocks[0].y + blocks[0].height / 2 - 8} fontSize={11} fontFamily="monospace" fill="#334155" fontWeight={700} textAnchor="middle">start</text>
      <text x={cx - boxW / 2 - 80} y={blocks[0].y + blocks[0].height / 2 + 8} fontSize={11} fontFamily="monospace" fill="#334155" textAnchor="middle">q₀ = seed</text>
    </svg>
  );
}
