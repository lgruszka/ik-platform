/**
 * Trzy SVG-y obok siebie, każde ilustruje inną geometrię nadgarstka 6-DOF:
 *   FORMA A — 3 osie schodzą w jednym punkcie (PUMA 560, Stäubli, ABB IRB)
 *   FORMA B — 3 osie wzajemnie równoległe (UR5/UR10/UR16, ES5)
 *   BRAK    — żadna z powyższych (rzadkie, wymaga metody Raghavan-Roth)
 *
 * Cel pedagogiczny: po obejrzeniu tego student widzi natychmiast czemu dwa
 * pierwsze typy mają zamknięte IK a trzeci nie, oraz jak różne są geometrie
 * mimo tej samej liczby DOF.
 */
export function PieperFormsComparison() {
  return (
    <div className="not-prose my-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <FormCard
          label="Forma A"
          subtitle="3 osie schodzą w jednym punkcie"
          examples="PUMA 560, Stäubli TX, ABB IRB"
          color="#0284c7"
          fill="#e0f2fe"
          renderSvg={(W, H) => <FormASvg W={W} H={H} />}
        />
        <FormCard
          label="Forma B"
          subtitle="3 osie wzajemnie równoległe"
          examples="UR5/UR10/UR16, ES5, KUKA iiwa (częściowo)"
          color="#9333ea"
          fill="#faf5ff"
          renderSvg={(W, H) => <FormBSvg W={W} H={H} />}
        />
        <FormCard
          label="Brak warunku Piepera"
          subtitle="Ani A, ani B"
          examples="Manipulatory eksperymentalne — wymagana metoda Raghavan–Roth (równanie 16. stopnia)"
          color="#dc2626"
          fill="#fef2f2"
          renderSvg={(W, H) => <FormNoneSvg W={W} H={H} />}
        />
      </div>
      <p className="text-xs text-[var(--muted)] mt-3">
        <strong>Zasada Piepera (1968):</strong> jeśli manipulator 6-DOF ma 3
        kolejne osie spełniające A <em>lub</em> B, to istnieje rozwiązanie zamknięte IK
        (dekompozycja na 3+3 niewiadome). To <strong>warunek wystarczający</strong>,
        nie konieczny — manipulatory bez Piepera <em>też</em> mogą mieć zamknięte
        rozwiązania, ale wymagają zaawansowanych metod (rezultanty, metoda Raghavan–Roth).
      </p>
    </div>
  );
}

function FormCard({
  label, subtitle, examples, color, fill, renderSvg,
}: {
  label: string; subtitle: string; examples: string;
  color: string; fill: string;
  renderSvg: (W: number, H: number) => React.ReactNode;
}) {
  return (
    <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: color }}>
      <div className="px-3 py-2" style={{ backgroundColor: fill }}>
        <p className="font-semibold text-sm" style={{ color }}>{label}</p>
        <p className="text-xs text-[var(--foreground)] leading-tight">{subtitle}</p>
      </div>
      <div className="bg-white">
        <svg viewBox="0 0 220 200" className="w-full">
          {renderSvg(220, 200)}
        </svg>
      </div>
      <p className="text-[11px] text-[var(--muted)] px-3 py-2 leading-snug border-t" style={{ borderColor: "var(--panel-border)" }}>
        <strong>Przykłady:</strong> {examples}
      </p>
    </div>
  );
}

function FormASvg({ W, H }: { W: number; H: number }) {
  const cx = W / 2 + 10;
  const cy = H / 2 + 10;
  // ramię (od bazy do nadgarstka)
  return (
    <g>
      {/* podstawa */}
      <rect x={W / 2 - 25} y={H - 24} width={50} height={14} fill="#475569" />
      {/* ramię */}
      <line x1={W / 2} y1={H - 24} x2={cx - 40} y2={cy + 20} stroke="#64748b" strokeWidth={6} />
      {/* przedramię */}
      <line x1={cx - 40} y1={cy + 20} x2={cx} y2={cy} stroke="#64748b" strokeWidth={6} />
      {/* punkt przecięcia 3 osi nadgarstka — wyróżniony */}
      <circle cx={cx} cy={cy} r={10} fill="#fef3c7" stroke="#0284c7" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={3} fill="#0284c7" />
      {/* 3 osie schodzące w punkt */}
      <line x1={cx - 35} y1={cy + 35} x2={cx + 35} y2={cy - 35}
            stroke="#0284c7" strokeWidth={2} />
      <line x1={cx - 35} y1={cy - 30} x2={cx + 35} y2={cy + 30}
            stroke="#0284c7" strokeWidth={2} />
      <line x1={cx} y1={cy - 38} x2={cx} y2={cy + 38}
            stroke="#0284c7" strokeWidth={2} />
      {/* etykieta */}
      <text x={cx + 18} y={cy + 4} fontSize={11} fontFamily="monospace" fontWeight={700} fill="#0284c7">
        ●
      </text>
      <text x={cx + 30} y={cy - 5} fontSize={9} fontFamily="monospace" fill="#0284c7" fontWeight={600}>
        3 osie
      </text>
      <text x={cx + 30} y={cy + 5} fontSize={9} fontFamily="monospace" fill="#0284c7" fontWeight={600}>
        w 1 punkcie
      </text>
      {/* TCP */}
      <circle cx={cx + 30} cy={cy + 30} r={4} fill="#ef4444" />
      <text x={cx + 38} y={cy + 33} fontSize={9} fontFamily="monospace" fill="#ef4444">TCP</text>
    </g>
  );
}

function FormBSvg({ W, H }: { W: number; H: number }) {
  // ramię z 3 równoległymi osiami obrotu (q2 q3 q4 — wszystkie poziome)
  return (
    <g>
      {/* podstawa */}
      <rect x={W / 2 - 25} y={H - 24} width={50} height={14} fill="#475569" />
      {/* oś q1 (pionowa) */}
      <line x1={W / 2} y1={H - 10} x2={W / 2} y2={H - 50} stroke="#475569" strokeWidth={4} />
      {/* ramię q2 — pierwsza pozioma oś */}
      <circle cx={W / 2} cy={H - 50} r={6} fill="#9333ea" />
      <line x1={W / 2 - 20} y1={H - 50} x2={W / 2 + 20} y2={H - 50}
            stroke="#9333ea" strokeWidth={2.5} />
      <line x1={W / 2} y1={H - 50} x2={W / 2 + 35} y2={H - 85} stroke="#64748b" strokeWidth={5} />
      {/* oś q3 — druga pozioma, równoległa */}
      <circle cx={W / 2 + 35} cy={H - 85} r={6} fill="#9333ea" />
      <line x1={W / 2 + 15} y1={H - 85} x2={W / 2 + 55} y2={H - 85}
            stroke="#9333ea" strokeWidth={2.5} />
      <line x1={W / 2 + 35} y1={H - 85} x2={W / 2 + 70} y2={H - 120} stroke="#64748b" strokeWidth={5} />
      {/* oś q4 — trzecia pozioma, równoległa */}
      <circle cx={W / 2 + 70} cy={H - 120} r={6} fill="#9333ea" />
      <line x1={W / 2 + 50} y1={H - 120} x2={W / 2 + 90} y2={H - 120}
            stroke="#9333ea" strokeWidth={2.5} />
      {/* nadgarstek + TCP */}
      <line x1={W / 2 + 70} y1={H - 120} x2={W / 2 + 90} y2={H - 145} stroke="#64748b" strokeWidth={4} />
      <circle cx={W / 2 + 90} cy={H - 145} r={4} fill="#ef4444" />
      {/* etykieta */}
      <text x={20} y={40} fontSize={10} fontFamily="monospace" fill="#9333ea" fontWeight={700}>
        q₂ ∥ q₃ ∥ q₄
      </text>
      <text x={20} y={54} fontSize={9} fontFamily="monospace" fill="#9333ea">
        równoległe osie
      </text>
    </g>
  );
}

function FormNoneSvg({ W, H }: { W: number; H: number }) {
  // chaotyczne osie — nie schodzą i nie są równoległe
  return (
    <g>
      <rect x={W / 2 - 25} y={H - 24} width={50} height={14} fill="#475569" />
      <line x1={W / 2} y1={H - 24} x2={W / 2 - 30} y2={H - 70} stroke="#64748b" strokeWidth={5} />
      {/* 3 osie nadgarstka — pod różnymi kątami, nie schodzą */}
      <line x1={W / 2 - 30} y1={H - 70} x2={W / 2 + 10} y2={H - 100} stroke="#64748b" strokeWidth={5} />
      <line x1={W / 2 + 10} y1={H - 100} x2={W / 2 + 50} y2={H - 90} stroke="#64748b" strokeWidth={5} />
      <line x1={W / 2 + 50} y1={H - 90} x2={W / 2 + 70} y2={H - 130} stroke="#64748b" strokeWidth={5} />

      {/* osie obrotu w różnych kierunkach */}
      <line x1={W / 2 - 12} y1={H - 96} x2={W / 2 + 32} y2={H - 96}
            stroke="#dc2626" strokeWidth={2} />
      <line x1={W / 2 + 40} y1={H - 78} x2={W / 2 + 60} y2={H - 110}
            stroke="#dc2626" strokeWidth={2} />
      <line x1={W / 2 + 50} y1={H - 130} x2={W / 2 + 92} y2={H - 130}
            stroke="#dc2626" strokeWidth={2} />

      <circle cx={W / 2 + 70} cy={H - 130} r={4} fill="#ef4444" />

      <text x={20} y={40} fontSize={10} fontFamily="monospace" fill="#dc2626" fontWeight={700}>
        ani nie schodzą,
      </text>
      <text x={20} y={54} fontSize={10} fontFamily="monospace" fill="#dc2626" fontWeight={700}>
        ani równoległe
      </text>
    </g>
  );
}
