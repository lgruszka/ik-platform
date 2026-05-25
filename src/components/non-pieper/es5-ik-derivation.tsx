import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";

/**
 * Pełne wyprowadzenie IK dla robota ES5 z Załącznika A dysertacji
 * [Gruszka 2024]. Kolejność wyprowadzania współrzędnych:
 *   θ1  →  θ5  →  θ6  →  θ3  →  θ2  →  θ4
 *
 * Ta kolejność NIE jest oczywista — jest algebraicznie wymuszona faktem, że
 * pewne równania trygonometryczne dają się rozwiązać tylko gdy znane są inne
 * współrzędne. W M1 (Puma) kolejność q1 → q2,3 → q4,5,6 wynikała wprost z
 * dekompozycji 3+3 (forma A). Tu mamy formę B — i kolejność jest inna.
 *
 * Zachowano oryginalną notację dysertacji (θᵢ zamiast qᵢ, indeksy 1..6).
 */
export function Es5IkDerivation() {
  return (
    <div className="space-y-6">
      <section className="prose-ik">
        <h3>Punkt wyjścia — zadana macierz transformacji</h3>
        <p>
          Zadana jest macierz transformacji TCP względem bazy{" "}
          <M tex="{}^6T_0" /> w postaci ogólnej (eq. A.1 z dysertacji):
        </p>
        <MathBlock tex="{}^6T_0 = \begin{bmatrix} r_{11} & r_{12} & r_{13} & p_x \\ r_{21} & r_{22} & r_{23} & p_y \\ r_{31} & r_{32} & r_{33} & p_z \\ 0 & 0 & 0 & 1 \end{bmatrix}" />
        <p>
          Dla czytelności zapisu używamy w dysertacji skrótu{" "}
          <M tex="s_i \equiv \sin\theta_i" /> i <M tex="c_i \equiv \cos\theta_i" />,{" "}
          oraz <M tex="c_{23} \equiv \cos(\theta_2+\theta_3)" />,{" "}
          <M tex="c_{234} \equiv \cos(\theta_2+\theta_3+\theta_4)" /> itd.
          (skutek równoległości osi q₂, q₃, q₄ — sumy ich kątów zachowują się jak
          jeden „efektywny" kąt).
        </p>
      </section>

      <StepPanel number={1} title="θ₁ — z drugiej kolumny przekształconej macierzy">
        <p>
          Klucz wyprowadzenia: jeśli weźmiemy <M tex="{}^5T_1" /> obliczone na
          dwa różne sposoby — analitycznie z parametrów DH, oraz przez izolację
          z zadanego <M tex="{}^6T_0" /> przez mnożenie odwrotnościami —{" "}
          dostaniemy układ równań w którym pewne komórki <em>zależą tylko od θ₁</em>:
        </p>
        <MathBlock tex="({}^1T_0)^{-1} \cdot {}^6T_0 \cdot ({}^6T_5)^{-1} = {}^5T_1 \qquad \text{(eq. A.2)}" />
        <p>
          Analitycznie (z DH) <M tex="{}^5T_1" /> ma w komórce y wektora translacji
          (drugi wiersz, czwarta kolumna) wartość <em>stałą</em>:{" "}
          <M tex="-d_4" />. Z drugiej strony, po wykonaniu mnożenia po lewej i
          porównaniu — dostajemy równanie w którym jedyną niewiadomą jest <M tex="\theta_1" />:
        </p>
        <MathBlock tex="-s_1(p_x - d_6 r_{13}) + c_1(p_y - d_6 r_{23}) = -d_4 \qquad \text{(eq. A.5)}" />
        <p>
          Podstawienie helpers — pozycja środka nadgarstka (środka układu 5) rzutowana na xy bazy:
        </p>
        <MathBlock tex="{}^5p_{0x} = p_x - d_6 r_{13}, \qquad {}^5p_{0y} = p_y - d_6 r_{23} \qquad \text{(eq. A.6)}" />
        <MathBlock tex="{}^5p_{0xy} = \sqrt{({}^5p_{0x})^2 + ({}^5p_{0y})^2}, \qquad \alpha = \mathrm{atan2}({}^5p_{0y}, {}^5p_{0x})" />
        <p>Po podstawieniu i wykorzystaniu wzoru na sin różnicy kątów:</p>
        <MathBlock tex="{}^5p_{0xy} \sin(\theta_1 - \alpha) = d_4 \qquad \text{(eq. A.10)}" />
        <p>Stąd ostateczna postać dla θ₁:</p>
        <MathBlock tex="\boxed{\;\theta_1 = \arcsin\!\Big(\tfrac{d_4}{\,{}^5p_{0xy}\,}\Big) \pm \mathrm{atan2}({}^5p_{0x}, {}^5p_{0y})\;} \qquad \text{(eq. A.13)}" />
        <p>
          <strong>Dwa rozwiązania</strong> — odpowiadają dwóm konfiguracjom barku
          (shoulder-left / shoulder-right). Analog do gałęzi <em>shoulder</em> w M1.
        </p>
      </StepPanel>

      <StepPanel number={2} title="θ₅ — z położenia ostatniego członu względem drugiego">
        <p>
          Analiza struktury kinematycznej pokazuje, że współrzędna y wektora{" "}
          <M tex="{}^6p_1" /> (translacja od początku ogniwa 2 do początku ogniwa 6)
          zależy <em>wyłącznie</em> od θ₅:
        </p>
        <MathBlock tex="{}^6p_{1y} = d_4 + d_6 \cos\theta_5 \qquad \text{(eq. A.14)}" />
        <p>
          Z drugiej strony, ten sam <M tex="{}^6p_{1y}" /> można wyrazić przez
          obrót <M tex="({}^1R_0)^{-1} \cdot {}^6p_0" /> (eq. A.16–A.18):
        </p>
        <MathBlock tex="{}^6p_{1y} = {}^6p_{0x} \cdot (-s_1) + {}^6p_{0y} \cdot c_1 \qquad \text{(eq. A.18)}" />
        <p>
          Przyrównanie i wyizolowanie <M tex="\cos\theta_5" />:
        </p>
        <MathBlock tex="\boxed{\;\theta_5 = \pm\arccos\!\Big(\tfrac{-{}^6p_{0x}\,s_1 + {}^6p_{0y}\,c_1 - d_4}{d_6}\Big)\;} \qquad \text{(eq. A.20)}" />
        <p>
          <strong>Dwa rozwiązania</strong> — odpowiadają dwóm orientacjom kiści
          względem ogniwa 4 (analog do gałęzi <em>wrist flip</em> z M1).
        </p>
        <p>
          <strong>Uwaga o pierwszej osobliwości:</strong> gdy <M tex="\theta_5 = 0°" />,
          szósta oś obrotu staje się równoległa do osi 2, 3 i 4 — pojawia się
          nadmiarowość stopni swobody (obrót osi 2, 3, 4 manipuluje TCP
          niezależnie od rotacji osi 6). To jest klasyczny <em>wrist singularity</em>{" "}
          analogiczny do Pumy.
        </p>
      </StepPanel>

      <StepPanel number={3} title="θ₆ — z komórek macierzy 6T1">
        <p>
          Wyznaczając jawnie <M tex="{}^6T_1" /> z parametrów DH (eq. A.21)
          i porównując z formą uzyskaną przez <M tex="{}^6R_1 = ({}^1R_0)^{-1}\cdot{}^6R_0" />{" "}
          (eq. A.26–A.28), z komórek [2,1] oraz [2,2] dostajemy układ:
        </p>
        <MathBlock tex="\begin{cases} -s_5 c_6 = -s_1 r_{11} + c_1 r_{21}, \\ \phantom{-}s_5 s_6 = -s_1 r_{12} + c_1 r_{22}. \end{cases} \qquad \text{(eq. A.29)}" />
        <p>
          Stąd osobno <M tex="\sin\theta_6" /> i <M tex="\cos\theta_6" />, i ich
          złożenie przez atan2:
        </p>
        <MathBlock tex="\boxed{\;\theta_6 = \mathrm{atan2}\!\Big(\tfrac{-s_1 r_{12} + c_1 r_{22}}{s_5},\; \tfrac{s_1 r_{11} - c_1 r_{21}}{s_5}\Big)\;} \qquad \text{(eq. A.31)}" />
        <p>
          atan2 (a nie acos) — żeby zachować pełen zakres <M tex="[-\pi, \pi]" />.
          Dzielenie przez <M tex="s_5" /> jest niesingularne dopóki <M tex="\theta_5 \neq 0" />.
        </p>
      </StepPanel>

      <StepPanel number={4} title="θ₃ — z twierdzenia cosinusów w płaszczyźnie x-z">
        <p>
          Po znalezieniu θ₁, θ₅, θ₆ wracamy do zadania pozycji. Wyznaczamy{" "}
          <M tex="{}^4T_1" /> przez ciąg mnożeń odwrotnościami:
        </p>
        <MathBlock tex="{}^4T_1 = ({}^1T_0)^{-1} \cdot {}^6T_0 \cdot ({}^5T_4)^{-1} \cdot ({}^6T_5)^{-1} \qquad \text{(eq. A.32)}" />
        <p>
          Z geometrii (Rys. A.1 z dysertacji) — robot rzutowany na płaszczyznę
          xz tworzy trójkąt o bokach <M tex="a_2" />, <M tex="a_3" /> i przekątnej{" "}
          <M tex="|{}^4p_1|" />. Z twierdzenia cosinusów (jak w M1):
        </p>
        <MathBlock tex="\cos\beta = \frac{a_2^2 + a_3^2 - |{}^4p_1|^2}{2 a_2 a_3}, \qquad \beta = \pi - \theta_3" />
        <p>Stąd:</p>
        <MathBlock tex="\boxed{\;\theta_3 = \pm\arccos\!\Big(\tfrac{-a_2^2 - a_3^2 + ({}^4p_{1x})^2 + ({}^4p_{1z})^2}{2 a_2 a_3}\Big)\;} \qquad \text{(eq. A.38)}" />
        <p>
          <strong>Dwa rozwiązania</strong> — gałęzie elbow-up i elbow-down,
          analog do M1.
        </p>
      </StepPanel>

      <StepPanel number={5} title="θ₂ — z trygonometrii trójkąta O₂O₃O₄">
        <p>
          Z tego samego rzutu (Rys. A.1) widzimy: <M tex="\theta_2 = \gamma - \alpha" />,
          gdzie γ to kąt do <M tex="{}^4p_1" />, a α to wewnętrzny kąt trójkąta
          przy O₂. Wyrażając przez znane wielkości:
        </p>
        <MathBlock tex="\gamma = \mathrm{atan2}({}^4p_{1x}, {}^4p_{1z})" />
        <p>α z prawa sinusów dla trójkąta O₂O₃O₄:</p>
        <MathBlock tex="\frac{\sin\alpha}{a_3} = \frac{\sin\beta}{|{}^4p_1|} \;\Rightarrow\; \alpha = \arcsin\!\Big(\frac{a_3 \sin\beta}{|{}^4p_1|}\Big)" />
        <p>Stąd:</p>
        <MathBlock tex="\boxed{\;\theta_2 = \mathrm{atan2}({}^4p_{1x}, {}^4p_{1z}) - \arcsin\!\Big(\tfrac{a_3 \sin\beta}{|{}^4p_1|}\Big)\;} \qquad \text{(eq. A.43)}" />
      </StepPanel>

      <StepPanel number={6} title="θ₄ — z komórek [1,1] i [1,2] macierzy 4T3">
        <p>
          Ostatnia współrzędna — analogicznie do θ₆, ale na innym poziomie
          dekompozycji macierzy:
        </p>
        <MathBlock tex="{}^4T_3 = ({}^1T_0)^{-1} \cdot ({}^2T_1)^{-1} \cdot ({}^3T_2)^{-1} \cdot {}^6T_0 \cdot ({}^5T_4)^{-1} \cdot ({}^6T_5)^{-1} \qquad \text{(eq. A.44)}" />
        <p>
          Z komórek [1,1] i [1,2] tej macierzy wyciągamy <M tex="\sin\theta_4" /> i{" "}
          <M tex="\cos\theta_4" /> jako kombinacje liniowe znanych już{" "}
          <M tex="r_{ij}, c_1, s_1, c_5, s_5, c_6, s_6, c_{23}, s_{23}" /> (eq. A.45 — dwie długie
          formuły 6-składnikowe). Następnie:
        </p>
        <MathBlock tex="\boxed{\;\theta_4 = \mathrm{atan2}(\sin\theta_4,\; \cos\theta_4)\;} \qquad \text{(eq. A.46)}" />
      </StepPanel>

      <section className="prose-ik">
        <h3>Postać końcowa — 6 równań</h3>
        <p>
          Komplet wzorów (eq. A.47–A.52 z dysertacji) — gotowe do wstawienia do
          kodu solvera analitycznego dla ES5:
        </p>
        <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] p-4 not-prose space-y-2 text-sm">
          <MathBlock tex="\theta_1 = \arcsin\!\Big(\tfrac{d_4}{{}^5p_{0xy}}\Big) \pm \mathrm{atan2}({}^5p_{0x}, {}^5p_{0y})" />
          <MathBlock tex="\theta_2 = \mathrm{atan2}({}^4p_{1x}, {}^4p_{1z}) - \arcsin\!\Big(\tfrac{a_3 \sin\beta}{|{}^4p_1|}\Big)" />
          <MathBlock tex="\theta_3 = \pm\arccos\!\Big(\tfrac{-a_2^2 - a_3^2 + ({}^4p_{0x})^2 + ({}^4p_{1z})^2}{2 a_2 a_3}\Big)" />
          <MathBlock tex="\theta_4 = \mathrm{atan2}(\sin\theta_4,\; \cos\theta_4)" />
          <MathBlock tex="\theta_5 = \pm\arccos\!\Big(\tfrac{-{}^6p_{0x} s_1 + {}^6p_{0y} c_1 - d_4}{d_6}\Big)" />
          <MathBlock tex="\theta_6 = \mathrm{atan2}\!\Big(\tfrac{-s_1 r_{12} + c_1 r_{22}}{s_5},\; \tfrac{s_1 r_{11} - c_1 r_{21}}{s_5}\Big)" />
        </div>
        <p>
          <strong>Liczba rozwiązań:</strong> 2 (shoulder θ₁) × 2 (elbow θ₃) ×
          2 (wrist θ₅) = <strong>8 konfiguracji</strong> — identycznie jak dla
          Pumy 560, choć geometria jest zupełnie inna. To uniwersalny wynik dla
          manipulatorów 6-DOF spełniających <em>jakąkolwiek</em> formę warunku
          Piepera.
        </p>
      </section>
    </div>
  );
}
