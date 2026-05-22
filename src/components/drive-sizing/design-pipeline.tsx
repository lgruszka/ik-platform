import { Math as M } from "@/components/ui/math";

/**
 * Schemat blokowy pipeline doboru napędu — 6 kroków decyzyjnych z pętlą
 * iteracyjną na końcu. Każdy blok podpisany konkretną akcją inżyniera i
 * narzędziem z którego korzysta (NE = Newton-Euler z M9, katalog = M11, ...).
 */
export function DesignPipelineFlowchart() {
  const W = 760, H = 440;
  const r = (n: number) => Math.round(n * 100) / 100;

  type Box = {
    x: number; y: number; w: number; h: number;
    label: string; sub: string;
    color: string; fill: string;
  };
  const boxes: Box[] = [
    { x: 30,  y: 30,  w: 220, h: 60, label: "1. Trajektoria reprezentatywna",
      sub: "Worst-case cyklu: max payload, max zasięg, max prędkość",
      color: "#0284c7", fill: "#e0f2fe" },
    { x: 280, y: 30,  w: 220, h: 60, label: "2. Newton-Euler",
      sub: "τ(t) per napęd dla całego cyklu (M9)",
      color: "#0284c7", fill: "#e0f2fe" },
    { x: 530, y: 30,  w: 200, h: 60, label: "3. 4 metryki konstrukcyjne",
      sub: "τ_peak, τ_rms, q̇_peak, P_peak",
      color: "#0284c7", fill: "#e0f2fe" },

    { x: 530, y: 160, w: 200, h: 60, label: "4. Katalog silników",
      sub: "Maxon / Kollmorgen / Allied + Harmonic Drive",
      color: "#9333ea", fill: "#faf5ff" },
    { x: 280, y: 160, w: 220, h: 60, label: "5. Krzywa T-N + punkt pracy",
      sub: "Wpasować trajektorię w obwiednię silnika",
      color: "#9333ea", fill: "#faf5ff" },
    { x: 30,  y: 160, w: 220, h: 60, label: "6. Sanity check bezwładności",
      sub: "J_red wpływ na pasmo regulatora",
      color: "#9333ea", fill: "#faf5ff" },

    { x: 280, y: 290, w: 220, h: 90, label: "Decyzja",
      sub: "Czy 4 metryki mieszczą z marginesem ≥1.5×? Czy bezwładność nie zabija pasma?",
      color: "#dc2626", fill: "#fef2f2" },
  ];

  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 my-4 not-prose">
      <p className="font-semibold text-sm mb-1">Pipeline doboru napędu — 6 kroków + decyzja</p>
      <p className="text-xs text-[var(--muted)] mb-3">
        Niebieskie = wejście z dynamiki (M9). Fioletowe = praca z katalogiem (M11).
        Czerwone = walidacja końcowa. Pętla iteracyjna: nie udało się → wracamy do projektu.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-[var(--panel-border)] bg-white">
        <defs>
          <marker id="pl-arr" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#475569" />
          </marker>
          <marker id="pl-arr-red" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#dc2626" />
          </marker>
          <marker id="pl-arr-green" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#10b981" />
          </marker>
        </defs>

        {boxes.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={6}
                  fill={b.fill} stroke={b.color} strokeWidth={1.8} />
            <text x={r(b.x + b.w / 2)} y={r(b.y + 22)} textAnchor="middle"
                  fontSize={12} fontFamily="system-ui" fontWeight={600} fill={b.color}>
              {b.label}
            </text>
            <foreignObject x={b.x + 8} y={b.y + 28} width={b.w - 16} height={b.h - 32}>
              <div style={{
                fontSize: 10, fontFamily: "system-ui", color: "#475569",
                textAlign: "center", lineHeight: 1.2,
              }}>
                {b.sub}
              </div>
            </foreignObject>
          </g>
        ))}

        {/* Strzałki sekwencyjne: 1→2→3 (poziome) */}
        <line x1={250} y1={60} x2={278} y2={60} stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />
        <line x1={500} y1={60} x2={528} y2={60} stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />

        {/* 3→4 (pionowo, zakręt) */}
        <line x1={630} y1={90} x2={630} y2={158} stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />

        {/* 4→5→6 (poziome w drugim rzędzie, w lewo) */}
        <line x1={528} y1={190} x2={500} y2={190} stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />
        <line x1={278} y1={190} x2={250} y2={190} stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />

        {/* 6 → decyzja (pionowo w dół, potem prawo) */}
        <path d="M 140 220 L 140 320 L 278 320" fill="none" stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />

        {/* Decyzja → koniec (sukces, w dół) */}
        <line x1={390} y1={380} x2={390} y2={420} stroke="#10b981" strokeWidth={2} markerEnd="url(#pl-arr-green)" />
        <text x={395} y={405} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#10b981">✓ kupujemy</text>

        {/* Decyzja → wstecz (porażka, pętla do 1) */}
        <path d="M 500 335 L 720 335 L 720 410 L 720 410" fill="none"
              stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4" />
        <path d="M 720 410 L 140 410 L 140 90" fill="none"
              stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#pl-arr-red)" />
        <text x={500} y={395} textAnchor="start" fontSize={11} fontFamily="monospace" fontWeight={600} fill="#dc2626">
          ✗ za mały / za drogi → przeprojektuj mechanikę albo trajektorię
        </text>
      </svg>
    </div>
  );
}
