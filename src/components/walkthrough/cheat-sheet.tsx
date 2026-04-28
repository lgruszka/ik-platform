/**
 * Ściąga formuł — wszystkie kluczowe równania algorytmu IK Pumy 560 zebrane
 * w jednym panelu. Pomocna jako referencja końcowa po przejściu kroków 1–8.
 */

import { Math as M, MathBlock } from "@/components/ui/math";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-2">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function CheatSheet() {
  return (
    <div className="not-prose space-y-2">
      <Row label="Stałe DH (Craig) Pumy 560">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
          <span><M tex="a_2 = 0{,}4318" /> m</span>
          <span><M tex="a_3 = 0{,}0203" /> m</span>
          <span><M tex="d_3 = 0{,}1254" /> m</span>
          <span><M tex="d_4 = 0{,}4318" /> m</span>
        </div>
      </Row>

      <Row label="Krok 0 · Odsprzężenie pozycji od orientacji">
        <MathBlock tex="T_0^{6} = T^* \cdot T_\mathrm{tool}^{-1}, \qquad \mathbf{p}_\mathrm{wc} = \mathbf{p} - d_6\,R\,\hat{\mathbf{z}} \overset{d_6=0}{=} \mathbf{p}" />
      </Row>

      <Row label="Krok 1 · Wzory na pozycję środka nadgarstka">
        <MathBlock tex="\rho = a_2\,c_2 + a_3\,c_{23} - d_4\,s_{23}, \qquad p_x^2 + p_y^2 = \rho^2 + d_3^2" />
      </Row>

      <Row label="Krok 2 · q₁ — gałąź barku (shoulder)">
        <MathBlock tex="\rho = \pm\sqrt{p_x^2 + p_y^2 - d_3^2}, \qquad q_1 = \operatorname{atan2}(p_y, p_x) - \operatorname{atan2}(d_3, \rho)" />
      </Row>

      <Row label="Krok 3 · stałe płaszczyzny ramienia">
        <MathBlock tex="L = \sqrt{a_3^2 + d_4^2}, \qquad \beta = \operatorname{atan2}(d_4, a_3), \qquad D^2 = \rho^2 + p_z^2" />
      </Row>

      <Row label="Krok 4 · q₃ — gałąź łokcia (elbow), prawo cosinusów">
        <MathBlock tex="K = \frac{D^2 - a_2^2 - L^2}{2\,a_2} = a_3\,c_3 - d_4\,s_3 \;\Rightarrow\; q_3 = \operatorname{atan2}\!\bigl(\pm\sqrt{L^2 - K^2},\;K\bigr) - \beta" />
      </Row>

      <Row label="Krok 5 · q₂ z układu 2×2 w (c₂, s₂)">
        <MathBlock tex="M = a_2 + a_3\,c_3 - d_4\,s_3, \qquad N = a_3\,s_3 + d_4\,c_3" />
        <MathBlock tex="c_2 = \frac{M\rho - N p_z}{M^2 + N^2}, \quad s_2 = \frac{-M p_z - N\rho}{M^2 + N^2}, \quad q_2 = \operatorname{atan2}(s_2, c_2)" />
      </Row>

      <Row label="Krok 6 · macierz R₀³ z gotowych kątów q₁, q₂, q₃">
        <MathBlock tex="R_0^3 = \begin{bmatrix} c_1 c_{23} & -c_1 s_{23} & -s_1 \\ s_1 c_{23} & -s_1 s_{23} & c_1 \\ -s_{23} & -c_{23} & 0 \end{bmatrix}, \qquad R_3^6 = (R_0^3)^{\!\top}\,R" />
      </Row>

      <Row label="Krok 7 · q₄, q₅, q₆ z elementów R₃⁶ (gałąź wrist)">
        <MathBlock tex="q_5 = \operatorname{atan2}\!\bigl(\pm\sqrt{R^{36}_{10}{}^2 + R^{36}_{11}{}^2},\;R^{36}_{12}\bigr)" />
        <MathBlock tex="q_4 = \operatorname{atan2}(\pm R^{36}_{22},\;\mp R^{36}_{02}), \qquad q_6 = \operatorname{atan2}(\mp R^{36}_{11},\;\pm R^{36}_{10})" />
      </Row>

      <Row label="Krok 8 · 8 gałęzi = 2 (shoulder) × 2 (elbow) × 2 (wrist)">
        <p className="text-sm">
          Wybór znaków w trzech miejscach (<M tex="\rho" />, dyskryminant{" "}
          <M tex="\sqrt{L^2 - K^2}" />, <M tex="\sin q_5" />) generuje{" "}
          <M tex="2^3 = 8" /> kombinacji. Część może odpaść jako poza zasięgiem
          (<M tex="L^2 < K^2" />) lub poza limitami przegubów; w singularności
          nadgarstka (<M tex="\sin q_5 \approx 0" />) gałęzie wrist zlewają się.
        </p>
      </Row>

      <Row label="Pułapki — częste źródła błędów">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>
            Zapomnienie drugiego członu w q₁: <code>atan2(p_y, p_x)</code> bez{" "}
            <code>− atan2(d₃, ρ)</code> daje błąd ~7° wynikający z odsadzenia <M tex="d_3" />.
          </li>
          <li>
            Użycie <code>arcsin</code> lub <code>arccos</code> tam gdzie wystarcza{" "}
            <code>atan2</code> — gubi informację o ćwiartce, błąd zniknie tylko dla
            niektórych pozycji.
          </li>
          <li>
            Mieszanie konwencji DH klasycznej i Craiga — liczby <M tex="\alpha, a, d" />{" "}
            są te same, ale przesunięte o jeden indeks. Wzory w tym walkthrough zakładają Craiga.
          </li>
          <li>
            Numeryczna inwersja <M tex="(R_0^3)^{-1}" /> zamiast transpozycji — kosztownie
            i z gorszą precyzją. Macierze rotacji są ortogonalne: <M tex="R^{-1} = R^{\top}" />.
          </li>
          <li>
            Brak detekcji singularności <M tex="|\sin q_5| < \varepsilon" /> przed dzieleniem —
            kończy się wartościami NaN dla q₄ i q₆.
          </li>
        </ul>
      </Row>
    </div>
  );
}
