import { Math as M } from "@/components/ui/math";

/**
 * Boks wyjaśniający kluczową obserwację Newton-Eulera: kinematyka i dynamika
 * dają się rozdzielić na dwa niezależne O(n) przebiegi, bo siły bezwładności
 * ogniwa zależą TYLKO od jego kinematyki (ω, ε, a), a kinematyka NIE ZALEŻY
 * od sił. Bez tej obserwacji student widzi tylko algorytmiczne 'najpierw to,
 * potem to' bez intuicji dlaczego.
 *
 * Diagram pokazuje rozdzielenie graficznie: górny pasek z 6 ogniwami,
 * strzałki w prawo (forward — informacja kinematyczna), strzałki w lewo
 * (backward — informacja siłowa), w środku „F_C, N_C — lokalnie wyliczane".
 */
export function WhyTwoSweeps() {
  const W = 720;
  const H = 220;
  const linkCount = 6;
  const linkWidth = 70;
  const linkGap = 18;
  const linksTotalWidth = linkCount * linkWidth + (linkCount - 1) * linkGap;
  const x0 = (W - linksTotalWidth) / 2;
  const linkY = 90;
  const linkH = 28;

  const linkX = (i: number) => x0 + i * (linkWidth + linkGap);

  return (
    <div className="rounded-lg border-l-4 border-sky-500 bg-sky-50 dark:bg-sky-950/20 px-5 py-4 my-4 not-prose">
      <p className="font-semibold mb-2">Dlaczego dwa przebiegi (forward + backward)?</p>
      <p className="text-sm text-[var(--foreground)] mb-3">
        Kluczowa obserwacja Newton-Eulera, dzięki której cały algorytm jest{" "}
        <M tex="O(n)" /> zamiast <M tex="O(n^3)" />:
      </p>
      <ul className="text-sm text-[var(--foreground)] list-disc pl-5 space-y-1 mb-3">
        <li>
          Siły bezwładności ogniwa zależą <strong>tylko od jego własnej kinematyki</strong>{" "}
          (<M tex="\mathbf{F}_{Ci} = m_i\mathbf{a}_{Ci}" />,{" "}
          <M tex="\mathbf{N}_{Ci} = I\boldsymbol\varepsilon + \boldsymbol\omega\times I\boldsymbol\omega" />).
        </li>
        <li>
          Kinematyka ogniwa <strong>nie zależy od żadnych sił</strong> — wynika
          tylko z <M tex="(q, \dot q, \ddot q)" /> i propagacji geometrycznej
          od bazy.
        </li>
      </ul>
      <p className="text-sm text-[var(--foreground)] mb-3">
        Te dwa fakty pozwalają rozdzielić problem na <strong>dwa niezależne
        przebiegi</strong>:
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-[var(--panel-border)] bg-white">
        {/* Górna strzałka — forward sweep */}
        <defs>
          <marker id="arrow-fwd" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#0ea5e9" />
          </marker>
          <marker id="arrow-bwd" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#a855f7" />
          </marker>
        </defs>

        <text x={W / 2} y={28} textAnchor="middle" fontSize={13} fontFamily="system-ui" fontWeight={600} fill="#0ea5e9">
          1. Rekurencja w przód · kinematyka (q, q̇, q̈) → ω, ε, a, a_C
        </text>
        <line x1={x0 - 30} y1={48} x2={x0 + linksTotalWidth + 20} y2={48}
              stroke="#0ea5e9" strokeWidth={2} markerEnd="url(#arrow-fwd)" />
        <text x={x0 - 35} y={52} textAnchor="end" fontSize={11} fontFamily="monospace" fill="#0ea5e9">baza</text>

        {/* Ogniwa */}
        {Array.from({ length: linkCount }, (_, i) => (
          <g key={i}>
            <rect
              x={linkX(i)} y={linkY} width={linkWidth} height={linkH}
              fill="#f1f5f9" stroke="#64748b" strokeWidth={1.5} rx={3}
            />
            <text x={linkX(i) + linkWidth / 2} y={linkY + 18} textAnchor="middle"
                  fontSize={12} fontFamily="monospace" fill="#334155">
              ogniwo {i + 1}
            </text>
            <text x={linkX(i) + linkWidth / 2} y={linkY - 6} textAnchor="middle"
                  fontSize={10} fontFamily="monospace" fill="#0ea5e9">
              ω,ε,a
            </text>
            <text x={linkX(i) + linkWidth / 2} y={linkY + linkH + 14} textAnchor="middle"
                  fontSize={10} fontFamily="monospace" fill="#a855f7">
              f,n,τ
            </text>
          </g>
        ))}

        <text x={x0 + linksTotalWidth + 25} y={52} textAnchor="start" fontSize={11} fontFamily="monospace" fill="#0ea5e9">koniec</text>

        {/* Dolna strzałka — backward sweep */}
        <line x1={x0 + linksTotalWidth + 20} y1={170} x2={x0 - 30} y2={170}
              stroke="#a855f7" strokeWidth={2} markerEnd="url(#arrow-bwd)" />
        <text x={W / 2} y={195} textAnchor="middle" fontSize={13} fontFamily="system-ui" fontWeight={600} fill="#a855f7">
          2. Rekurencja w tył · siły f, n na podstawie F_C, N_C z każdego ogniwa → τ
        </text>
        <text x={x0 + linksTotalWidth + 25} y={174} textAnchor="start" fontSize={11} fontFamily="monospace" fill="#a855f7">koniec</text>
        <text x={x0 - 35} y={174} textAnchor="end" fontSize={11} fontFamily="monospace" fill="#a855f7">baza</text>
      </svg>

      <p className="text-sm text-[var(--foreground)] mt-3 mb-0">
        Gdyby siły i kinematyka były <em>wzajemnie sprzężone</em>, musielibyśmy
        rozwiązywać układ <M tex="6n" /> równań <em>jednocześnie</em> — koszt{" "}
        <M tex="O(n^3)" />. Tu rozdzielenie daje{" "}
        <strong>dwa kolejne, sekwencyjne przebiegi po n ogniwach</strong>,
        czyli <M tex="O(n)" />. To samo sformułowanie Lagrange'a (dla porównania)
        produkuje gęstą macierz <M tex="M(q)\in\mathbb R^{n\times n}" /> i wymaga
        inwersji — szybsze i prostsze w pisaniu jest NE.
      </p>
    </div>
  );
}
