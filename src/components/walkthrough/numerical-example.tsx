/**
 * Statyczny wzorzec liczbowy: jedna konkretna poza, wszystkie wartości pośrednie
 * baked-in. Komponent czysty (server-renderable, brak hydration risk),
 * stałe pochodzą z analitycznego IK Pumy 560 dla pozy:
 *   p = (0.5, 0.15, 0.3) m,  rpy = (0°, 90°, 0°)
 * Gałąź: shoulder=right, elbow=up, wrist=flip.
 *
 * Cel pedagogiczny: studenci śledzą ten sam rachunek krok po kroku z
 * zapisanymi liczbami i mogą porównać własną implementację.
 */

import { Math as M } from "@/components/ui/math";

const NUM = {
  px: 0.5, py: 0.15, pz: 0.3,
  rpy: [0, 90, 0],
  R: [
    [0, 0, 1],
    [0, 1, 0],
    [-1, 0, 0],
  ],
  phi_deg: 16.6992,
  rho: 0.5067,
  q1_deg: 2.7996,
  D: 0.5889,
  L: 0.4323,
  beta_deg: 87.3084,
  cosGamma: 0.0711,
  gamma_deg: 85.9233,
  K: -0.0307,
  L2_minus_K2: 0.1859,
  q3_deg: 6.7684,
  M_coef: 0.4011,
  N_coef: 0.4312,
  denom: 0.3468,
  c2: 0.2130,
  s2: -0.9770,
  q2_deg: -77.6992,
  q4_deg: 8.5126,
  q5_deg: -19.2660,
  q6_deg: 171.9577,
};

function Row({ label, expr, value }: { label: string; expr?: string; value: string }) {
  return (
    <>
      <span className="text-[var(--muted)] pr-2">{label}</span>
      <span className="font-mono text-[var(--foreground)]">{expr ?? ""}</span>
      <span className="font-mono text-right text-[var(--accent)] pl-3">{value}</span>
    </>
  );
}

function StepBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
      <h4 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2 font-semibold">{title}</h4>
      <div className="grid grid-cols-[auto_1fr_auto] gap-y-1 text-xs items-baseline">{children}</div>
    </div>
  );
}

export function NumericalExample() {
  return (
    <div className="not-prose space-y-3">
      <div className="rounded-lg border border-[var(--accent)] bg-[var(--code-bg)] px-4 py-3">
        <h4 className="text-sm font-semibold mb-2">Poza testowa</h4>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs font-mono">
          <span className="text-[var(--muted)]">pozycja TCP:</span>
          <span>(p<sub>x</sub>, p<sub>y</sub>, p<sub>z</sub>) = ({NUM.px}, {NUM.py}, {NUM.pz}) m</span>
          <span className="text-[var(--muted)]">orientacja (rpy):</span>
          <span>(r, p, y) = ({NUM.rpy[0]}°, {NUM.rpy[1]}°, {NUM.rpy[2]}°)</span>
          <span className="text-[var(--muted)]">macierz R = R<sub>z</sub>·R<sub>y</sub>·R<sub>x</sub>:</span>
          <span>
            <code className="whitespace-pre">{`[ 0  0   1 ]
[ 0  1   0 ]
[-1  0   0 ]`}</code>
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StepBox title="Krok 1–2 · q₁ z dwóch atan2">
          <Row label="φ" expr="= atan2(p_y, p_x)" value={`${NUM.phi_deg.toFixed(4)}°`} />
          <Row label="ρ" expr="= √(p_x² + p_y² − d₃²)" value={`${NUM.rho.toFixed(4)} m`} />
          <Row label="q₁" expr="= φ − atan2(d₃, ρ)" value={`${NUM.q1_deg.toFixed(4)}°`} />
        </StepBox>

        <StepBox title="Krok 3 · płaszczyzna ramienia">
          <Row label="L" expr="= √(a₃² + d₄²)" value={`${NUM.L.toFixed(4)} m`} />
          <Row label="β" expr="= atan2(d₄, a₃)" value={`${NUM.beta_deg.toFixed(4)}°`} />
          <Row label="D" expr="= √(ρ² + p_z²)" value={`${NUM.D.toFixed(4)} m`} />
        </StepBox>

        <StepBox title="Krok 4 · q₃ z prawa cosinusów">
          <Row label="cos γ" expr="= (a₂² + L² − D²)/(2 a₂ L)" value={NUM.cosGamma.toFixed(4)} />
          <Row label="γ" expr="= acos(cos γ)" value={`${NUM.gamma_deg.toFixed(4)}°`} />
          <Row label="K" expr="= (D² − a₂² − L²)/(2 a₂)" value={NUM.K.toFixed(4)} />
          <Row label="L² − K²" value={NUM.L2_minus_K2.toFixed(4)} />
          <Row label="q₃ (elbow ↑)" expr="= atan2(+√…, K) − β" value={`${NUM.q3_deg.toFixed(4)}°`} />
        </StepBox>

        <StepBox title="Krok 5 · q₂ z układu 2×2">
          <Row label="M" expr="= a₂ + a₃c₃ − d₄s₃" value={NUM.M_coef.toFixed(4)} />
          <Row label="N" expr="= a₃s₃ + d₄c₃" value={NUM.N_coef.toFixed(4)} />
          <Row label="M² + N²" value={NUM.denom.toFixed(4)} />
          <Row label="c₂" expr="= (Mρ − Np_z)/(M²+N²)" value={NUM.c2.toFixed(4)} />
          <Row label="s₂" expr="= (−Mp_z − Nρ)/(M²+N²)" value={NUM.s2.toFixed(4)} />
          <Row label="q₂" expr="= atan2(s₂, c₂)" value={`${NUM.q2_deg.toFixed(4)}°`} />
        </StepBox>

        <StepBox title="Krok 7 · q₄, q₅, q₆ z R₃⁶ (gałąź wrist=flip)">
          <Row label="q₄" value={`${NUM.q4_deg.toFixed(4)}°`} />
          <Row label="q₅" value={`${NUM.q5_deg.toFixed(4)}°`} />
          <Row label="q₆" value={`${NUM.q6_deg.toFixed(4)}°`} />
        </StepBox>

        <StepBox title="Suma · pełna konfiguracja q">
          <span className="col-span-3 font-mono text-xs">
            q = ({NUM.q1_deg.toFixed(2)}°,&nbsp;
            {NUM.q2_deg.toFixed(2)}°,&nbsp;
            {NUM.q3_deg.toFixed(2)}°,&nbsp;
            {NUM.q4_deg.toFixed(2)}°,&nbsp;
            {NUM.q5_deg.toFixed(2)}°,&nbsp;
            {NUM.q6_deg.toFixed(2)}°)
          </span>
          <span className="col-span-3 text-[10px] text-[var(--muted)] mt-2">
            Sprawdzenie: FK(q) odtwarza pozycję z dokładnością ≈ 6·10⁻¹⁷ m. Wszystkie q<sub>i</sub> w
            granicach przegubów. Pozostałe siedem gałęzi (przy istnieniu) odtwarza tę samą pozę
            efektora innymi kątami przegubów.
          </span>
        </StepBox>
      </div>

      <p className="text-xs text-[var(--muted)] italic">
        Wszystkie liczby powyżej zostały wyznaczone analitycznie z wzorów wyprowadzonych w krokach 1–7.
        Można je odtworzyć ręcznie kalkulatorem — ten panel służy jako test kontrolny dla studenta
        implementującego algorytm we własnym kodzie. Stałe DH: <M tex="a_2 = 0{,}4318" />,{" "}
        <M tex="a_3 = 0{,}0203" />, <M tex="d_3 = 0{,}1254" />, <M tex="d_4 = 0{,}4318" /> m.
      </p>
    </div>
  );
}
