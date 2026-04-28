import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { TargetPoseInput } from "@/components/walkthrough/target-pose-input";
import { Puma560Playground } from "@/components/robot/puma560-playground";
import { SolverComparison } from "@/components/jacobian/solver-comparison";
import { NewtonMethod1DDiagram } from "@/components/jacobian/newton-1d-diagram";
import { IterationFlowDiagram } from "@/components/jacobian/iteration-flow-diagram";
import { JacobianIntuitionDiagram } from "@/components/jacobian/jacobian-intuition-diagram";

export default function Module3() {
  return (
    <>
      <ModuleHeader slug="3-jacobian" />
      <div className="px-8 py-8 max-w-5xl space-y-10">

        <section className="prose-ik">
          <h2>Dlaczego nie zamkniętą formułą?</h2>
          <p>
            Metoda analityczna (moduły 1–2) daje dokładne rozwiązanie — ale
            tylko dla robotów spełniających warunek Piepera. Nowoczesne
            manipulatory 7-DOF (KUKA LBR iiwa, Franka Panda), koboty z
            nietypową geometrią czy roboty chirurgiczne często tego warunku{" "}
            <em>nie spełniają</em>. Wyprowadzenie zamkniętych wzorów staje się
            algebraicznym koszmarem — a w granicznych przypadkach zamknięte
            rozwiązanie po prostu nie istnieje w klasie funkcji elementarnych.
          </p>
          <p>
            Potrzebujemy więc solverów <em>numerycznych</em> — działających dla
            <strong> dowolnego</strong> manipulatora, nawet jeśli równania są
            nieliniowe w sposób, który uniemożliwia ich odwrócenie ręcznie.
            Wszystkie metody tego modułu oparte są na jednym pomyśle:{" "}
            <strong>linearyzacji przez Jakobian</strong>.
          </p>

          <h2>Intuicja: metoda Newtona w jednym wymiarze</h2>
          <p>
            Zanim przejdziemy do przestrzeni konfiguracji 6-DOF, popatrzmy na
            analogiczny problem w 1D. Chcemy rozwiązać równanie{" "}
            <M tex="f(x) = 0" /> dla pewnej gładkiej, nieliniowej funkcji{" "}
            <M tex="f" />. Bez zamkniętej formuły — używamy{" "}
            <strong>metody Newtona–Raphsona</strong>:
          </p>
          <ol>
            <li>Zgadujemy startową wartość <M tex="x_0" />.</li>
            <li>Liczymy styczną do wykresu w punkcie <M tex="(x_0, f(x_0))" />.</li>
            <li>Przedłużamy styczną do przecięcia z osią X — nowe przybliżenie{" "}
              <M tex="x_1 = x_0 - f(x_0)/f'(x_0)" />.</li>
            <li>Powtarzamy: <M tex="x_2" /> ze stycznej w <M tex="x_1" />, i tak dalej.</li>
          </ol>
          <p>
            Każda kolejna styczna „lepiej się dopasowuje" do miejsca zerowego{" "}
            <M tex="x^*" />. Po kilku iteracjach osiągamy dowolną precyzję:
          </p>
          <NewtonMethod1DDiagram />
          <p>
            Kluczowe spostrzeżenie: w jednym kroku <em>nie próbujemy</em> od
            razu trafić w rozwiązanie. Zamiast tego zastępujemy{" "}
            <em>trudną, nieliniową</em> funkcję <M tex="f" /> jej{" "}
            <em>łatwą, liniową</em> aproksymacją (styczną) i rozwiązujemy
            problem liniowy — który umiemy. Dopiero powtarzanie tego schematu
            doprowadza nas do celu.
          </p>

          <h2>Czym właściwie jest Jakobian?</h2>
          <p>
            W 1D rolę „wrażliwości" wyjścia na wejście pełni{" "}
            <strong>pochodna</strong> <M tex="f'(x)" />. Mówi ona: „jeżeli
            zmienię <M tex="x" /> o jednostkę, to <M tex="y = f(x)" /> zmieni
            się w przybliżeniu o <M tex="f'(x)" /> jednostek". W robotyce
            mamy wejście <M tex="q = (q_1, \dots, q_n)" /> (kąty przegubów)
            i wyjście <M tex="\xi = (v_x, v_y, v_z, \omega_x, \omega_y, \omega_z)" />{" "}
            (prędkość liniowa i kątowa końcówki) — <em>sześć</em> liczb wyjścia,{" "}
            <em>n</em> liczb wejścia. „Pochodna" takiego odwzorowania to{" "}
            <strong>macierz</strong> — właśnie <strong>Jakobian</strong>{" "}
            <M tex="J(q) \in \mathbb{R}^{6 \times n}" />:
          </p>
          <MathBlock tex="J(q) \;=\; \begin{bmatrix} \dfrac{\partial v_x}{\partial q_1} & \cdots & \dfrac{\partial v_x}{\partial q_n} \\[2pt] \vdots & \ddots & \vdots \\[2pt] \dfrac{\partial \omega_z}{\partial q_1} & \cdots & \dfrac{\partial \omega_z}{\partial q_n} \end{bmatrix}" />
          <p>
            <strong>Wiersze macierzy</strong> odpowiadają sześciu składowym
            prędkości końcówki (3 translacyjne + 3 obrotowe).{" "}
            <strong>Kolumny macierzy</strong> odpowiadają poszczególnym
            przegubom — każda kolumna <M tex="J_i" /> mówi, jak{" "}
            <em>jednostkowa</em> prędkość <em>i</em>-tego przegubu wpływa na
            końcówkę:
          </p>
          <JacobianIntuitionDiagram />
          <p>
            Innymi słowy: wyobraź sobie, że obracasz tylko <em>jeden</em>{" "}
            przegub, resztę trzymasz nieruchomo. Końcówka zakreśla łuk —
            lokalnie wektor jej prędkości to właśnie <em>kolumna</em>{" "}
            Jakobianu odpowiadająca temu przegubowi. Jeśli wszystkie przeguby
            obracają się jednocześnie, ich wkłady się <em>dodają</em>{" "}
            liniowo (bo różniczkowanie jest liniowe):
          </p>
          <MathBlock tex="\xi \;=\; J_1(q)\,\dot q_1 + J_2(q)\,\dot q_2 + \cdots + J_n(q)\,\dot q_n \;=\; J(q)\,\dot q" />
          <p>
            <strong>Trzy kluczowe rzeczy do zapamiętania o Jakobianie:</strong>
          </p>
          <ol>
            <li>
              <strong>Jakobian zależy od <M tex="q" />.</strong> To nie jest
              „stała macierz robota" — to pochodna cząstkowa <em>w konkretnym
              punkcie</em>. Gdy zmieniasz konfigurację, Jakobian się zmienia.
              Stąd w pętli iteracyjnej musimy go przeliczać za każdym razem.
            </li>
            <li>
              <strong>Jakobian łączy prędkości, nie pozycje.</strong> Relacja{" "}
              <M tex="\xi = J\dot q" /> jest między prędkością końcówki a
              prędkościami przegubów. Dla małych przyrostów (lokalnie) mamy{" "}
              <M tex="\Delta x \approx J \, \Delta q" /> — stąd iteracyjne
              rozwiązanie IK.
            </li>
            <li>
              <strong>Dla przegubów obrotowych istnieje jawny wzór.</strong>{" "}
              Nie trzeba różniczkować symbolicznie — kolumnę <M tex="J_i" />{" "}
              można zapisać geometrycznie (zobacz StepPanel 1 niżej): wkład do
              prędkości <em>liniowej</em> końcówki to{" "}
              <M tex="\hat{\mathbf{z}}_i \times (\mathbf{p}_\text{ee} - \mathbf{p}_i)" />{" "}
              (iloczyn wektorowy osi obrotu z wektorem „promień od osi do
              końcówki"); wkład do prędkości <em>kątowej</em> — to sama oś{" "}
              <M tex="\hat{\mathbf{z}}_i" />. Dla przegubu przesuwnego jest
              jeszcze prościej: tylko wkład liniowy <M tex="\hat{\mathbf{z}}_i" />,
              zero wkładu kątowego.
            </li>
          </ol>

          <h2>Newton w 6 wymiarach — powrót do IK</h2>
          <p>
            Teraz łączymy obie intuicje. W IK rozwiązujemy{" "}
            <M tex="\mathbf{F}(q) = \mathbf{0}" />, gdzie{" "}
            <M tex="\mathbf{F}(q) = T^{*} \ominus f(q)" /> jest wektorowym
            błędem pozy (6-wymiarowym — translacja + rotacja). W metodzie
            Newtona rolę „dzielenia przez pochodną" (z 1D) pełni{" "}
            <strong>pseudoinwersja Jakobianu</strong> <M tex="J^\dagger" />:
          </p>
          <MathBlock tex="\underbrace{x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}}_{\text{1D Newton}} \quad\longrightarrow\quad \underbrace{q_{k+1} = q_k + J^{\dagger}(q_k)\,\mathbf{e}(q_k)}_{\text{6D Newton dla IK}}" />
          <p>
            (znak się odwraca, bo definiujemy błąd jako <M tex="\mathbf{e} = T^* \ominus f(q)" />,{" "}
            nie <M tex="f(q) - T^*" />, ale struktura kroku jest identyczna).
            Resztę wariantów — Jacobian Transpose, DLS, Adaptive DLS —
            zobaczymy niżej jako <em>modyfikacje</em> tego samego kroku, różnie
            radzące sobie z trudnościami, gdy Jakobian jest źle uwarunkowany.
          </p>
        </section>

        <section className="prose-ik">
          <h2>Anatomia pojedynczej iteracji</h2>
          <p>
            Pojedyncza iteracja solvera Jakobianowego to pięć etapów
            wykonywanych w stałej kolejności. Po piątym sprawdzamy warunek
            stopu i albo kończymy, albo wracamy do pierwszego z nową wartością{" "}
            <M tex="q" />:
          </p>
          <IterationFlowDiagram />
          <p>
            Zauważ: <M tex="J" /> liczymy <strong>od nowa</strong> w każdej
            iteracji — bo zależy od aktualnego <M tex="q_k" />. To nie jest
            „statyczna macierz robota"; to pochodna cząstkowa wyliczana w
            bieżącym punkcie przestrzeni konfiguracji. Gdyby FK była liniowa,
            wystarczyłaby jedna iteracja (tak jak Newton na funkcji liniowej
            trafia w zero od razu). FK jest silnie nieliniowe — stąd
            konieczność pętli.
          </p>

          <h3>Pseudokod</h3>
          <pre><code>{`q ← q_seed              // zgadnięta/znana konfiguracja startowa
for k = 0, 1, 2, … do
    T_k ← FK(q)                            // 1. FK
    e_k ← twist_error(T_k, T_target)       // 2. błąd w SE(3)
    if  ‖e_k‖  <  ε  then  return  q       //    warunek stopu
    J_k ← jacobian(q)                      // 3. jakobian w aktualnym punkcie
    Δq  ← solve_step(J_k, e_k, method)     // 4. krok (Transpose / Pinv / DLS / SDLS)
    q   ← q + α · Δq                       // 5. aktualizacja (α = step size)
end for
return  q  // osiągnięto limit iteracji bez zbieżności`}</code></pre>

          <h3>Klucz do zrozumienia — dwa poziomy „nieliniowości"</h3>
          <ul>
            <li>
              <strong>Zewnętrzna pętla po iteracjach</strong> — to ta, która
              pozwala nam pokonać nieliniowość FK. Po każdym kroku{" "}
              <em>linearyzujemy od nowa</em> w nowym punkcie <M tex="q_k" />.
            </li>
            <li>
              <strong>Wewnętrzny krok liniowy</strong> — rozwiązujemy układ{" "}
              <M tex="J\,\Delta q = e" />. To jest łatwe (algebra liniowa), ale
              wrażliwe: przy złym uwarunkowaniu <M tex="J" /> krok staje się
              ogromny, a wtedy punkt <M tex="q_{k+1}" /> wylatuje poza obszar,
              w którym linearyzacja obowiązywała. Stąd modyfikacje — tłumienie,
              ograniczanie kroku — które poznamy dalej.
            </li>
          </ul>

          <h3>Co oznacza „zbieżność" i kiedy jej brak</h3>
          <p>
            Zbieżność to spadek normy błędu <M tex="\|\mathbf{e}_k\|" /> do
            zera. W dobrym przypadku spadek jest{" "}
            <strong>kwadratowy</strong> (przy pełnym Newtonie i pseudoinwersji
            w okolicy rozwiązania): błąd w iteracji <M tex="k+1" /> jest
            proporcjonalny do <em>kwadratu</em> błędu w iteracji <M tex="k" />.
            Oznacza to, że liczba cyfr dokładnych się podwaja z każdym krokiem.
          </p>
          <p>
            Co może pójść nie tak:
          </p>
          <ul>
            <li>
              <strong>Rozbieżność</strong> — gdy krok <M tex="\Delta q" /> jest
              za duży (np. w pobliżu singularności <M tex="J" /> źle
              uwarunkowana), <M tex="q_{k+1}" /> skacze do obszaru, gdzie
              linearyzacja już nie ma sensu. Kolejne iteracje pogłębiają
              problem. Ratunek: tłumienie (DLS) albo line-search.
            </li>
            <li>
              <strong>Oscylacje</strong> — solver skacze w okolicy rozwiązania
              zamiast wpadać do niego. Typowe dla Jacobian Transpose ze zbyt
              dużym <M tex="\alpha" />, albo metod bez adaptacyjnego kroku.
            </li>
            <li>
              <strong>Stagnacja</strong> — krok staje się mikroskopijny (np.{" "}
              <M tex="J^\top \mathbf{e} \approx 0" /> gdy Transpose trafi w
              lokalny pseudominimalny punkt). Solver „utyka" bez osiągnięcia
              tolerancji.
            </li>
            <li>
              <strong>Zbieg do innej gałęzi</strong> — dla Pumy mamy 8
              rozwiązań; iteracyjny solver przyciąga się do tego, które jest{" "}
              <em>najbliższe</em> seedowi. Zmiana seeda może dać inną gałąź.
              To nie jest błąd — to cecha metody.
            </li>
          </ul>
          <p>
            W panelu „Porównanie na żywo" niżej zobaczysz te zjawiska w
            praktyce: Transpose często stagnuje (potrzebuje tysięcy iteracji),
            Pseudoinwersja bywa niestabilna przy singularnościach, DLS jest
            niezawodny ale z residualnym błędem, Adaptive DLS łączy zalety
            obydwu.
          </p>
        </section>

        <StepPanel number={1} title="Jakobian geometryczny — definicja">
          <p>
            Niech <M tex="f: Q \to SE(3)" /> będzie FK. Różniczka Frécheta{" "}
            <M tex="df_q: T_q Q \to T_{f(q)} SE(3) \cong \mathfrak{se}(3) = \mathbb{R}^6" />{" "}
            zapisana w bazie standardowej daje macierz 6×n zwaną{" "}
            <strong>jakobianem geometrycznym</strong>:
          </p>
          <MathBlock tex="J(q) \;=\; \bigl[\,J_1(q)\;|\;J_2(q)\;|\;\cdots\;|\;J_n(q)\,\bigr] \in \mathbb{R}^{6 \times n}" />
          <p>Dla przegubu obrotowego <em>i</em> kolumna ma postać:</p>
          <MathBlock tex="J_i(q) \;=\; \begin{bmatrix} \hat{z}_i \times (\mathbf{p}_{\text{ee}} - \mathbf{p}_i) \\ \hat{z}_i \end{bmatrix}" />
          <p>
            gdzie <M tex="\hat{z}_i" /> jest jednostkowym wektorem osi obrotu
            przegubu <em>i</em> w ramce bazowej, a <M tex="\mathbf{p}_i" /> —
            dowolnym punktem na tej osi (w implementacji: początek układu współrzędnych{" "}
            <em>i</em>-tej). Dla przegubu przesuwnego:
            <M tex="J_i = [\hat{z}_i;\; \mathbf{0}]" />.
          </p>
          <p>
            Sens fizyczny: <M tex="J_i" /> to wkład jednostkowej prędkości{" "}
            <M tex="\dot q_i" /> do wektora prędkości przestrzennej efektora{" "}
            <M tex="\xi = [\mathbf{v};\, \boldsymbol{\omega}]^\top" />, a
            całościowo:
          </p>
          <MathBlock tex="\xi = J(q)\,\dot q" />
          <p>
            Nieliniowy problem IK staje się <strong>lokalnie</strong> liniowy:
          </p>
          <MathBlock tex="\mathbf{e}(q) \approx J(q)\,\Delta q \quad \Rightarrow \quad \Delta q = J^{\dagger}(q)\,\mathbf{e}(q)" />
          <p>gdzie <M tex="\mathbf{e}(q)" /> to <em>twist error</em>:</p>
          <MathBlock tex="\mathbf{e}(q) = \begin{bmatrix} \mathbf{p}^* - \mathbf{p}(q) \\ \log\!\bigl(R^*\,R(q)^\top\bigr) \end{bmatrix}" />
          <p>
            Część obrotowa to <strong>logarytm SO(3)</strong> — wektor
            <M tex="\boldsymbol{\omega} = \theta\,\hat{k}" /> reprezentujący
            obrót, który trzeba wykonać, by przejść z aktualnej orientacji do
            zadanej. Dla małych obrotów pokrywa się to z różnicą kątów
            Eulera, ale w ogólnym przypadku wymaga świadomej ekstrakcji osi i
            kąta z <M tex="R \in SO(3)" />.
          </p>
        </StepPanel>

        <StepPanel number={2} title="Metoda I — Jacobian Transpose">
          <p>
            Najprostsza iteracja: zamiast odwracać <M tex="J" />, użyj jego
            transpozycji jako przybliżenia pseudoinwersji (kierunek ten sam,
            skala nieodpowiednia):
          </p>
          <MathBlock tex="\Delta q = \alpha\,J^{\top}\,\mathbf{e}" />
          <p>
            Metoda jest w istocie <strong>gradientem zstępowania</strong> na{" "}
            <M tex="\tfrac{1}{2}\|\mathbf{e}\|^2" /> — pochodna względem{" "}
            <M tex="q" /> to <M tex="-J^\top \mathbf{e}" />. Optymalny krok
            (wzdłuż Jᵀe minimalizujący błąd liniowy) znajduje się z:
          </p>
          <MathBlock tex="\alpha^* = \frac{\langle \mathbf{e},\; J J^\top \mathbf{e}\rangle}{\|J J^\top \mathbf{e}\|^2}" />
          <p>
            Zalety: nie wymaga rozwiązywania układu liniowego (tylko macierz-wektor),
            jest odporny na singularności (Jᵀ nigdy nie "wybucha"). Wady:
            zbieżność <em>liniowa</em> — setki–tysiące iteracji dla średnich
            pozycji docelowych.
          </p>
          <pre><code>{`const JtE  = matvec(Jᵀ, e);
const JJtE = matvec(J, JtE);
const α    = (e·JJtE) / (JJtE·JJtE);
Δq = JtE.map(v => α * v);`}</code></pre>
        </StepPanel>

        <StepPanel number={3} title="Metoda II — Pseudoinwersja Moore–Penrose">
          <p>
            Bezpośrednie odwrócenie liniowego modelu. Dla <M tex="n \geq 6" />{" "}
            (kwadratowego lub nadokreślonego) prawostronna inwersja
            minimalizująca <M tex="\|\Delta q\|" />:
          </p>
          <MathBlock tex="J^{\dagger} = J^{\top}\,(J\,J^{\top})^{-1}, \qquad \Delta q = J^{\dagger}\,\mathbf{e}" />
          <p>
            Implementacyjnie: rozwiązujemy <M tex="J J^\top y = \mathbf{e}" />{" "}
            (układ 6×6), a potem <M tex="\Delta q = J^\top y" />.
          </p>
          <p>
            <strong>Problem singularności:</strong> gdy{" "}
            <M tex="\det(J J^\top) \to 0" /> (np.{" "}
            <M tex="q_5 \to 0" /> dla nadgarstka sferycznego),{" "}
            <M tex="(J J^\top)^{-1}" /> ma bardzo duże wartości własne. Krok{" "}
            <M tex="\Delta q" /> staje się ogromny → linearyzacja jest
            nieważna → solver rozbiega się lub „skacze" przez singularność.
          </p>
          <p>
            Dla 7-DOF i innych manipulatorów redundantnych (<M tex="n > 6" />)
            wariant <em>right pseudoinverse</em> pozostawia{" "}
            <strong>przestrzeń zerową</strong> jakobianu (ang. null-space){" "}
            <M tex="\mathcal{N}(J)" /> nietrywialną — czyli istnieją niezerowe
            zmiany kątów przegubów, które nie zmieniają pozy efektora. Można je
            wykorzystać do spełnienia dodatkowych ograniczeń (kolizje, limity
            przegubowe). Temat rozwiniemy w module 7.
          </p>
        </StepPanel>

        <StepPanel number={4} title="Metoda III — Damped Least Squares (Levenberg–Marquardt)">
          <p>
            Kompromis między pseudoinwersją (szybka, niestabilna) a transpozycją
            (powolna, stabilna): dodaj tłumienie <M tex="\lambda^2 I" /> do
            macierzy, którą odwracasz:
          </p>
          <MathBlock tex="\Delta q = J^{\top}\,(J J^\top + \lambda^2 I)^{-1}\,\mathbf{e}" />
          <p>
            Równoważnie <M tex="\Delta q" /> minimalizuje funkcjonał:
          </p>
          <MathBlock tex="\Delta q = \arg\min_{\Delta q}\;\|\mathbf{e} - J\,\Delta q\|^2 + \lambda^2\,\|\Delta q\|^2" />
          <p>
            To klasyczne tłumienie Tichonowa: <M tex="\lambda" /> jest kosztem
            za każde jednostkowe przemieszczenie <M tex="\Delta q" />. Macierz{" "}
            <M tex="J J^\top + \lambda^2 I" /> jest zawsze dodatnio określona
            (nawet przy pełnej singularności <M tex="J" />), więc solver
            pozostaje stabilny. Kosztem jest <strong>błąd residualny</strong>{" "}
            <M tex="\sim \lambda" /> — idealnie zerowa zbieżność wymaga <M tex="\lambda \to 0" />,
            co przywraca problemy pseudoinwersji.
          </p>
          <p>
            Levenberg i Marquardt zaproponowali tę formę w kontekście
            nieliniowego najmniejszych kwadratów; dla IK jest to de facto
            standard przemysłowy (używany m.in. w ROS MoveIt jako
            <code>KDL Inverse Kinematics</code>).
          </p>
        </StepPanel>

        <StepPanel number={5} title="Metoda IV — Adaptive DLS (tłumienie zależne od residuum)">
          <p>
            Słabość stałego <M tex="\lambda" />: za małe ⇒ problemy w
            singularności; za duże ⇒ wolna zbieżność daleko od celu. Praktyczna
            heurystyka (Levenberg-Marquardt-style):
          </p>
          <MathBlock tex="\lambda_{\text{eff}}(\mathbf{e}) = \max\!\bigl(\lambda_0,\; c\,\|\mathbf{e}\|\bigr)" />
          <p>
            Daleko od celu (<M tex="\|\mathbf{e}\|" /> duże) —{" "}
            <M tex="\lambda_{\text{eff}}" /> duże, krok ostrożny. Blisko celu —
            <M tex="\lambda_{\text{eff}} \to \lambda_0" />, zbieżność tight.
            Wariant dodatkowy: kap wielkości kroku per-przegub (tu 0,3 rad),
            zapobiega „przeskokom" przy dużej linearyzacji.
          </p>
          <p>
            <strong>Buss–Kim (2005) Selectively DLS</strong>: prawdziwy SDLS
            używa SVD <M tex="J = U\Sigma V^\top" /> i tłumi każdy kierunek
            osobno zależnie od <M tex="\sigma_i" />. Dla celów dydaktycznych
            pokazujemy powyższy uproszczony wariant, który ma ten sam efekt
            ilościowy bez kosztu SVD.
          </p>
        </StepPanel>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Porównanie na żywo</h2>
          <p className="text-[var(--muted)]">
            Cztery solvery startują z tego samego seeda (konfiguracja głównego
            kontrolera) i zmierzają do tej samej pozy docelowej{" "}
            <M tex="T^*" />. Zobaczysz to, co odróżnia dobry solver od
            „papierowego": liczbę iteracji, czas i — krytyczne — stabilność
            przy trudnych celach (spróbuj pozy bliskiej wyciągnięcia ramienia
            lub wyrównania osi nadgarstka).
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <Puma560Playground height={360} />
            <TargetPoseInput />
          </div>
          <SolverComparison />
        </section>

        <section className="prose-ik">
          <h2>Syntetyczne porównanie</h2>
          <table>
            <thead>
              <tr>
                <th>Aspekt</th>
                <th>Transpose</th>
                <th>Pinv</th>
                <th>DLS</th>
                <th>Adapt. DLS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Koszt iteracji</td>
                <td>O(n²)</td>
                <td>O(n³)</td>
                <td>O(n³)</td>
                <td>O(n³)</td>
              </tr>
              <tr>
                <td>Liczba iteracji</td>
                <td>~10³</td>
                <td>~10</td>
                <td>~10²</td>
                <td>~10²</td>
              </tr>
              <tr>
                <td>Singularności</td>
                <td>odporny</td>
                <td><strong>rozbiega się</strong></td>
                <td>odporny (z błędem ~λ)</td>
                <td>odporny + precyzyjny</td>
              </tr>
              <tr>
                <td>Implementacja</td>
                <td>trywialna</td>
                <td>prosta</td>
                <td>prosta</td>
                <td>z heurystyką</td>
              </tr>
              <tr>
                <td>W praktyce używany?</td>
                <td>rzadko</td>
                <td>tak, z zabezpieczeniami</td>
                <td><strong>tak — standard</strong></td>
                <td>tak — RMS, MoveIt</td>
              </tr>
            </tbody>
          </table>

          <h2>Co dalej</h2>
          <p>
            W module 4 sformułujemy IK jako problem <em>optymalizacji z
            ograniczeniami</em> (ograniczenia przegubowe, unikanie kolizji,
            multi-cel) i zastosujemy solvery globalne (Nelder–Mead, SQP,
            ewolucyjne). W module 7 wrócimy do tematu manipulacyjności i
            pokażemy, jak analiza SVD Jakobianu daje operatywną miarę odległości od
            singularności — i jak można ją włączyć jako dodatkowy cel
            optymalizacyjny w przestrzeni zerowej jakobianu.
          </p>
        </section>
      </div>
    </>
  );
}
