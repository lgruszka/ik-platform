import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { CrossProductDiagram } from "@/components/math-compendium/cross-product-diagram";
import { RigidBodyVelocityDiagram } from "@/components/math-compendium/rigid-body-velocity-diagram";
import { HomogeneousMatrixDiagram } from "@/components/math-compendium/homogeneous-matrix-diagram";

export default function ModuleMathCompendium() {
  return (
    <>
      <ModuleHeader slug="0-5-math-compendium" />
      <div className="px-8 py-8 max-w-5xl space-y-8">

        <section className="prose-ik">
          <h2>Jak korzystać z tego modułu</h2>
          <p>
            Ten moduł to <strong>skrót matematyki i mechaniki</strong> potrzebnej
            w pozostałych modułach aplikacji. Nie jest to pełny wykład — to
            <em> referencja</em> do której wracasz, gdy w którymś z modułów pojawi
            się wzór, który Cię zaskoczy.
          </p>
          <p>
            Inspirację stanowi pierwszy rozdział „Modelowania i sterowania robotów"
            Kozłowskiego — taki sam mini-słownik narzędzi matematycznych przed
            wejściem w robotykę właściwą. Każda sekcja kończy się pointą{" "}
            <em>„gdzie tego używasz dalej"</em> z linkami do konkretnych modułów.
          </p>
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 my-4 text-sm">
            <p className="font-semibold mb-1">Wskazówka praktyczna</p>
            <p className="text-[var(--muted)] mb-0">
              Przy pierwszym czytaniu możesz przejrzeć cały moduł raz <em>luźno</em>,
              żeby wiedzieć co tu jest. Potem wracaj wybiórczo — np. gdy w M9
              zobaczysz <M tex="\boldsymbol\omega\times(I\boldsymbol\omega)" /> i
              chcesz przypomnieć sobie iloczyn wektorowy, wracaj do{" "}
              <a href="#wektory-3d" className="text-[var(--accent)] underline">sekcji „Wektory 3D"</a>.
              Każdy krok jest klikalny w nagłówku — zwiniesz/rozwiniesz osobno.
            </p>
          </div>
        </section>

        <StepPanel number={1} title="Wektory 3D — iloczyn skalarny, wektorowy, norma">
          <h4 id="wektory-3d" style={{ marginTop: 0 }}>Podstawowe operacje</h4>
          <p>
            Dla wektorów <M tex="\mathbf{a}, \mathbf{b} \in \mathbb{R}^3" />:
          </p>
          <ul>
            <li>
              <strong>Iloczyn skalarny</strong> (dot product) — daje liczbę:{" "}
              <M tex="\mathbf{a}\cdot\mathbf{b} = a_x b_x + a_y b_y + a_z b_z = |\mathbf{a}||\mathbf{b}|\cos\theta" />.
              Mierzy „jak bardzo dwa wektory wskazują w tę samą stronę". Zero ⟺ prostopadłe.
            </li>
            <li>
              <strong>Iloczyn wektorowy</strong> (cross product) — daje wektor prostopadły
              do obu, o długości równej polu równoległoboku rozpiętego przez nie:{" "}
              <M tex="|\mathbf{a}\times\mathbf{b}| = |\mathbf{a}||\mathbf{b}|\sin\theta" />.
            </li>
            <li>
              <strong>Norma (długość)</strong>:{" "}
              <M tex="|\mathbf{a}| = \sqrt{a_x^2 + a_y^2 + a_z^2} = \sqrt{\mathbf{a}\cdot\mathbf{a}}" />.
            </li>
          </ul>

          <CrossProductDiagram />

          <p>
            <strong>Wzór jawny dla iloczynu wektorowego:</strong>
          </p>
          <MathBlock tex="\mathbf{a}\times\mathbf{b} = \begin{bmatrix} a_y b_z - a_z b_y \\ a_z b_x - a_x b_z \\ a_x b_y - a_y b_x \end{bmatrix}" />

          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-3 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Mnemonik: rozwinięcie wyznacznika 3×3
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <p>Łatwy do zapamiętania zapis przez wyznacznik formalny:</p>
              <MathBlock tex="\mathbf{a}\times\mathbf{b} = \det\begin{bmatrix} \hat{x} & \hat{y} & \hat{z} \\ a_x & a_y & a_z \\ b_x & b_y & b_z \end{bmatrix}" />
              <p>
                Rozwijając wzdłuż pierwszego wiersza dostajesz dokładnie 3 składowe
                z wzoru wyżej. To trick dydaktyczny — formalnie macierz nie jest
                „liczbowa" (zawiera wektory bazy), ale operacja rozwinięcia daje
                poprawny wynik.
              </p>
            </div>
          </details>

          <p className="text-sm text-[var(--muted)] italic">
            <strong>Gdzie tego używasz dalej:</strong> iloczyn wektorowy w{" "}
            <a href="/modules/3-jacobian" className="text-[var(--accent)] underline">M3 (Jakobiany)</a> —
            kolumna jakobianu dla przegubu obrotowego ma postać <M tex="\hat z_i \times (\mathbf{p}_n - \mathbf{p}_i)" />;{" "}
            w <a href="/modules/9-dynamics" className="text-[var(--accent)] underline">M9 (Newton-Euler)</a> —{" "}
            człon żyroskopowy <M tex="\boldsymbol\omega\times(I\boldsymbol\omega)" /> i prawie każdy człon
            propagacji prędkości.
          </p>
        </StepPanel>

        <StepPanel number={2} title="Macierze — mnożenie, transpozycja, wyznacznik">
          <h4 id="macierze" style={{ marginTop: 0 }}>Mnożenie</h4>
          <p>
            Dla <M tex="A \in \mathbb{R}^{m\times n}" /> i{" "}
            <M tex="B \in \mathbb{R}^{n\times p}" /> wynik <M tex="C = AB" /> ma wymiar{" "}
            <M tex="m \times p" />, a element:
          </p>
          <MathBlock tex="C_{ij} = \sum_{k=1}^{n} A_{ik}\,B_{kj}" />
          <p>
            Czyli element <em>(i, j)</em> wyniku to <em>iloczyn skalarny i-tego wiersza A
            z j-tą kolumną B</em>. <strong>Kolejność ma znaczenie:</strong>{" "}
            <M tex="AB \neq BA" /> w ogólności. To podstawowa przyczyna trudności DH
            (kolejność transformacji ważna).
          </p>

          <h4 id="transpozycja">Transpozycja</h4>
          <p>
            <M tex="(A^\top)_{ij} = A_{ji}" /> — odbicie względem przekątnej.
            Ważna tożsamość:{" "}
            <M tex="(AB)^\top = B^\top A^\top" /> (kolejność się odwraca!).
          </p>

          <h4 id="wyznacznik">Wyznacznik — geometrycznie</h4>
          <p>
            Dla macierzy kwadratowej <M tex="A \in \mathbb{R}^{n\times n}" /> wyznacznik{" "}
            <M tex="\det A" /> to <strong>czynnik skalujący objętość</strong>: jeśli
            jednostkowy n-sześcian zostanie odwzorowany przez A, to powstaje
            równoległoboczy obiekt o objętości <M tex="|\det A|" />. Znak mówi czy
            orientacja została zachowana (+) czy odwrócona (−).
          </p>
          <p>
            Konsekwencja praktyczna: <M tex="\det A = 0" /> ⟺ A jest{" "}
            <strong>osobliwa</strong> (singular) — odwzorowuje przestrzeń do mniejszego
            wymiaru, nie jest odwracalna. To dokładnie definicja singularności
            kinematycznej w robotyce (jakobian J ma <M tex="\det J = 0" />).
          </p>

          <h4 id="odwrotnosc">Odwrotność i ortogonalność</h4>
          <p>
            <M tex="A^{-1}" /> spełnia <M tex="A A^{-1} = A^{-1} A = I" />. Istnieje
            tylko gdy <M tex="\det A \neq 0" />.
          </p>
          <p>
            <strong>Macierz ortogonalna:</strong> <M tex="Q^\top Q = I" />, czyli{" "}
            <M tex="Q^{-1} = Q^\top" />. Ogromnie tanie odwracanie — zamiast
            wywoływać numeryczną inwersję (eliminacja Gaussa, koszt <M tex="O(n^3)" />),
            wystarczy <em>przepisać współrzędne</em>. Wszystkie macierze rotacji są
            ortogonalne — stąd w kodzie zawsze widzisz <code>R^T</code> a nie <code>inv(R)</code>.
          </p>

          <p className="text-sm text-[var(--muted)] italic">
            <strong>Gdzie tego używasz dalej:</strong> mnożenie macierzy w każdej{" "}
            <a href="/modules/1-analytical-walkthrough" className="text-[var(--accent)] underline">FK</a>{" "}
            (T_0^n = T_0^1 · T_1^2 · …); transpozycja zamiast inwersji w wszystkich
            modułach kinematyki (R^T = R⁻¹); wyznacznik J w{" "}
            <a href="/modules/7-singularities" className="text-[var(--accent)] underline">M7 (singularności)</a>.
          </p>
        </StepPanel>

        <StepPanel number={3} title="SO(3) — macierze rotacji">
          <p>
            Grupa <M tex="SO(3)" /> (Special Orthogonal Group w 3D) to zbiór macierzy
            3×3 spełniających dwa warunki:
          </p>
          <MathBlock tex="R^\top R = I \quad \text{(ortogonalność)}, \qquad \det R = +1 \quad \text{(zachowuje orientację)}" />
          <p>
            To dokładnie 3 stopnie swobody (np. 3 kąty Eulera albo oś + kąt). Pomimo
            że R ma 9 elementów, tylko 3 są niezależne — pozostałe 6 jest wymuszonych
            przez ograniczenia ortogonalności.
          </p>

          <h4>Trzy elementarne rotacje</h4>
          <p>Rotacja wokół osi x o kąt α:</p>
          <MathBlock tex="R_x(\alpha) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\alpha & -\sin\alpha \\ 0 & \sin\alpha & \cos\alpha \end{bmatrix}" />
          <p>Wokół y o β:</p>
          <MathBlock tex="R_y(\beta) = \begin{bmatrix} \cos\beta & 0 & \sin\beta \\ 0 & 1 & 0 \\ -\sin\beta & 0 & \cos\beta \end{bmatrix}" />
          <p>Wokół z o γ:</p>
          <MathBlock tex="R_z(\gamma) = \begin{bmatrix} \cos\gamma & -\sin\gamma & 0 \\ \sin\gamma & \cos\gamma & 0 \\ 0 & 0 & 1 \end{bmatrix}" />
          <p>
            <strong>Składanie:</strong> rotacja „najpierw wokół z o γ, potem wokół y
            o β, potem wokół x o α" to mnożenie macierzy w kolejności <em>od prawej do lewej</em>:
          </p>
          <MathBlock tex="R = R_x(\alpha) \, R_y(\beta) \, R_z(\gamma)" />
          <p>
            Ta kolejność (xyz „intrinsic" vs „extrinsic", zyx itd.) to klasyczna pułapka
            — dlatego w aplikacji konsekwentnie używamy <em>kwaternionów</em> jako
            reprezentacji wewnętrznej, a kątów Eulera tylko do UI.
          </p>

          <p className="text-sm text-[var(--muted)] italic">
            <strong>Gdzie tego używasz dalej:</strong>{" "}
            <a href="/modules/8-orientations" className="text-[var(--accent)] underline">M8 (Reprezentacje orientacji)</a> —
            pełne porównanie macierzy rotacji, kątów Eulera, axis-angle i kwaternionów,
            z interaktywnym demo gimbal-locka.
          </p>
        </StepPanel>

        <StepPanel number={4} title="Macierz skew-symmetric — iloczyn wektorowy jako mnożenie">
          <p>
            Dla wektora <M tex="\mathbf{a} = (a_x, a_y, a_z)^\top" /> definiujemy
            macierz <strong>skew-symmetric</strong> (antysymetryczną){" "}
            <M tex="[\mathbf{a}]_\times" />:
          </p>
          <MathBlock tex="[\mathbf{a}]_\times \;=\; \begin{bmatrix} 0 & -a_z & a_y \\ a_z & 0 & -a_x \\ -a_y & a_x & 0 \end{bmatrix}" />
          <p>
            Kluczowa własność: <strong>iloczyn wektorowy zapisuje się jako mnożenie
            macierzy:</strong>
          </p>
          <MathBlock tex="\boxed{\;\mathbf{a}\times\mathbf{b} \;=\; [\mathbf{a}]_\times\,\mathbf{b}\;}" />
          <p>
            Dlaczego to istotne? Bo pozwala traktować iloczyn wektorowy jako{" "}
            <em>operację liniową</em>, co odblokowuje cały aparat algebry liniowej
            (diagonalizacja, wartości własne, gradient). W jakobianach manipulatora
            kolumny zawierają <M tex="[\hat{z}_i]_\times \mathbf{r}" /> — dzięki temu
            sam jakobian J jest macierzą, którą można odwracać/pseudoinwertować.
          </p>

          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-3 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Dlaczego nazwa „skew-symmetric"?
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <p>
                Macierz <em>symetryczna</em> spełnia <M tex="A = A^\top" />. Macierz{" "}
                <em>skew-symmetric</em> (antysymetryczna) spełnia <M tex="A = -A^\top" />.
                Tu rzeczywiście — sprawdź transponując <M tex="[\mathbf{a}]_\times" /> wyżej,
                każdy element zamienia znak.
              </p>
              <p>
                Konsekwencja: skew-symmetric matrix ma zerową przekątną i tylko 3
                niezależne elementy (powyżej przekątnej), co dokładnie odpowiada
                3 składowym wektora <M tex="\mathbf{a}" />. Stąd bijekcja:
              </p>
              <MathBlock tex="\mathbb{R}^3 \;\cong\; \mathfrak{so}(3) \quad \text{(algebra Liego SO(3))}" />
            </div>
          </details>

          <p className="text-sm text-[var(--muted)] italic">
            <strong>Gdzie tego używasz dalej:</strong>{" "}
            <a href="/modules/3-jacobian" className="text-[var(--accent)] underline">M3</a> —
            kolumny jakobianu jako <M tex="J_i = [\,[\hat z_i]_\times \mathbf{r};\;\hat z_i]" />;{" "}
            <a href="/modules/9-dynamics" className="text-[var(--accent)] underline">M9</a> —
            propagacja momentu pędu i implementacja iloczynów wektorowych w kodzie
            (Newton-Euler korzysta wprost z <code>[w]× v</code>).
          </p>
        </StepPanel>

        <StepPanel number={5} title="SE(3) — macierze jednorodne 4×4">
          <p>
            Grupa <M tex="SE(3)" /> (Special Euclidean Group w 3D) opisuje{" "}
            <strong>transformacje sztywne</strong> — rotacje + translacje. Naturalna
            reprezentacja: para <M tex="(R, \mathbf{t})" /> gdzie{" "}
            <M tex="R \in SO(3)" />, <M tex="\mathbf{t} \in \mathbb{R}^3" />. Razem 6
            stopni swobody (3 rotacji + 3 translacje).
          </p>

          <h4>Po co macierz 4×4 zamiast pary (R, t)?</h4>
          <p>
            Pojedyncza transformacja <em>punktu</em> <M tex="\mathbf{p}" />:
          </p>
          <MathBlock tex="\mathbf{p}' = R\,\mathbf{p} + \mathbf{t}" />
          <p>
            To <em>nie jest mnożenie macierzowe</em>, bo dochodzi addytywne{" "}
            <M tex="+\mathbf{t}" />. Składanie dwóch transformacji wymaga wtedy
            osobnej formuły:
          </p>
          <MathBlock tex="(R_2, \mathbf{t}_2) \circ (R_1, \mathbf{t}_1) = (R_2 R_1,\; R_2 \mathbf{t}_1 + \mathbf{t}_2)" />
          <p>
            <strong>Sztuczka:</strong> dorzucamy „wirtualną" czwartą współrzędną
            równą 1 i pakujemy R i t w jedną macierz 4×4. Wtedy zarówno transformacja
            punktu, jak i składanie transformacji <em>sprowadzają się do zwykłego
            mnożenia macierzy</em>:
          </p>

          <HomogeneousMatrixDiagram />

          <p>
            Punkt zapisujemy jako wektor 4-elementowy{" "}
            <M tex="\tilde{\mathbf{p}} = (p_x, p_y, p_z, 1)^\top" /> (wektor jednorodny):
          </p>
          <MathBlock tex="\tilde{\mathbf{p}}' = T\,\tilde{\mathbf{p}} \quad\Leftrightarrow\quad \begin{bmatrix} \mathbf{p}' \\ 1 \end{bmatrix} = \begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^\top & 1 \end{bmatrix} \begin{bmatrix} \mathbf{p} \\ 1 \end{bmatrix}" />
          <p>
            Składanie wielu transformacji to teraz po prostu iloczyn macierzy:{" "}
            <M tex="T_0^n = T_0^1 \cdot T_1^2 \cdots T_{n-1}^n" /> — i o to chodziło.
            Dlatego cała kinematyka manipulatora opiera się na tej reprezentacji
            (DH zwraca macierze 4×4).
          </p>

          <p className="text-sm text-[var(--muted)] italic">
            <strong>Gdzie tego używasz dalej:</strong>{" "}
            <a href="/modules/0-intro" className="text-[var(--accent)] underline">M0</a>,{" "}
            <a href="/modules/1-analytical-walkthrough" className="text-[var(--accent)] underline">M1</a>{" "}
            i każdy moduł kinematyki — wszystko czego dotyka FK manipulatora
            jest mnożeniem macierzy 4×4.
          </p>
        </StepPanel>

        <StepPanel number={6} title="Bryła sztywna — prędkość punktu">
          <p>
            Bryła sztywna to ciało, w którym <em>odległości między dowolnymi dwoma
            punktami</em> są niezmienne w czasie. Może się obracać i poruszać
            (translacja+rotacja jako całość), ale nie deformować.
          </p>
          <p>
            <strong>Kluczowy wzór:</strong> jeśli środek bryły O porusza się z
            prędkością <M tex="\mathbf{v}_O" />, a bryła obraca się z prędkością
            kątową <M tex="\boldsymbol\omega" />, to prędkość dowolnego punktu P
            położonego względem O w odległości <M tex="\mathbf{r}" /> wynosi:
          </p>
          <MathBlock tex="\boxed{\;\mathbf{v}_P \;=\; \mathbf{v}_O + \boldsymbol\omega\times\mathbf{r}\;}" />
          <RigidBodyVelocityDiagram />
          <p>
            Pierwsza składowa (<M tex="\mathbf{v}_O" />) — wspólna dla wszystkich punktów
            bryły (translacja jako sztywne ciało). Druga (<M tex="\boldsymbol\omega\times\mathbf{r}" />) —
            dodatkowy ruch z powodu obrotu wokół O, prostopadły do r i do osi obrotu.
          </p>
          <h4>Przyspieszenie — analogicznie ale z dwoma członami</h4>
          <p>
            Różniczkując wzór na prędkość po czasie dostajemy:
          </p>
          <MathBlock tex="\mathbf{a}_P \;=\; \mathbf{a}_O + \boldsymbol\varepsilon\times\mathbf{r} + \boldsymbol\omega\times(\boldsymbol\omega\times\mathbf{r})" />
          <p>
            Trzy składowe: dziedziczone <M tex="\mathbf{a}_O" />, <em>tangencjalne</em>{" "}
            (od <M tex="\boldsymbol\varepsilon" /> — przyspieszenia kątowego),{" "}
            <em>dośrodkowe</em> (od <M tex="\boldsymbol\omega^2" /> — zawsze skierowane
            do osi obrotu).
          </p>

          <p className="text-sm text-[var(--muted)] italic">
            <strong>Gdzie tego używasz dalej:</strong>{" "}
            <a href="/modules/9-dynamics" className="text-[var(--accent)] underline">M9 (Dynamika Newton-Euler)</a> —
            <em> dokładnie</em> te dwa wzory są stosowane do propagacji ω, ε, v, a
            od jednego ogniwa do następnego w forward sweep. Wzór na prędkość punktu
            wraca w każdym kroku 2–3 algorytmu. Bez niego dynamika manipulatora nie ma sensu.
          </p>
        </StepPanel>

        <section className="prose-ik">
          <h2>Ściąga formuł — minimum minimorum</h2>
          <p>
            Najczęściej powracające wzory, zebrane w jednym miejscu:
          </p>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] p-4 not-prose">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--panel-border)]">
                  <th className="text-left py-2 pr-3 font-semibold">Operacja</th>
                  <th className="text-left py-2 font-semibold">Wzór</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40 [&>tr]:align-baseline">
                <tr>
                  <td className="py-2 pr-3">Iloczyn skalarny</td>
                  <td className="py-2"><M tex="\mathbf{a}\cdot\mathbf{b} = |\mathbf{a}||\mathbf{b}|\cos\theta" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Iloczyn wektorowy (norma)</td>
                  <td className="py-2"><M tex="|\mathbf{a}\times\mathbf{b}| = |\mathbf{a}||\mathbf{b}|\sin\theta" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Iloczyn wektorowy (macierz)</td>
                  <td className="py-2"><M tex="\mathbf{a}\times\mathbf{b} = [\mathbf{a}]_\times\,\mathbf{b}" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Macierz ortogonalna</td>
                  <td className="py-2"><M tex="Q^\top Q = I,\; Q^{-1} = Q^\top" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Transpozycja iloczynu</td>
                  <td className="py-2"><M tex="(AB)^\top = B^\top A^\top" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">SE(3) — punkt jednorodny</td>
                  <td className="py-2"><M tex="\tilde{\mathbf{p}}' = T\,\tilde{\mathbf{p}}" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Prędkość punktu na bryle</td>
                  <td className="py-2"><M tex="\mathbf{v}_P = \mathbf{v}_O + \boldsymbol\omega\times\mathbf{r}" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Przyspieszenie punktu na bryle</td>
                  <td className="py-2"><M tex="\mathbf{a}_P = \mathbf{a}_O + \boldsymbol\varepsilon\times\mathbf{r} + \boldsymbol\omega\times(\boldsymbol\omega\times\mathbf{r})" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="prose-ik">
          <h2>Co dalej</h2>
          <p>
            Mając te narzędzia, jesteś gotów na pozostałe moduły:
          </p>
          <ul>
            <li><a href="/modules/0-intro" className="text-[var(--accent)] underline">M0 — Wprowadzenie do IK</a>: ustawienie problemu, klasyfikacja metod.</li>
            <li><a href="/modules/1-analytical-walkthrough" className="text-[var(--accent)] underline">M1 — Analityczne wyprowadzenie dla Pumy 560</a>: krok po kroku ręczne wyprowadzenie wzorów.</li>
            <li><a href="/modules/8-orientations" className="text-[var(--accent)] underline">M8 — Reprezentacje orientacji</a>: rozszerzenie sekcji 3 (SO(3)) o kwaterniony i axis-angle.</li>
            <li><a href="/modules/9-dynamics" className="text-[var(--accent)] underline">M9 — Dynamika Newton-Euler</a>: gdzie sekcje 1, 4, 6 (wektory, skew-symmetric, bryła sztywna) zaczynają intensywnie pracować.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
