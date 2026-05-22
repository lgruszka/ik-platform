/**
 * Schemat blokowy pipeline doboru napędu — 6 kroków decyzyjnych z pętlą
 * iteracyjną na końcu. Każdy blok podpisany konkretną akcją inżyniera i
 * narzędziem z którego korzysta (NE = Newton-Euler z M9, katalog = M11, ...).
 */
export function DesignPipelineFlowchart() {
  const W = 860, H = 540;
  const r = (n: number) => Math.round(n * 100) / 100;

  // Wymiary boxów: szersze + wyższe, żeby zmieścić sublabel w 2-3 liniach
  const boxW = 240;
  const boxH = 88;

  type Box = {
    x: number; y: number; w: number; h: number;
    label: string; sub: string;
    color: string; fill: string;
  };

  const ROW1_Y = 30;
  const ROW2_Y = 200;
  const DECISION_Y = 370;
  const DECISION_H = 100;

  const boxes: Box[] = [
    // Rząd 1 — niebieskie (wejście z dynamiki M9)
    { x: 20,  y: ROW1_Y, w: boxW, h: boxH, label: "1. Trajektoria reprezentatywna",
      sub: "Worst-case cyklu eksploatacyjnego: max payload, max zasięg, max prędkość",
      color: "#0284c7", fill: "#e0f2fe" },
    { x: 310, y: ROW1_Y, w: boxW, h: boxH, label: "2. Newton-Euler (M9)",
      sub: "τ(t) per napęd dla całego cyklu — forward + backward sweep",
      color: "#0284c7", fill: "#e0f2fe" },
    { x: 600, y: ROW1_Y, w: boxW, h: boxH, label: "3. 4 metryki konstrukcyjne",
      sub: "τ_peak, τ_rms, q̇_peak, P_peak — niezależne wymagania",
      color: "#0284c7", fill: "#e0f2fe" },

    // Rząd 2 — fioletowe (praca z katalogiem M11)
    { x: 600, y: ROW2_Y, w: boxW, h: boxH, label: "4. Katalog silników",
      sub: "Maxon / Kollmorgen / Allied + Harmonic Drive / Nabtesco — wybór modelu",
      color: "#9333ea", fill: "#faf5ff" },
    { x: 310, y: ROW2_Y, w: boxW, h: boxH, label: "5. Krzywa T-N + punkt pracy",
      sub: "Sprawdź czy wszystkie pary (ω(t), τ(t)) mieszczą się w obwiedni silnika",
      color: "#9333ea", fill: "#faf5ff" },
    { x: 20,  y: ROW2_Y, w: boxW, h: boxH, label: "6. Sanity check bezwładności",
      sub: "J_red = J_rotor + J_load/n² — wpływ na pasmo regulatora ω_bw",
      color: "#9333ea", fill: "#faf5ff" },

    // Decyzja — czerwona (walidacja)
    { x: 310, y: DECISION_Y, w: boxW, h: DECISION_H, label: "Decyzja końcowa",
      sub: "Czy wszystkie 4 metryki mieszczą z marginesem ≥1.5×? Czy bezwładność nie zabija pasma regulatora (≥20 Hz)? Czy budżet OK?",
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
            {/* Tytuł */}
            <text x={r(b.x + b.w / 2)} y={r(b.y + 22)} textAnchor="middle"
                  fontSize={12} fontFamily="system-ui" fontWeight={600} fill={b.color}>
              {b.label}
            </text>
            {/* Sublabel — foreignObject z HTML divem dla automatycznego wrappingu */}
            <foreignObject x={b.x + 10} y={b.y + 32} width={b.w - 20} height={b.h - 38}>
              <div style={{
                fontSize: 11,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                color: "#475569",
                textAlign: "center",
                lineHeight: 1.3,
              }}>
                {b.sub}
              </div>
            </foreignObject>
          </g>
        ))}

        {/* Strzałki sekwencyjne: 1→2→3 (poziome, w rzędzie 1) */}
        {(() => {
          const yMid = ROW1_Y + boxH / 2;
          return (
            <>
              <line x1={20 + boxW + 2} y1={yMid} x2={308} y2={yMid}
                    stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />
              <line x1={310 + boxW + 2} y1={yMid} x2={598} y2={yMid}
                    stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />
            </>
          );
        })()}

        {/* 3→4 (pionowo, zakręt po prawej) */}
        <line x1={600 + boxW / 2} y1={ROW1_Y + boxH} x2={600 + boxW / 2} y2={ROW2_Y - 2}
              stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />

        {/* 4→5→6 (poziome w drugim rzędzie, w lewo) */}
        {(() => {
          const yMid = ROW2_Y + boxH / 2;
          return (
            <>
              <line x1={598} y1={yMid} x2={310 + boxW + 2} y2={yMid}
                    stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />
              <line x1={308} y1={yMid} x2={20 + boxW + 2} y2={yMid}
                    stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)" />
            </>
          );
        })()}

        {/* 6 → decyzja (pionowo w dół, potem prawo do środka decyzji) */}
        {(() => {
          const x6Mid = 20 + boxW / 2;
          const xDecMid = 310 + boxW / 2;
          const xDecLeft = 310;
          const yBottom6 = ROW2_Y + boxH;
          const yMidDecision = DECISION_Y + DECISION_H / 2;
          return (
            <path
              d={`M ${x6Mid} ${yBottom6} L ${x6Mid} ${yMidDecision} L ${xDecLeft - 4} ${yMidDecision}`}
              fill="none" stroke="#475569" strokeWidth={1.5} markerEnd="url(#pl-arr)"
            />
          );
        })()}

        {/* Decyzja → koniec (sukces, w dół) */}
        {(() => {
          const xMid = 310 + boxW / 2;
          const yBottom = DECISION_Y + DECISION_H;
          return (
            <>
              <line x1={xMid} y1={yBottom + 2} x2={xMid} y2={yBottom + 38}
                    stroke="#10b981" strokeWidth={2} markerEnd="url(#pl-arr-green)" />
              <text x={xMid + 6} y={yBottom + 28} fontSize={12} fontFamily="monospace" fontWeight={600} fill="#10b981">
                ✓ kupujemy
              </text>
            </>
          );
        })()}

        {/* Decyzja → wstecz (porażka, pętla do kroku 1) */}
        {(() => {
          const decisionRight = 310 + boxW;
          const yMidDecision = DECISION_Y + DECISION_H / 2;
          const loopRightX = W - 20;
          const loopBottomY = H - 30;
          const targetX = 20 + boxW / 2;
          const targetTopY = ROW1_Y - 2;
          return (
            <>
              {/* z prawej krawędzi decyzji do dolnego rogu */}
              <path
                d={`M ${decisionRight + 2} ${yMidDecision} L ${loopRightX} ${yMidDecision} L ${loopRightX} ${loopBottomY}`}
                fill="none" stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4"
              />
              {/* przez dolną krawędź wstecz do kroku 1 */}
              <path
                d={`M ${loopRightX} ${loopBottomY} L ${targetX} ${loopBottomY} L ${targetX} ${targetTopY}`}
                fill="none" stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4"
                markerEnd="url(#pl-arr-red)"
              />
              {/* etykieta pętli */}
              <text x={W / 2} y={loopBottomY - 8} textAnchor="middle"
                    fontSize={12} fontFamily="monospace" fontWeight={600} fill="#dc2626">
                ✗ za mały / za drogi → przeprojektuj mechanikę albo trajektorię
              </text>
            </>
          );
        })()}
      </svg>
    </div>
  );
}
