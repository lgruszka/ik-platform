import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { JointSliders } from "@/components/robot/joint-sliders";
import { ManipulabilityViewer } from "@/components/singularities/manipulability-viewer";
import { ManipulabilityDisplay } from "@/components/singularities/manipulability-display";
import { ManipulabilityProfile } from "@/components/singularities/manipulability-profile";

export default function Module7() {
  return (
    <>
      <ModuleHeader slug="7-singularities" />
      <div className="px-8 py-8 max-w-5xl space-y-10">

        <section className="prose-ik">
          <h2>Singularności — matematyka i skutki</h2>
          <p>
            <em>Singularność kinematyczna</em> to konfiguracja{" "}
            <M tex="q" />, w której jakobian <M tex="J(q) \in \mathbb{R}^{6 \times n}" /> traci pełny rząd:
            <M tex="\mathrm{rank}\,J(q) < 6" />. Fizycznie oznacza to, że pewien
            kierunek ruchu w przestrzeni zadaniowej (liniowy lub kątowy) jest
            niedostępny niezależnie od wyboru{" "}
            <M tex="\dot q" />. Ten sam warunek zapisany algebraicznie:
          </p>
          <MathBlock tex="\det(J\,J^\top) = 0 \quad\Leftrightarrow\quad \exists\; \xi \in \mathbb{R}^6 \setminus \{0\}:\; \xi^\top J = 0" />
          <p>
            Konsekwencje praktyczne:
          </p>
          <ul>
            <li>
              <strong>Utrata DOF zadaniowego</strong> — lokalnie manipulator
              przestaje być w stanie realizować pewne ruchy TCP.
            </li>
            <li>
              <strong>Numeryczna eksplozja</strong> — pseudoinwersja{" "}
              <M tex="J^+" /> ma wyznacznik dążący do zera, więc{" "}
              <M tex="\Delta q = J^{+}\mathbf{e}" /> staje się dowolnie duże.
              W rezultacie przeguby fizyczne są „pchane" poza ograniczenia
              mechaniczne lub dynamiczne.
            </li>
            <li>
              <strong>Niejednoznaczność rozwiązania analitycznego</strong> —
              dwie lub więcej gałęzi rozwiązań zlewa się w jedną (elbow up ≡ elbow down przy wyprostowanym łokciu).
            </li>
          </ul>
        </section>

        <StepPanel number={1} title="Trzy typowe singularności Puma560">
          <p>
            Dla manipulatora 6-DOF z nadgarstkiem sferycznym wyróżniamy trzy typy:
          </p>
          <ul>
            <li>
              <strong>Singularność nadgarstka</strong>: osie 4 i 6 stają się równoległe.
              Matematycznie <M tex="\sin q_5 = 0" /> (wyrównanie środkowego
              przegubu). Konsekwencja: <M tex="q_4" /> i <M tex="q_6" /> stają
              się redundantne — jedynie ich suma jest określona przez wybraną orientację.
            </li>
            <li>
              <strong>Singularność łokcia</strong>: łokieć wyprostowany, czyli
              <M tex="\sin q_3 = 0" />. Ramię osiąga maksymalny zasięg; nie
              można się dalej „wyciągnąć" w kierunku radialnym.
            </li>
            <li>
              <strong>Singularność barku</strong>: środek nadgarstka znajduje się
              na osi przegubu 1 (<M tex="p_x^2 + p_y^2 = d_3^2" />). <M tex="q_1" />{" "}
              staje się nieokreślone — dowolny obrót bazy nie zmienia pozycji TCP.
            </li>
          </ul>
          <p>
            W praktyce warto unikać każdej z tych trzech; najbardziej dokuczliwa
            jest singularność nadgarstka, bo pojawia się „w środku" przestrzeni
            roboczej i jest łatwa do napotkania przy typowych zadaniach (narzędzie
            prostopadłe do stołu, ramię wyprostowane).
          </p>
        </StepPanel>

        <StepPanel number={2} title="Miara manipulacyjności Yoshikawy">
          <p>
            Yoshikawa (1985) zaproponował skalarną miarę odległości konfiguracji
            od singularności:
          </p>
          <MathBlock tex="w(q) = \sqrt{\det\!\bigl(J(q)\,J(q)^\top\bigr)}" />
          <p>
            Dla <M tex="n = 6" /> i kwadratowego <M tex="J" /> upraszcza się do
            <M tex="w = |\det J|" />. Geometrycznie: objętość{" "}
            <em>elipsoidy manipulacyjności</em> rozpiętej w przestrzeni TCP
            przez kolumny jakobianu.
          </p>
          <p>
            Alternatywne miary:
          </p>
          <ul>
            <li>
              Najmniejsza wartość osobliwa <M tex="\sigma_{\min}(J)" /> — bardziej
              czuła niż wyznacznik (patrzy na najsłabszy kierunek, nie iloczyn).
            </li>
            <li>
              Warunkowanie <M tex="\kappa(J) = \sigma_\max / \sigma_\min" /> —
              jakość numeryczna; wysokie <M tex="\kappa" /> sygnalizuje pośrednią singularność.
            </li>
            <li>
              „Manipulability index" oddzielnie dla translacji i rotacji (przydatne,
              gdy priorytetem jest pozycja lub orientacja).
            </li>
          </ul>
        </StepPanel>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Laboratorium singularności</h2>
          <p className="text-[var(--muted)]">
            Zmień wartości przegubów (szczególnie <M tex="q_3" /> i <M tex="q_5" />) i obserwuj zmiany w miarach i kształcie elipsoidy manipulacyjności. Elipsoida „spłaszczona" wzdłuż jednej osi wskazuje na kierunek, w którym prędkość TCP jest niemal niedostępna.
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <ManipulabilityViewer />
            <div className="space-y-4">
              <JointSliders />
              <ManipulabilityDisplay />
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Elipsoida: półosi = <M tex="\sigma_i(J_{\mathrm{pos}})" /> (wartości osobliwe jakobianu pozycyjnego), kierunki = odpowiadające wektory osobliwe lewostronne. W skrajnej singularności jedna półoś dąży do 0 i elipsoida zapada się w dysk/odcinek.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Profile manipulacyjności przez przestrzeń przegubową</h2>
          <p className="text-[var(--muted)]">
            Poniższe wykresy pokazują wartość <M tex="w(q)" />, gdy jeden z
            przegubów przejeżdża cały swój zakres (pozostałe trzymane w bieżącej
            wartości). Spadki do 0 to właśnie singularności.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <ManipulabilityProfile jointIdx={2}/>
            <ManipulabilityProfile jointIdx={4}/>
          </div>
        </section>

        <section className="prose-ik">
          <h2>Strategie omijania singularności</h2>
          <ul>
            <li>
              <strong>DLS / Adaptive DLS</strong> (moduł 3) — tłumienie
              regularyzujące pseudoinwersję; solver nie rozbiega się, kosztem
              błędu residualnego przy singularności.
            </li>
            <li>
              <strong>Rzutowanie na przestrzeń zerową</strong> (null-space projection)
              dla manipulatorów redundantnych (<M tex="n > 6" />): drugorzędny cel
              to maksymalizacja <M tex="w(q)" />, rzutowana na przestrzeń zerową
              <M tex="\,\mathcal{N}(J)" />:{" "}
              <M tex="\dot q_0 = (I - J^+ J)\,\nabla w(q)" />.
            </li>
            <li>
              <strong>Planowanie trajektorii z barierą</strong> — dodaj do kosztu
              trajektorii penalty <M tex="-\gamma \log w(q)" /> wymuszający
              zachowanie marginesu. Działa w SQP / trust-region IK z modułu 4.
            </li>
            <li>
              <strong>Zmiana rodziny rozwiązań</strong> — przy zbliżaniu do
              singularności przełącz się na inną gałąź rozwiązań analitycznych
              (moduł 2). Wymaga analitycznego solvera i planowania "w przód".
            </li>
          </ul>

          <h2>Uwaga dydaktyczna</h2>
          <p>
            Singularności to nie tylko „błąd numeryczny" — to cecha geometryczna
            manipulatora, której <strong>nie można</strong> ominąć konstrukcyjnie
            bez dodania stopni swobody (robot redundantny) lub zmiany geometrii.
            Zrozumienie, że miara <M tex="w(q)" /> nie jest „jakąś metryką", lecz
            objętością odwzorowania różniczkowego <M tex="J(q)" />, daje
            studentowi solidne podstawy do dalszej pracy z jakobianami drugiego
            rzędu (Hessiany), dynamiką Lagrange&apos;a i sterowaniem adaptacyjnym.
          </p>
        </section>
      </div>
    </>
  );
}
