/**
 * Wzorzec liczbowy dla M9 — algorytm Newton-Euler dla konkretnego scenariusza
 * na ES5. Wszystkie wartości baked-in (server-renderable, brak hydration risk).
 *
 * Scenariusz:
 *   q   = (0, π/4, π/4, 0, π/2, 0)
 *   q̇   = (0.5, 0, 0, 0, 0, 0) rad/s   (obrót pierwszej osi)
 *   q̈   = (0, 0, 0, 0, 0, 0) rad/s²
 *
 * Cel pedagogiczny: student implementujący NE może porównać własny wynik
 * linijka-po-linijce z wartościami tutaj. Algorytm wykorzystuje konwencję
 * Craig'a z a₀ = -g·ẑ (grawitacja propagowana w forward sweep).
 */

import { Math as M } from "@/components/ui/math";

const NUM = {
  q_deg: [0, 45, 45, 0, 90, 0],
  qd: [0.5, 0, 0, 0, 0, 0],
  qdd: [0, 0, 0, 0, 0, 0],
  // Forward sweep — wybrane ogniwa
  link1: {
    omega: [0.0000, 0.0000, 0.5000],
    a:     [0.0000, 0.0000, 9.8100],
    aCom:  [0.0000, 0.0020, 9.8100],
    FC:    [0.0000, 0.0079, 38.5631],
  },
  link2: {
    omega: [0.3536, 0.3536, 0.0000],
    a:     [6.9367, 6.9367, 0.0000],
    aCom:  [6.9108, 6.9626, -0.0310],
    FC:    [72.1630, 72.7034, -0.3237],
  },
  link3: {
    omega: [0.5000, 0.0000, 0.0000],
    a:     [9.8100, 0.0751, 0.0000],
    aCom:  [9.8100, 0.0751, -0.0045],
    FC:    [27.9193, 0.2138, -0.0128],
  },
  // Backward sweep — momenty napędowe
  torques: [-0.0000, 31.2022, -1.3255, -1.4497, 0.0010, 0.0000],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
      <h4 className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}

function VecRow({ label, value, unit }: { label: string; value: number[]; unit?: string }) {
  return (
    <div className="grid grid-cols-[3rem_1fr_3rem] gap-x-2 text-xs items-baseline">
      <span className="text-[var(--muted)] font-mono">{label}</span>
      <span className="font-mono tabular-nums">
        ({value.map((v) => v.toFixed(4)).join(",  ")})
      </span>
      <span className="text-[10px] text-[var(--muted)] text-right">{unit}</span>
    </div>
  );
}

export function NumericalExampleM9() {
  return (
    <div className="not-prose space-y-3">
      <Section title="Scenariusz testowy">
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs font-mono">
          <span className="text-[var(--muted)]">q  [°]:</span>
          <span>({NUM.q_deg.join(",  ")})</span>
          <span className="text-[var(--muted)]">q̇  [rad/s]:</span>
          <span>({NUM.qd.map((v) => v.toFixed(2)).join(",  ")})</span>
          <span className="text-[var(--muted)]">q̈  [rad/s²]:</span>
          <span>({NUM.qdd.map((v) => v.toFixed(2)).join(",  ")})</span>
          <span className="text-[var(--muted)] mt-2">Inicjalizacja:</span>
          <span className="mt-2">⁰a₀ = (0, 0, +9.81) m/s² <span className="text-[var(--muted)]">(konwencja Craig: -g·ẑ z g&gt;0 dla z_world wzwyż)</span></span>
        </div>
      </Section>

      <div className="grid gap-3 md:grid-cols-3">
        <Section title="Rekurencja w przód · ogniwo 1">
          <div className="space-y-1">
            <VecRow label="ω₁" value={NUM.link1.omega} unit="rad/s" />
            <VecRow label="a₁" value={NUM.link1.a} unit="m/s²" />
            <VecRow label="aᶜ₁" value={NUM.link1.aCom} unit="m/s²" />
            <VecRow label="Fᶜ₁" value={NUM.link1.FC} unit="N" />
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-2 leading-tight">
            ω₁ = (0, 0, q̇₁) bo pierwszy przegub obraca się wokół osi z bazy.
            a₁ ≈ (0, 0, +g) — grawitacja w lokalnym układzie 1 (oś z₁ pokrywa
            się z osią z bazy).
          </p>
        </Section>

        <Section title="Rekurencja w przód · ogniwo 2">
          <div className="space-y-1">
            <VecRow label="ω₂" value={NUM.link2.omega} unit="rad/s" />
            <VecRow label="a₂" value={NUM.link2.a} unit="m/s²" />
            <VecRow label="aᶜ₂" value={NUM.link2.aCom} unit="m/s²" />
            <VecRow label="Fᶜ₂" value={NUM.link2.FC} unit="N" />
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-2 leading-tight">
            ω₂ ma niezerowe x i y bo q̇₁ z układu 1 zostaje obrócone przez
            R^2_1 (α₁ = π/2). Stąd efekty Coriolisa w propagacji a₂.
          </p>
        </Section>

        <Section title="Rekurencja w przód · ogniwo 3">
          <div className="space-y-1">
            <VecRow label="ω₃" value={NUM.link3.omega} unit="rad/s" />
            <VecRow label="a₃" value={NUM.link3.a} unit="m/s²" />
            <VecRow label="aᶜ₃" value={NUM.link3.aCom} unit="m/s²" />
            <VecRow label="Fᶜ₃" value={NUM.link3.FC} unit="N" />
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-2 leading-tight">
            Po Rz(q₃ = 45°) bez α₃ skręcenia, kierunek propagacji się zmienia
            zgodnie z kątem stawu. Fᶜ₃ zdominowane przez grawitację (oś x).
          </p>
        </Section>
      </div>

      <Section title="Rekurencja w tył · momenty napędowe (rzut N_i na oś z_i)">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
          {NUM.torques.map((tau, i) => (
            <div key={i} className="rounded bg-[var(--code-bg)] px-3 py-2 text-center">
              <div className="text-[var(--muted)] text-[10px]">τ_{i + 1}</div>
              <div className="font-semibold text-[var(--accent)] tabular-nums">
                {tau.toFixed(4)}
              </div>
              <div className="text-[10px] text-[var(--muted)]">Nm</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-3 leading-tight">
          τ₁ ≈ 0 — pierwszy przegub porusza się wokół osi pionowej, więc grawitacja go nie obciąża,
          a brak q̈₁ oznacza brak siły bezwładności.
          τ₂ = 31.2 Nm dominuje — to przegub utrzymujący ramię w pozie q₂ = 45°
          przeciw grawitacji, plus dodatkowa składowa od ω₁ (efekt odśrodkowy
          przy ramieniu wykonującym łuk wokół osi 1).
          τ₃, τ₄ niewielkie — kostka i przedramię w stosunkowo neutralnej pozie.
        </p>
      </Section>

      <p className="text-xs text-[var(--muted)] italic">
        Wszystkie liczby są spójne z algorytmem z <code>src/lib/dynamics/newton-euler.ts</code>.
        Wartości są w jednostkach SI (rad, rad/s, rad/s², m, m/s, m/s², N, Nm, kg, kg·m²).
        Dla q̈ ≠ 0 widoczne byłyby też niezerowe wartości <M tex="\varepsilon" /> (przyspieszenia
        kątowe) we wszystkich ogniwach.
      </p>
    </div>
  );
}
