/**
 * Schemat blokowy całego algorytmu Newton-Euler — mapa pozwalająca w 5
 * sekund zobaczyć gdzie się aktualnie jest w toku wyprowadzenia.
 * Pokazuje sekwencję: wejście → forward sweep → siły bezwładności w
 * środkach mas → backward sweep → wyjście (τ).
 *
 * Każdy blok podpisany numerem kroku w module, tak żeby student widział
 * powiązanie między teorią a praktyką.
 */
export function AlgorithmBlockDiagram() {
  const W = 760, H = 220;
  const boxH = 64;
  const boxY = 80;
  const r = (n: number) => Math.round(n * 100) / 100;

  type Box = {
    x: number; w: number;
    label: string; sublabel: string;
    color: string; fill: string;
    stepRef: string;
  };
  const boxes: Box[] = [
    { x: 30,  w: 110, label: "Wejście", sublabel: "(q, q̇, q̈) + inercja", color: "#0f172a", fill: "#f1f5f9", stepRef: "krok 1" },
    { x: 160, w: 160, label: "Rekurencja w przód", sublabel: "ω, ε, a propagowane od bazy", color: "#0284c7", fill: "#e0f2fe", stepRef: "kroki 2–3" },
    { x: 340, w: 130, label: "Siły bezwładności", sublabel: "F_C = m·a_C,  N_C = I·ε + ω×Iω", color: "#dc2626", fill: "#fef2f2", stepRef: "krok 4" },
    { x: 490, w: 150, label: "Rekurencja w tył", sublabel: "f, n bilansowane od końcówki", color: "#9333ea", fill: "#faf5ff", stepRef: "krok 5" },
    { x: 660, w: 80,  label: "Wyjście τ", sublabel: "τ_i = (n_i)_z", color: "#0f172a", fill: "#fef3c7", stepRef: "krok 5" },
  ];

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 my-4 not-prose">
      <p className="font-semibold text-sm mb-1">Mapa algorytmu Newton-Euler</p>
      <p className="text-xs text-[var(--muted)] mb-3">
        Pełen pipeline w jednym widoku. Numery kroków odsyłają do paneli niżej.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-[var(--panel-border)] bg-white">
        <defs>
          <marker id="algo-arr" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#475569" />
          </marker>
        </defs>

        {boxes.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={boxY} width={b.w} height={boxH} rx={6}
                  fill={b.fill} stroke={b.color} strokeWidth={1.8} />
            <text x={r(b.x + b.w / 2)} y={r(boxY + 22)} textAnchor="middle"
                  fontSize={13} fontFamily="system-ui" fontWeight={600} fill={b.color}>
              {b.label}
            </text>
            <text x={r(b.x + b.w / 2)} y={r(boxY + 40)} textAnchor="middle"
                  fontSize={10} fontFamily="monospace" fill="#475569">
              {b.sublabel}
            </text>
            <text x={r(b.x + b.w / 2)} y={r(boxY + 56)} textAnchor="middle"
                  fontSize={9} fontFamily="monospace" fill="#94a3b8" fontStyle="italic">
              {b.stepRef}
            </text>
            {/* strzałka do kolejnego */}
            {i < boxes.length - 1 && (
              <line
                x1={r(b.x + b.w + 2)} y1={r(boxY + boxH / 2)}
                x2={r(boxes[i + 1].x - 4)} y2={r(boxY + boxH / 2)}
                stroke="#475569" strokeWidth={1.5} markerEnd="url(#algo-arr)"
              />
            )}
          </g>
        ))}

        {/* dolny tekst — co przepływa między blokami */}
        <text x={150} y={170} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#0284c7">
          q, q̇, q̈
        </text>
        <text x={330} y={170} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#0284c7">
          ω, ε, a_C
        </text>
        <text x={480} y={170} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#dc2626">
          F_C, N_C
        </text>
        <text x={650} y={170} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#9333ea">
          f, n
        </text>

        {/* dolna linia podpisu: O(n) */}
        <text x={W / 2} y={200} textAnchor="middle" fontSize={11} fontFamily="system-ui" fill="#64748b">
          Pełny koszt: <tspan fontFamily="monospace" fontWeight={600}>O(n)</tspan> dla n przegubów
          — dwa sekwencyjne przebiegi po ogniwach
        </text>
      </svg>
    </div>
  );
}
