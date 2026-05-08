/**
 * Ściąga formuł dla M9 — wszystkie wzory algorytmu Newton-Euler.
 * Numeracja wzorów odwołuje się do dysertacji Gruszki, eq. (6.6)–(6.18).
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

export function CheatSheetM9() {
  return (
    <div className="not-prose space-y-2">
      <Row label="Inicjalizacja (baza)">
        <MathBlock tex="{}^0\boldsymbol{\omega}_0 = \mathbf{0}, \quad {}^0\boldsymbol{\varepsilon}_0 = \mathbf{0}, \quad {}^0\mathbf{v}_0 = \mathbf{0}, \quad {}^0\mathbf{a}_0 = -g\,\hat{\mathbf{z}}_{\text{world}}" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Sztuczka Craig'a: a₀ to "fictitious upward base acceleration" — symuluje
          grawitację działającą "w dół" na ogniwa, dzięki czemu w forward sweep
          aᶜᵢ propaguje grawitację automatycznie.
        </p>
      </Row>

      <Row label="Forward sweep · prędkość kątowa (eq. 6.6)">
        <MathBlock tex="{}^{i+1}\boldsymbol{\omega}_{i+1} = {}^{i+1}R_i\,{}^i\boldsymbol{\omega}_i + \dot\theta_{i+1}\,\hat{\mathbf{z}}_{i+1}" />
      </Row>

      <Row label="Forward sweep · przyspieszenie kątowe (eq. 6.7)">
        <MathBlock tex="{}^{i+1}\boldsymbol{\varepsilon}_{i+1} = {}^{i+1}R_i\,{}^i\boldsymbol{\varepsilon}_i + ({}^{i+1}R_i\,{}^i\boldsymbol{\omega}_i)\times\dot\theta_{i+1}\hat{\mathbf{z}}_{i+1} + \ddot\theta_{i+1}\hat{\mathbf{z}}_{i+1}" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Drugi człon to <strong>efekt Coriolisa</strong> — pojawia się gdy ogniwo
          dziedziczy ω od poprzedniego i jednocześnie ma własną prędkość przegubu.
        </p>
      </Row>

      <Row label="Forward sweep · prędkość liniowa początku ogniwa (eq. 6.8)">
        <MathBlock tex="{}^{i+1}\mathbf{v}_{i+1} = {}^{i+1}R_i\,\bigl({}^i\mathbf{v}_i + {}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{i+1}\bigr)" />
      </Row>

      <Row label="Forward sweep · przyspieszenie liniowe początku ogniwa (eq. 6.9)">
        <MathBlock tex="{}^{i+1}\mathbf{a}_{i+1} = {}^{i+1}R_i\,\bigl({}^i\boldsymbol{\varepsilon}_i\times {}^i\mathbf{p}_{i+1} + {}^i\boldsymbol{\omega}_i\times({}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{i+1}) + {}^i\mathbf{a}_i\bigr)" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Pierwszy człon — tangencjalny (od ε), drugi — odśrodkowy (analog v²/r),
          trzeci — przyspieszenie poprzedniego ogniwa (zawiera grawitację).
        </p>
      </Row>

      <Row label="Środek masy · prędkość i przyspieszenie (eq. 6.11–6.12)">
        <MathBlock tex="{}^i\mathbf{v}_{Ci} = {}^i\mathbf{v}_i + {}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{Ci}" />
        <MathBlock tex="{}^i\mathbf{a}_{Ci} = {}^i\boldsymbol{\varepsilon}_i\times {}^i\mathbf{p}_{Ci} + {}^i\boldsymbol{\omega}_i\times({}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{Ci}) + {}^i\mathbf{a}_i" />
      </Row>

      <Row label="Tensor bezwładności i siły bezwładności (eq. 6.13–6.15)">
        <MathBlock tex="I_C = \begin{bmatrix} I_{xx} & -I_{xy} & -I_{xz} \\ -I_{xy} & I_{yy} & -I_{yz} \\ -I_{xz} & -I_{yz} & I_{zz} \end{bmatrix}" />
        <MathBlock tex="{}^i\mathbf{F}_{Ci} = m_i\,{}^i\mathbf{a}_{Ci}, \qquad {}^i\mathbf{N}_{Ci} = I_{Ci}\,{}^i\boldsymbol{\varepsilon}_i + {}^i\boldsymbol{\omega}_i\times(I_{Ci}\,{}^i\boldsymbol{\omega}_i)" />
        <p className="text-xs text-[var(--muted)] mt-1">
          F_C — siła d'Alemberta (z grawitacją). Drugi człon w N_C to <strong>moment
          giroskopowy</strong> — odpowiedzialny za precesję szybko obracających się ogniw.
        </p>
      </Row>

      <Row label="Backward sweep · siła reakcji w przegubie (Craig, 6.49)">
        <MathBlock tex="{}^i\mathbf{f}_i = {}^iR_{i+1}\,{}^{i+1}\mathbf{f}_{i+1} + {}^i\mathbf{F}_{Ci}" />
      </Row>

      <Row label="Backward sweep · moment siły w przegubie (Craig, 6.50)">
        <MathBlock tex="{}^i\mathbf{n}_i = {}^i\mathbf{N}_{Ci} + {}^iR_{i+1}\,{}^{i+1}\mathbf{n}_{i+1} + {}^i\mathbf{p}_{Ci}\times {}^i\mathbf{F}_{Ci} + {}^i\mathbf{p}_{i+1}\times({}^iR_{i+1}\,{}^{i+1}\mathbf{f}_{i+1})" />
      </Row>

      <Row label="Moment napędowy w osi przegubu">
        <MathBlock tex="\tau_i = {}^i\mathbf{n}_i \cdot \hat{\mathbf{z}}_i = (\,{}^i\mathbf{n}_i)_z" />
        <p className="text-xs text-[var(--muted)] mt-1">
          Składowa wzdłuż osi obrotu przegubu i (czyli z układu i). Pozostałe
          składowe momentu są zniwelowane przez konstrukcję mechaniczną przegubu.
        </p>
      </Row>

      <Row label="Konwencja indeksów (Craig, modified DH)">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li><M tex="{}^i\mathbf{p}_{i+1}" /> — pozycja przegubu (i+1) w układzie (i).</li>
          <li><M tex="{}^i\mathbf{p}_{Ci}" /> — środek masy ogniwa (i) w układzie (i).</li>
          <li><M tex="{}^{i+1}R_i" /> — macierz rotacji z układu (i) do (i+1) (z linkTransform DH).</li>
          <li>Górny indeks = w którym układzie wektor jest wyrażony.</li>
        </ul>
      </Row>

      <Row label="Pułapki implementacyjne">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>
            <strong>Kierunek transformacji R</strong> — modifiedDHTransform zwraca
            macierz, której kolumny to baza (i) wyrażona w (i-1). Aby przejść z (i-1)
            do (i) w forward sweep, trzeba użyć <strong>R^T</strong>, nie R.
          </li>
          <li>
            <strong>Konwencja a₀</strong> — Craig: a₀ = -g·ẑ (z grawitacją w forward sweep,
            bez osobnego F_g). Niektóre teksty używają a₀ = 0 + osobny F_g — równoważne,
            ale nie wolno mieszać konwencji w jednej implementacji.
          </li>
          <li>
            <strong>Tensor I_C w lokalnym układzie</strong> — I_C zdefiniowany w układzie
            ogniwa (i), nie w bazie. Twierdzenie Steinera (parallel-axis) potrzebne tylko
            wtedy gdy podaje się I względem początku ogniwa zamiast środka masy.
          </li>
          <li>
            <strong>τ_i to składowa N_i wzdłuż z_i</strong> — nie norma, nie moduł. Dla
            przegubu obrotowego oś z_i to oś przegubu (konwencja DH).
          </li>
        </ul>
      </Row>
    </div>
  );
}
