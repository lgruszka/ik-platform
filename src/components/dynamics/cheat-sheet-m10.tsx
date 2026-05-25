/**
 * Ściąga formuł dla M10 — łańcuch τ_i → ω_motor → η → i → u → P → E.
 * Numeracja wzorów odwołuje się do dysertacji [Gruszka 2024], eq. (6.19)–(6.23).
 */

import { Math as M, MathBlock } from "@/components/ui/math";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-2">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function CheatSheetM10() {
  return (
    <div className="not-prose space-y-2">
      <Row label="Stałe ES5 (Tab. 6.3 dysertacji)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono">
          <span><M tex="k_T" /> = 0.1418 (1-3) / 0.1636 (4-6) Nm/A</span>
          <span><M tex="k_e" /> = 0.12 (1-3) / 0.08 (4-6) V/(rad/s)</span>
          <span><M tex="R_t" /> = 0.7 (1-3) / 3.5 (4-6) Ω</span>
          <span><M tex="L" /> = 0.9 (1-3) / 3.4 (4-6) mH</span>
          <span><M tex="n" /> = 101:1 (1,3,4-6) / 121:1 (2)</span>
        </div>
      </Row>

      <Row label="Krok 1 · Prędkość obrotowa silnika">
        <MathBlock tex="\omega_{m,i} = n_i \cdot \dot\theta_i" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Przekładnia harmoniczna mnoży prędkość kątową: silnik obraca się 101× szybciej
          niż przegub, ale wytwarza 101× mniejszy moment przy danej mocy.
        </p>
      </Row>

      <Row label="Krok 2 · Moment na wale silnika (eq. 6.19)">
        <MathBlock tex="\tau_{m,i} = \frac{\tau_i}{\eta_{r,i} \cdot n_i}" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Sprawność <M tex="\eta_r \in (0,1)" /> dzieli się — bo część energii idzie
          w straty (tarcie, odkształcenia flexspline). Stąd silnik musi wytworzyć
          <em> więcej</em> momentu niż wynika z czystego ratio.
        </p>
      </Row>

      <Row label="Krok 3 · Sprawność przekładni (eq. 6.20, 6.37)">
        <MathBlock tex="\eta_{r,i} = f(\omega_{m,i}, \tau_i)" />
        <MathBlock tex="f(x) = a_5 x^5 + a_4 x^4 + a_3 x^3 + a_2 x^2 + a_1 x + a_0" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Wielomian 5. stopnia w obciążeniu (% nominalnego), współczynniki z Tab. 6.4
          dla 3 grup przegubów × 4 prędkości referencyjnych. Interpolacja liniowa
          po prędkości pomiędzy zadanymi krzywymi.
        </p>
      </Row>

      <Row label="Krok 4 · Stała momentowa silnika (eq. 6.21)">
        <MathBlock tex="\tau_{m,i} = k_{T,i} \cdot i_i \;\Longleftrightarrow\; i_i = \frac{\tau_{m,i}}{k_{T,i}}" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Klasyczna proporcjonalność dla silnika DC z magnesami trwałymi:
          siła Lorentza na uzwojenie tworznika daje moment liniowo zależny od prądu.
        </p>
      </Row>

      <Row label="Krok 5 · Równanie napięciowe silnika (eq. 6.22)">
        <MathBlock tex="u_i = R_{t,i}\,i_i + L_i\,\frac{di_i}{dt} + k_{e,i}\,\omega_{m,i}" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Prawo Kirchhoffa dla obwodu wirnika: spadek napięcia na rezystancji + człon
          indukcyjny + EMF wirnika. W modelu quasi-statycznym pomijamy{" "}
          <M tex="L\,di/dt" /> (zwykle &lt;5% napięcia dla manipulatorów).
        </p>
      </Row>

      <Row label="Krok 6 · Moc chwilowa">
        <MathBlock tex="P_i(t) = u_i(t) \cdot i_i(t)" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Moc pobierana z baterii / zasilacza. Dla przeguba poruszającego się{" "}
          <em>w kierunku siły wewnętrznej</em> (np. opadanie ramienia) silnik
          mógłby teoretycznie regenerować — w naszym modelu uproszczonym
          bierzemy <M tex="|P|" /> (brak rekuperacji).
        </p>
      </Row>

      <Row label="Krok 7 · Energia cyklu transportowego (eq. 6.23)">
        <MathBlock tex="E = \sum_{i=1}^n \int_0^{t_r} u_i(t) \cdot i_i(t) \, dt" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Suma po wszystkich napędach × całka mocy. W praktyce numerycznie:
          trapezoidalna integracja z dt = 0.01–0.02 s. To jest funkcja celu
          w optymalizacji cyklu transportowego (rozdz. 8 dysertacji).
        </p>
      </Row>

      <Row label="Pułapki implementacyjne">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>
            <strong>Znaki τ vs ruch silnika</strong> — gdy silnik <em>hamuje</em>
            obciążenie (np. przegub opada pod grawitacją, a silnik trzyma), prąd i
            moment mają przeciwne znaki. <M tex="P = u\cdot i" /> może wyjść ujemne;
            interpretujemy to jako "energia oddawana do systemu" (rekuperacja).
            W naszym modelu uproszczonym bierzemy <M tex="|P|" />.
          </li>
          <li>
            <strong>Sprawność przekładni dla małych obciążeń</strong> — przy{" "}
            <M tex="\tau \to 0" /> wielomian może wyjść poza [0,1]; klamrujemy do
            sensownego zakresu (5–95%).
          </li>
          <li>
            <strong>Stałe k_T i k_e</strong> — w SI mają tę samą wartość liczbową
            (dla silnika magnetycznego), ale podawane są w różnych jednostkach.
            Tab. 6.3 podaje k_T = 0.1418 Nm/A vs k_e = 0.12 V/(rad/s) — różnica wynika
            z arbitralnego rozdziału strat między tymi stałymi w karcie producenta.
          </li>
          <li>
            <strong>Pomijanie L·di/dt</strong> — dla manipulatorów stała czasowa
            elektryczna L/R ~ 1 ms vs mechaniczna 10–100 ms, więc składowa
            indukcyjna zwykle &lt;5% napięcia. Dla wysokoprędkościowych silników
            BLDC niemiernych w robocie może być znacząca; w pełnym modelu
            integrujemy di/dt jako kolejny stan.
          </li>
        </ul>
      </Row>
    </div>
  );
}
