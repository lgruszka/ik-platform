import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { Es5Playground } from "@/components/dynamics/es5-playground";
import { TorqueDisplay } from "@/components/dynamics/torque-display";
import { TorqueChart } from "@/components/dynamics/torque-chart";
import { NumericalExampleM9 } from "@/components/dynamics/numerical-example-m9";
import { CheatSheetM9 } from "@/components/dynamics/cheat-sheet-m9";
import { DissertationFigure } from "@/components/dynamics/dissertation-figure";
import { NotationLegend } from "@/components/dynamics/notation-legend";
import { WhyTwoSweeps } from "@/components/dynamics/why-two-sweeps";
import { SingleBodyDiagram } from "@/components/dynamics/single-body-diagram";
import { NewtonEulerSweepDiagram } from "@/components/dynamics/newton-euler-sweep-diagram";
import { TwoLinkPlanarWorkedExample } from "@/components/dynamics/two-link-planar-worked-example";
import { TorqueDecompositionChart } from "@/components/dynamics/torque-decomposition-chart";
import { EnergyPanel } from "@/components/dynamics/energy-panel";
import { ComputedTorqueDemo } from "@/components/dynamics/computed-torque-demo";
import { AlgorithmBlockDiagram } from "@/components/dynamics/algorithm-block-diagram";
import { CoriolisDemo } from "@/components/dynamics/coriolis-demo";
import { TryItYourself } from "@/components/dynamics/try-it-yourself";
import { DriveSizingMetrics } from "@/components/dynamics/drive-sizing-metrics";

export default function Module9() {
  return (
    <>
      <ModuleHeader slug="9-dynamics" />
      <div className="px-8 py-8 max-w-5xl space-y-8">

        <section className="prose-ik">
          <h2>O czym jest ten moduł</h2>
          <p>
            Do tej pory skupialiśmy się na <strong>kinematyce</strong> — na pytaniu
            „przy jakich kątach przegubów <M tex="q" /> końcówka znajdzie się w
            zadanym miejscu". Jeśli mamy już <em>trajektorię</em>{" "}
            <M tex="q(t)" /> oraz jej pochodne <M tex="\dot q(t)" /> i{" "}
            <M tex="\ddot q(t)" />, to natychmiast zaczyna się drugie pytanie:
            <strong> jakie momenty napędowe </strong>
            <M tex="\tau_i" /> muszą wytworzyć silniki, żeby ten ruch faktycznie
            zaszedł?
          </p>
          <p>
            To <em>zadanie odwrotne dynamiki</em>: znając ruch, znajdź siły. Jest
            ono podstawą trzech praktyk inżynierskich:
          </p>
          <ul>
            <li>
              <strong>Sterowanie typu computed-torque</strong> — silnik dostaje
              feedforward <M tex="\tau" /> wyliczony z modelu plus poprawkę PID
              od pomiarów. Bez tego pre-feedforwardu robot „spóźnia się" w
              dynamicznych ruchach.
            </li>
            <li>
              <strong>Symulacja</strong> — silnik fizyki gry albo emulator
              robota w SI sterownika potrzebuje równań ruchu.
            </li>
            <li>
              <strong>Optymalizacja</strong> — żeby minimalizować energię
              cyklu transportowego (główny temat dysertacji [Gruszka 2024]),
              musimy umieć liczyć <M tex="\tau" />, a stąd prąd i moc.
            </li>
          </ul>
          <p>
            W całym module pracujemy na nowym robocie — <strong>ES5</strong>{" "}
            (EasyRobots, polski producent) — bo to robot z dysertacji wzorcowej
            dla tego materiału. ES5 ma osie q₂q₃q₄ <em>równoległe</em>, więc
            spełnia <strong>formę B warunku Piepera</strong> (dla porównania:
            Puma 560 spełnia formę A — wrist intersect). Algorytm dynamiki jest
            jednak <strong>niezależny</strong> od formy Piepera — działa dla
            dowolnego robota DH.
          </p>
          <AlgorithmBlockDiagram />

          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 my-4 text-sm">
            <p className="font-semibold mb-1">Newton-Euler vs Lagrange</p>
            <p className="text-[var(--muted)] mb-2">
              Dwa równoważne sformułowania dynamiki manipulatora:
            </p>
            <ul className="text-[var(--muted)] list-disc pl-5 space-y-1">
              <li>
                <strong>Newton-Euler (rekurencyjny)</strong> — propaguje stan kinematyczny
                od bazy do efektora (<em>rekurencja w przód</em>, ang. forward sweep),
                potem siły od efektora do bazy (<em>rekurencja w tył</em>, ang. backward sweep).
                Postać jawna, łatwa w implementacji, koszt{" "}
                <M tex="O(n)" /> dla n przegubów. <em>Używamy w tym module.</em>
              </li>
              <li>
                <strong>Lagrange II rodzaju</strong> — daje zwartą postać macierzową{" "}
                <M tex="M(q)\ddot q + C(q,\dot q)\dot q + g(q) = \tau" />, użyteczną
                do dowodów stabilności (np. control Lapunova). Numerycznie nie
                szybszy, kod bardziej skomplikowany.
              </li>
            </ul>
            <p className="text-[var(--muted)] mt-2">
              [Gruszka, dysertacja 2024, str. 44]: „W pracy zdecydowano się na
              metodę Newtona–Eulera ze względu na prostszą postać równań w
              postaci jawnej dla wieloczłonowego łańcucha kinematycznego."
            </p>
          </div>

          <div className="rounded-lg border-l-4 border-sky-500 bg-sky-50 dark:bg-sky-950/20 px-4 py-3 my-4 text-sm">
            <p className="font-semibold mb-1">Inverse vs forward dynamics — co właściwie liczymy</p>
            <p className="text-[var(--muted)] mb-2">
              Dynamika robota dzieli się na dwa zadania:
            </p>
            <ul className="text-[var(--muted)] list-disc pl-5 space-y-1">
              <li>
                <strong>Inverse dynamics</strong> — <em>znając ruch (q, q̇, q̈),
                znajdź momenty napędowe τ</em>. To, czym się zajmuje ten cały moduł.
                Algorytm Newton-Euler rozwiązuje to w <M tex="O(n)" />. Aplikacje:
                computed-torque control, symulacja energii (M10), planowanie
                trajektorii.
              </li>
              <li>
                <strong>Forward dynamics</strong> — <em>znając momenty τ, znajdź
                przyspieszenia q̈</em> (a stąd całkowaniem ruch). Wymaga rozwiązania{" "}
                <M tex="\ddot q = M(q)^{-1}\bigl(\tau - C(q,\dot q)\dot q - g(q)\bigr)" />.
                Algorytmy: Composite Rigid Body Algorithm (CRBA) lub Articulated
                Body Algorithm (ABA, też O(n)). Aplikacje: silniki fizyki,
                symulatory robotów (MuJoCo, Gazebo).
              </li>
            </ul>
            <p className="text-[var(--muted)] mt-2 mb-0">
              W kroku 7 (computed-torque demo) <em>obu</em> używamy: inverse-dynamics
              jako feedforward dla kontrolera, forward-dynamics dla symulatora
              odpowiedzi robota.
            </p>
          </div>

          <a href="/modules/1-analytical-walkthrough" className="text-sm text-[var(--accent)] underline hover:no-underline">
            ← Powiązany moduł 1 (Puma 560)
          </a>: <span className="text-sm text-[var(--muted)]">tam pokazujemy <strong>kinematykę odwrotną</strong> Pumy (forma A warunku Piepera).
          Tu ES5 (forma B) — geometria inna, ale algorytm <em>dynamiki</em> Newton-Euler jest identyczny dla obu robotów.</span>

          <WhyTwoSweeps />

          <NewtonEulerSweepDiagram />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Laboratorium</h2>
          <p className="text-[var(--muted)]">
            Po lewej: model 3D robota ES5 z konwencją Z-up. Po prawej: trzy panele
            suwaków — konfiguracja <M tex="q" />, prędkości <M tex="\dot q" />,
            przyspieszenia <M tex="\ddot q" />. Pod robotem: wyliczone momenty
            napędowe <M tex="\tau_i" /> w każdym przegubie, z rozkładem na
            część grawitacyjną i dynamiczną. Wartości aktualizowane na żywo.
          </p>
          <Es5Playground height={420} showFrames={false} />
          <TorqueDisplay />
          <EnergyPanel />
          <TorqueDecompositionChart />
        </section>

        <StepPanel number={0} title="Newton-Euler dla pojedynczego ciała — fundament całego algorytmu">
          <p>
            Zanim zmierzymy się z łańcuchem 6 ogniw, sprowadźmy problem do
            absolutnego minimum: <strong>jedno sztywne ciało, które zna swoją
            kinematykę</strong> (prędkość kątową <M tex="\boldsymbol\omega" />,
            przyspieszenie kątowe <M tex="\boldsymbol\varepsilon" />,
            przyspieszenie liniowe środka masy <M tex="\mathbf{a}_C" />) i pyta:{" "}
            <em>jaką siłę i jaki moment musi na nie działać, żeby ten ruch był
            możliwy?</em>
          </p>
          <SingleBodyDiagram />
          <p>
            Odpowiedź to <strong>dwa równania</strong> — Newtona dla translacji
            (siła = masa × przyspieszenie) i Eulera dla rotacji (moment = tensor
            bezwładności × przyspieszenie kątowe, plus człon żyroskopowy):
          </p>
          <MathBlock tex="\boxed{\;\mathbf{F}_C = m\,\mathbf{a}_C\;}" />
          <MathBlock tex="\boxed{\;\mathbf{N}_C = I_C\,\boldsymbol\varepsilon + \boldsymbol\omega\times(I_C\,\boldsymbol\omega)\;}" />
          <p>
            <strong>To jest cała dynamika sztywnego ciała.</strong> Jeśli umiesz
            policzyć <M tex="\mathbf{F}_C" /> i <M tex="\mathbf{N}_C" /> dla
            jednego ciała, wiesz dynamikę. Cały dalszy algorytm Newton-Euler
            to tylko dwie operacje techniczne:
          </p>
          <ol>
            <li>
              <strong>Skąd wziąć <M tex="\boldsymbol\omega, \boldsymbol\varepsilon, \mathbf{a}_C" /> dla każdego ogniwa?</strong>{" "}
              → propagujemy je z bazy do końcówki (rekurencja w przód, kroki 2–3).
            </li>
            <li>
              <strong>Co siła <M tex="\mathbf{F}_C" /> i moment <M tex="\mathbf{N}_C" />{" "}
              danego ogniwa znaczą dla sąsiednich przegubów?</strong>{" "}
              → bilans sił od końcówki do bazy (rekurencja w tył, krok 5).
            </li>
          </ol>
          <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 my-4 not-prose">
            <p className="text-sm font-semibold mb-1">Złota zasada modułu</p>
            <p className="text-sm text-[var(--foreground)] mb-0">
              Każdy kolejny krok można sprowadzić do pytania: „gdzie tutaj
              wchodzi <M tex="\mathbf{F}_C = m\,\mathbf{a}_C" /> a gdzie{" "}
              <M tex="\mathbf{N}_C = I\boldsymbol\varepsilon + \boldsymbol\omega\times I\boldsymbol\omega" />?".
              Jeśli to widzisz — czytasz Newton-Eulera. Jeśli nie widzisz —
              gubi cię notacja, nie fizyka. Wróć tu i przeczytaj jeszcze raz.
            </p>
          </div>
        </StepPanel>

        <NotationLegend />

        <StepPanel number={1} title="Założenia i parametry inercji">
          <p>
            Algorytm Newton-Euler dla manipulatora jako sztywnego łańcucha
            ciał wymaga znajomości <em>parametrów inercji</em> każdego ogniwa:
          </p>
          <ul>
            <li><strong>Masa</strong> <M tex="m_i" /> [kg]</li>
            <li>
              <strong>Środek masy</strong> <M tex="{}^i\mathbf{p}_{Ci}" /> [m] —
              w lokalnym układzie ogniwa (z konwencji DH).
            </li>
            <li>
              <strong>Tensor bezwładności</strong> <M tex="I_{Ci}" /> [kg·m²] —
              macierz 3×3 wokół środka masy, w lokalnym układzie ogniwa.
            </li>
          </ul>
          <p>
            Tensor bezwładności jest symetryczny (3 momenty główne na diagonali +
            3 momenty dewiacji poza nią), eq. (6.13) dysertacji:
          </p>
          <MathBlock tex="I_C = \begin{bmatrix} I_{xx} & -I_{xy} & -I_{xz} \\ -I_{xy} & I_{yy} & -I_{yz} \\ -I_{xz} & -I_{yz} & I_{zz} \end{bmatrix}" />
          <p>
            <strong>Przyjęte założenia upraszczające</strong> (str. 51 dysertacji):
          </p>
          <ul>
            <li>
              <strong>Sztywne ciała</strong> — każde ogniwo traktujemy jako idealnie
              sztywne. Pomijamy deformacje sprężyste prętów oraz histerezę przekładni
              harmonicznych. W praktyce dla cobotów typu Franka/UR błąd z tego tytułu
              jest &lt; 1° na końcówce przy maksymalnym obciążeniu.
            </li>
            <li>
              <strong>Niezmienność czasowa parametrów</strong> — masy i tensory
              bezwładności są stałe. Pomijamy rozszerzalność termiczną, zużycie,
              zmiany położenia środka masy przy chwytaniu obciążenia (chwyt obciążenia
              należałoby dodać jako zmodyfikowane parametry ostatniego ogniwa).
            </li>
            <li>
              <strong>Brak tarcia w przegubach</strong> — tarcie Coulomba i lepkościowe
              dodajemy później osobno (jeśli potrzeba). Przy niskich prędkościach
              odpowiada za ~5–15% rzeczywistego momentu — w sterowniku zwykle traktuje
              się je jako zaburzenie kompensowane członem całkującym PID.
            </li>
            <li>
              <strong>Silnik jako idealny generator momentu</strong> — pomijamy
              dynamikę elektromagnetyczną (stała czasowa indukcyjności), bezwładność
              wirnika redukowaną do przegubu oraz mody własne strukturalne. Tym
              wszystkim zajmuje się <a href="/modules/10-energy">moduł 10</a> (silnik DC).
            </li>
          </ul>
          <p>
            <strong>Skąd wartości liczbowe?</strong> W dysertacji (str. 55, Tab. 6.2)
            parametry inercji ES5 wyznaczono z modelu 3D w oprogramowaniu CAD.
            W tej aplikacji używamy <em>oszacowania cylindrycznego</em> — każde
            ogniwo aproksymujemy jednorodnym cylindrem o znanej masie i
            przybliżonych wymiarach. Algorytm działa identycznie; różnica jest
            w wartościach liczbowych (rzędu 10–30%).
          </p>
          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-3 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Pokaż tabelę parametrów inercji cylindrycznych ES5 (te, których faktycznie używamy)
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <p>
                Każde ogniwo zaaproksymowane jako jednorodny cylinder o długości
                <em> L</em> i masie <em>m</em>, z tensorem{" "}
                <M tex="I_C = \mathrm{diag}\bigl(\tfrac{1}{12}m(3r^2 + L^2),\,\tfrac{1}{12}m(3r^2 + L^2),\,\tfrac{1}{2}m r^2\bigr)" />.
                Wartości w lokalnym układzie ogniwa (osie wg konwencji DH).
              </p>
              <table className="text-xs font-mono w-full mt-2">
                <thead>
                  <tr className="border-b border-[var(--panel-border)]">
                    <th className="text-left py-1 pr-3">ogniwo</th>
                    <th className="text-right py-1 pr-3">m [kg]</th>
                    <th className="text-right py-1 pr-3">L [m]</th>
                    <th className="text-right py-1 pr-3">I_xx</th>
                    <th className="text-right py-1 pr-3">I_yy</th>
                    <th className="text-right py-1">I_zz</th>
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
                  <tr><td className="py-1">1 (podstawa)</td><td className="text-right pr-3">3.7</td><td className="text-right pr-3">0.15</td><td className="text-right pr-3">0.011</td><td className="text-right pr-3">0.011</td><td className="text-right">0.018</td></tr>
                  <tr><td className="py-1">2 (bark)</td><td className="text-right pr-3">8.4</td><td className="text-right pr-3">0.43</td><td className="text-right pr-3">0.137</td><td className="text-right pr-3">0.137</td><td className="text-right">0.013</td></tr>
                  <tr><td className="py-1">3 (łokieć)</td><td className="text-right pr-3">2.3</td><td className="text-right pr-3">0.40</td><td className="text-right pr-3">0.034</td><td className="text-right pr-3">0.034</td><td className="text-right">0.003</td></tr>
                  <tr><td className="py-1">4 (przedramię)</td><td className="text-right pr-3">1.2</td><td className="text-right pr-3">0.11</td><td className="text-right pr-3">0.002</td><td className="text-right pr-3">0.002</td><td className="text-right">0.001</td></tr>
                  <tr><td className="py-1">5 (nadgarstek)</td><td className="text-right pr-3">1.2</td><td className="text-right pr-3">0.10</td><td className="text-right pr-3">0.001</td><td className="text-right pr-3">0.001</td><td className="text-right">0.001</td></tr>
                  <tr><td className="py-1">6 (kołnierz)</td><td className="text-right pr-3">0.3</td><td className="text-right pr-3">0.08</td><td className="text-right pr-3">0.0003</td><td className="text-right pr-3">0.0003</td><td className="text-right">0.0002</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-[var(--muted)] mt-2">
                Te liczby siedzą w <code>src/lib/robots/es5.ts</code> jako <code>ES5_INERTIA</code>
                — wszystkie momenty napędowe i panele energii czytają je stamtąd.
              </p>
            </div>
          </details>
        </StepPanel>

        <StepPanel number={2} title="Rekurencja w przód · prędkości (forward sweep, eq. 6.6, 6.8)">
          <p>
            Rekurencja w przód propaguje <em>stan kinematyczny</em> od bazy{" "}
            (gdzie <M tex="\boldsymbol\omega_0=\boldsymbol{0}" />,{" "}
            <M tex="\mathbf{v}_0=\boldsymbol{0}" />) do końcówki, ogniwo po ogniwie.
            Schemat poniżej ilustruje wszystkie wektory kinematyczne związane z
            pojedynczym ogniwem <em>i</em> i jego sąsiadami:
          </p>
          <DissertationFigure
            src="/images/dynamics/fig-6-2-link-kinematics.png"
            alt="Schemat członu kinematycznego robota przegubowego — wektory ω, ε, v, a w przegubach i, i+1 oraz w środku masy"
            figureNumber="6.2"
            caption={
              <>
                Schemat członu kinematycznego robota przegubowego — wektory prędkości
                <strong> ω, v</strong> i przyspieszeń <strong>ε, a</strong> w przegubach{" "}
                <em>i</em>, <em>i+1</em> oraz w środku masy <strong>v_Ci, a_Ci</strong>.
                Wektor <em>p_Ci</em> wskazuje środek masy ogniwa, <em>p_i</em> łączy
                początki układów <em>i</em> i <em>i+1</em>. Lokalne osie współrzędnych
                <em> (x, y, z)</em> przypisane są wg konwencji DH (Craig).
              </>
            }
            width={2050}
            height={1020}
          />
          <p>
            <strong>Prędkość kątowa</strong> ogniwa (i+1) jest sumą:
            (a) prędkości ogniwa (i) obróconej do nowego układu, oraz (b) prędkości
            własnego przegubu wzdłuż jego osi z:
          </p>
          <MathBlock tex="{}^{i+1}\boldsymbol{\omega}_{i+1} = {}^{i+1}R_i\,{}^i\boldsymbol{\omega}_i + \dot\theta_{i+1}\,\hat{\mathbf{z}}_{i+1}" />
          <p>
            Kluczowa intuicja: każdy przegub <em>dodaje</em> swój wkład tylko
            wzdłuż swojej osi z (z konwencji DH). Pozostałe składowe ω
            dziedziczy od poprzedniego ogniwa.
          </p>

          <p>
            <strong>Prędkość liniowa</strong> początku układu (i+1) wynika z
            podstawowego wzoru kinematyki sztywnego ciała: ogniwo (i) ma prędkość{" "}
            <M tex="\mathbf{v}_i" /> oraz obraca się z <M tex="\boldsymbol\omega_i" />,
            więc punkt odległy o <M tex="\mathbf{p}_{i+1}" /> przesuwa się z
            prędkością <M tex="\mathbf{v}_i + \boldsymbol\omega_i\times\mathbf{p}_{i+1}" />:
          </p>
          <MathBlock tex="{}^{i+1}\mathbf{v}_{i+1} = {}^{i+1}R_i\,\bigl({}^i\mathbf{v}_i + {}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{i+1}\bigr)" />
          <p>
            <em>Bez członu translacyjnego od własnego przegubu</em> — bo dla
            przegubu obrotowego sam obrót nie przesuwa początku ogniwa.
          </p>

          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 px-4 py-3 my-4 not-prose">
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="inline-block px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] uppercase tracking-wide">
                pułapka
              </span>
              Najczęstszy bug w implementacjach NE — kierunek transformacji R
            </p>
            <p className="text-sm text-[var(--foreground)] mb-2">
              Macierz <M tex="{}^{i+1}R_i" /> w eq. (6.6) to <em>rotacja przeprowadzająca
              wektor z układu (i) do (i+1)</em>. Tymczasem typowa funkcja DH
              (np. <code>linkTransform</code> / <code>modifiedDHTransform</code>) zwraca{" "}
              <M tex="T^{i-1}_i" /> — macierz, której kolumny to baza układu (i)
              wyrażona w (i-1). Dla rotacyjnej części:
            </p>
            <MathBlock tex="{}^{i+1}R_i = ({}^{i}R_{i+1})^{\!\top}" />
            <p className="text-sm text-[var(--foreground)] mb-2">
              W kodzie używamy <code>mat3TmulVec3(R, v)</code> (mnożenie przez
              transpozycję) zamiast <code>mat3mulVec3(R, v)</code>. Drobna różnica
              notacyjna, ale <strong>błąd kosztuje godziny debugowania</strong> —
              bo dla pozy home (q=0) wszystkie macierze są tożsamością i bug
              się nie ujawnia. Pojawia się dopiero przy ruchu, jako „dziwne" momenty
              napędowe które „prawie" mają sens.
            </p>
            <p className="text-sm text-[var(--foreground)] mb-0">
              <strong>Test diagnostyczny:</strong> ustaw{" "}
              <M tex="q = (\pi/2, 0, \dots, 0)" /> i <M tex="\dot q = \ddot q = \mathbf{0}" />.
              Z poprawnym R^T momenty grawitacyjne <M tex="\tau_2, \tau_3" /> powinny
              skalować się proporcjonalnie do długości ramienia. Z błędnym R —
              dostaniesz wartości pomieszane między osiami.
            </p>
          </div>
        </StepPanel>

        <StepPanel number={3} title="Rekurencja w przód · przyspieszenia (forward sweep, eq. 6.7, 6.9)">
          <p>
            Przyspieszenie kątowe wymaga uwagi na <strong>człon Coriolisa</strong>:
            kombinację prędkości dziedziczonej i prędkości własnego przegubu, która
            generuje dodatkowe przyspieszenie kątowe nawet przy zerowym{" "}
            <M tex="\ddot\theta" />:
          </p>
          <MathBlock tex="{}^{i+1}\boldsymbol{\varepsilon}_{i+1} = {}^{i+1}R_i\,{}^i\boldsymbol{\varepsilon}_i + ({}^{i+1}R_i\,{}^i\boldsymbol{\omega}_i)\times\dot\theta_{i+1}\hat{\mathbf{z}}_{i+1} + \ddot\theta_{i+1}\hat{\mathbf{z}}_{i+1}" />

          <CoriolisDemo />

          <p>
            <strong>Przyspieszenie liniowe</strong> początku ogniwa (i+1) ma trzy
            wkłady: tangencjalny (od <M tex="\boldsymbol\varepsilon_i" />), dośrodkowy
            (od <M tex="\boldsymbol\omega_i\times\boldsymbol\omega_i" />), oraz
            dziedziczone <M tex="\mathbf{a}_i" />:
          </p>
          <MathBlock tex="{}^{i+1}\mathbf{a}_{i+1} = {}^{i+1}R_i\,\bigl({}^i\boldsymbol{\varepsilon}_i\times {}^i\mathbf{p}_{i+1} + {}^i\boldsymbol{\omega}_i\times({}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{i+1}) + {}^i\mathbf{a}_i\bigr)" />

          <p>
            <strong>Inicjalizacja</strong>{" "}
            <M tex="{}^0\mathbf{a}_0 = -g\,\hat{\mathbf{z}}_{\text{world}}" />{" "}
            (sztuczka Craig'a) sprawia, że wszystkie pochodne <M tex="\mathbf{a}_i" />{" "}
            <em>automatycznie zawierają grawitację</em> — w rekurencji w przód nie
            trzeba o niej pamiętać oddzielnie.
          </p>
          <p>
            <strong>Środek masy ogniwa</strong> dziedziczy prędkość i przyspieszenie
            analogicznie. Prędkość C_i to prędkość początku układu plus ω razy wektor
            do C_i (eq. 6.11):
          </p>
          <MathBlock tex="{}^i\mathbf{v}_{Ci} = {}^i\mathbf{v}_i + {}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{Ci}" />
          <p>Przyspieszenie C_i (eq. 6.12) — analogicznie do przyspieszenia początku:</p>
          <MathBlock tex="{}^i\mathbf{a}_{Ci} = {}^i\boldsymbol{\varepsilon}_i\times {}^i\mathbf{p}_{Ci} + {}^i\boldsymbol{\omega}_i\times({}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{Ci}) + {}^i\mathbf{a}_i" />

          <p>
            Dla typowej trajektorii pick-and-place na ES5 (q̇ ~1 rad/s, q̈ ~5 rad/s²),
            człon dośrodkowy ω×(ω×p) jest rzędu 0.5–2 m/s² — porównywalny z
            grawitacją (9.81 m/s²) i nie do pominięcia.
          </p>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm">
            <p className="font-semibold mb-1">Notka kodowa — ε vs alpha</p>
            <p className="text-[var(--muted)] mb-0">
              W tekście używamy greckiego <M tex="\boldsymbol\varepsilon" /> (klasyczne oznaczenie
              przyspieszenia kątowego), w kodzie TypeScript jest jako <code>alpha</code> —
              ponieważ identyfikatory Unicode w nazwach zmiennych psują czytelność
              i autouzupełnianie w edytorach. To samo <em>e</em>, dwie różne nazwy.
            </p>
          </div>
        </StepPanel>

        <StepPanel number={4} title="Tensor bezwładności i siły bezwładności (eq. 6.13–6.15)">
          <p>
            Mając przyspieszenie środka masy{" "}
            <M tex="{}^i\mathbf{a}_{Ci}" />, siła bezwładności (d'Alemberta) to
            po prostu II zasada Newtona:
          </p>
          <MathBlock tex="{}^i\mathbf{F}_{Ci} = m_i\,{}^i\mathbf{a}_{Ci}" />
          <p>
            Ponieważ <M tex="\mathbf{a}_{Ci}" /> dziedziczy grawitację z forward
            sweep, <M tex="\mathbf{F}_C" /> w naszej konwencji <strong>zawiera</strong>{" "}
            zarówno siłę bezwładności (z dynamiki), jak i pozorną siłę grawitacji.
          </p>

          <p>
            <strong>Moment</strong> bezwładności ogniwa składa się z dwóch części:
          </p>
          <MathBlock tex="{}^i\mathbf{N}_{Ci} = I_{Ci}\,{}^i\boldsymbol{\varepsilon}_i + {}^i\boldsymbol{\omega}_i\times(I_{Ci}\,{}^i\boldsymbol{\omega}_i)" />
          <p>
            Pierwszy człon to po prostu „F=ma w postaci rotacyjnej" —{" "}
            <M tex="I\,\boldsymbol\varepsilon" />: moment potrzebny by nadać
            ciału przyspieszenie kątowe <M tex="\boldsymbol\varepsilon" />. Drugi
            człon <M tex="\boldsymbol\omega\times(I\,\boldsymbol\omega)" /> to{" "}
            <strong>moment żyroskopowy</strong> — pojawia się gdy ciało już się
            obraca z prędkością <M tex="\boldsymbol\omega" /> wokół osi, która{" "}
            <em>nie pokrywa się</em> z osią główną bezwładności tensora{" "}
            <M tex="I_C" />.
          </p>
          <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 my-4 not-prose">
            <p className="text-sm font-semibold mb-2">
              Intuicja — koło rowerowe trzymane w rękach
            </p>
            <p className="text-sm text-[var(--foreground)] mb-2">
              Klasyczna demonstracja na zajęciach z mechaniki: trzymasz oś
              szybko rozkręconego koła rowerowego za dwa wystające końce. Próbujesz
              je <em>pochylić w prawo</em> (chcesz nadać <M tex="\boldsymbol\varepsilon" />{" "}
              poziomy, w kierunku jazdy). Spodziewałbyś się, że poczujesz opór
              wzdłuż osi pochylania — tymczasem koło „skręca w górę" lub „w dół":
              twoje ręce czują moment <strong>prostopadły</strong> do kierunku,
              w którym próbujesz je pochylić.
            </p>
            <p className="text-sm text-[var(--foreground)] mb-2">
              To dokładnie człon <M tex="\boldsymbol\omega\times(I\,\boldsymbol\omega)" />.
              Wektor pędu kątowego <M tex="\mathbf{L} = I\,\boldsymbol\omega" />{" "}
              leży wzdłuż osi koła. Gdy nakładasz <M tex="\boldsymbol\omega_\text{pochylenia}" />{" "}
              poziomy, iloczyn wektorowy daje moment <em>w trzeciej osi</em> — i to
              właśnie ten moment czują twoje ręce. Zjawisko nazywa się{" "}
              <strong>precesją żyroskopową</strong>.
            </p>
            <p className="text-sm text-[var(--foreground)] mb-0">
              W manipulatorze pojawia się analogicznie: szybko obracające się
              ogniwo (np. nadgarstek wirujący z dużą <M tex="\boldsymbol\omega" />)
              gdy reszta ramienia próbuje obrócić jego oś, „odpowiada" momentem
              prostopadłym, który musi zostać <em>zrównoważony</em> przez napęd
              w przegubie sąsiednim. Stąd dodatkowy człon w równaniu — fizycznie
              istnieje, a jego pominięcie dałoby błędne <M tex="\tau_i" /> przy
              dużych prędkościach.
            </p>
          </div>
          <p>
            <strong>Specjalny przypadek:</strong> gdy <M tex="\boldsymbol\omega" />{" "}
            jest wektorem własnym <M tex="I_C" /> (czyli leży wzdłuż jednej z osi
            głównych), wtedy <M tex="I\boldsymbol\omega = \lambda\boldsymbol\omega" />{" "}
            i <M tex="\boldsymbol\omega\times\lambda\boldsymbol\omega = 0" /> —
            człon żyroskopowy znika. Innymi słowy: jeśli kierunek pędu kątowego
            zgadza się z kierunkiem prędkości kątowej, nie ma precesji.
          </p>
        </StepPanel>

        <StepPanel number={5} title="Rekurencja w tył · siły reakcji w przegubach (backward sweep, Craig, 6.49)">
          <p>
            Po wyliczeniu sił bezwładności w środkach mas wszystkich ogniw, lecimy{" "}
            <em>w drugą stronę</em> — od końcówki (gdzie nie ma obciążenia
            zewnętrznego) do bazy. Schemat poniżej pokazuje wszystkie siły i
            momenty działające na pojedyncze ogniwo:
          </p>
          <DissertationFigure
            src="/images/dynamics/fig-6-3-link-forces.png"
            alt="Schemat sił i momentów działających na i-ty człon: siła bezwładności w środku masy F_Ci, moment bezwładności M_Ci, siła grawitacji F_gi, siły i momenty reakcji w przegubach F_i, M_i, F_{i+1}, M_{i+1}"
            figureNumber="6.3"
            caption={
              <>
                Sposób przyporządkowania sił i momentów działających na <em>i</em>-ty
                człon robota. <strong>F_Ci, M_Ci</strong> — siła i moment bezwładności w
                środku masy. <strong>F_gi</strong> — siła grawitacji.{" "}
                <strong>F_i, M_i</strong> — siła i moment reakcji w przegubie <em>i</em>{" "}
                (od ogniwa <em>i-1</em>). <strong>F_{"{i+1}"}, M_{"{i+1}"}</strong> —
                analogiczne wielkości od ogniwa <em>i+1</em>. Bilans tych sił daje{" "}
                <em>rekurencję w tył</em> (backward sweep): znając obciążenia zewnętrzne (zerowe za końcówką),
                wyliczamy siłę i moment w każdym przegubie idąc od końca do bazy.
              </>
            }
            width={2050}
            height={910}
          />
          <p>
            Każde ogniwo balansuje: (a) siły reakcji od ogniwa wyższego, (b) własne
            siły bezwładności, (c) siły grawitacji (już zaszyte w <M tex="\mathbf{F}_C" />):
          </p>
          <MathBlock tex="{}^i\mathbf{f}_i = {}^iR_{i+1}\,{}^{i+1}\mathbf{f}_{i+1} + {}^i\mathbf{F}_{Ci}" />
          <p>
            <strong>Inicjalizacja:</strong>{" "}
            <M tex="{}^{n+1}\mathbf{f}_{n+1} = \boldsymbol{0}" /> — brak obciążenia
            zewnętrznego za końcówką (jeśli robot trzyma jakiś przedmiot,
            dodajemy tu jego ciężar).
          </p>

          <p>
            <strong>Moment</strong> w przegubie i to suma kilku składowych:
          </p>
          <MathBlock tex="{}^i\mathbf{n}_i = {}^i\mathbf{N}_{Ci} + {}^iR_{i+1}\,{}^{i+1}\mathbf{n}_{i+1} + {}^i\mathbf{p}_{Ci}\times {}^i\mathbf{F}_{Ci} + {}^i\mathbf{p}_{i+1}\times({}^iR_{i+1}\,{}^{i+1}\mathbf{f}_{i+1})" />
          <p>
            Cztery człony: własny moment bezwładności, propagowany moment od ogniwa
            wyższego, moment od własnej siły bezwładności na ramieniu od początku
            układu do środka masy, moment od siły reakcji ogniwa wyższego na
            ramieniu od początku układu do następnego przegubu.
          </p>

          <p>
            <strong>Moment napędowy</strong> w przegubie i — czyli to, czego silnik
            musi wytworzyć — to <em>składowa</em>{" "}
            <M tex="\mathbf{n}_i" /> wzdłuż osi przegubu (czyli oś z układu i):
          </p>
          <MathBlock tex="\boxed{\;\tau_i = {}^i\mathbf{n}_i \cdot \hat{\mathbf{z}}_i = (\,{}^i\mathbf{n}_i)_z\;}" />
          <p>
            Pozostałe składowe momentu są równoważone przez konstrukcję
            mechaniczną przegubu (łożyska). Tylko <M tex="\tau_i" /> wymaga aktywnej
            kompensacji przez silnik.
          </p>
        </StepPanel>

        <StepPanel number={6} title="Eksperyment: trajektoria pick-and-place">
          <p>
            Dla zadanej trajektorii <M tex="(q(t), \dot q(t), \ddot q(t))" /> wyliczamy{" "}
            <M tex="\tau(t)" /> dla każdego z 6 napędów ES5 — w każdym kroku czasowym
            uruchamiamy pełny algorytm Newton-Euler. Wykres pokazuje{" "}
            <strong>6 niezależnych linii</strong> (po jednej na napęd), oś pozioma
            to znormalizowany czas trajektorii <em>τ ∈ [0, 1]</em>, oś pionowa to
            moment w Nm. Wybierz scenariusz w rozwijanej liście, dostosuj masę
            obciążenia w chwytaku i obserwuj jak zmienia się obciążenie napędów.
          </p>
          <TorqueChart />
          <p>
            <strong>Co warto zauważyć:</strong> τ₂ (drugi przegub, dźwigający
            ramię w polu grawitacji) zwykle dominuje — zarówno w statyce, jak i
            dynamice. Dodanie 1 kg w chwytaku liniowo skaluje moment grawitacyjny
            we wszystkich napędach (efekt mnożnika ramienia: ciężar 1 kg na
            końcu robota o zasięgu 0.8 m daje +8 Nm).
          </p>
        </StepPanel>

        <StepPanel number={7} title="Computed-torque control — domykamy obietnicę ze wstępu">
          <p>
            Na początku modułu napisałem: „silnik dostaje feedforward τ wyliczony
            z modelu plus poprawkę PID". Czas pokazać że to działa. Symuluję
            2R-planarny manipulator (forward dynamics rozwiązana analitycznie
            z równania Lagrange'a) wykonujący <em>tę samą trajektorię</em>{" "}
            dwoma kontrolerami: czystym PID i PID z dodanym feedforward'em{" "}
            <M tex="\tau_{ff} = \mathrm{NE}(q_d, \dot q_d, \ddot q_d)" />.
          </p>
          <ComputedTorqueDemo />
          <p>
            <strong>Wniosek dydaktyczny:</strong> NE nie jest tylko teoretycznym
            algorytmem — to <em>generator feedforward'u</em> dla każdego
            sterownika trajektorii. Bez modelu dynamiki musimy „brutalnie"
            przeciążać PID dużymi wzmocnieniami (i wzmacniać szum, ryzykować
            niestabilność). Z modelem — kontroler żyje w mniejszym reżimie błędu
            i może być bezpiecznie strojony bliżej granicy stabilności.
          </p>
        </StepPanel>

        <section className="space-y-3">
          <TryItYourself />
        </section>

        <section className="prose-ik">
          <h2>Od τ(t) do doboru napędu — 4 metryki konstrukcyjne</h2>
          <p>
            Cała powyższa maszyneria Newton-Eulera produkuje <em>jedną</em>{" "}
            kluczową dla inżyniera rzecz: <strong>przebieg czasowy momentów
            napędowych</strong> <M tex="\tau_i(t)" /> dla zadanej trajektorii.
            To jest dokładnie <em>specyfikacja wymagań</em>, którą wpisuje się
            do zapytania ofertowego u producenta silników (Maxon, Kollmorgen,
            Allied Motion) i przekładni (Harmonic Drive, Nabtesco). Z jednego
            przebiegu <M tex="\tau(t)" /> wyciągamy <strong>cztery
            niezależne liczby</strong> — i każda z nich ogranicza <em>inną
            własność</em> docelowego napędu.
          </p>

          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-5 py-4 my-4 not-prose text-sm">
            <p className="font-semibold mb-3">Cztery metryki konstrukcyjne — co każda ogranicza</p>
            <div className="space-y-3">
              <div className="grid grid-cols-[10rem_1fr] gap-3">
                <div>
                  <p className="font-semibold text-red-600 dark:text-red-400">τ_peak</p>
                  <MathBlock tex="\tau^{\max}_i = \max_t |\tau_i(t)|" />
                </div>
                <p className="self-center text-[var(--foreground)]">
                  <strong>Moment szczytowy</strong> — chwilowy maksymalny moment, który silnik
                  musi wytworzyć (typowo trwa milisekundy: podczas startu, hamowania, zderzenia
                  z constraintem). Ogranicza go <em>krzywa T-N silnika</em> (saturacja magnetyczna)
                  oraz wytrzymałość mechaniczna przekładni (peak torque rating).
                </p>
              </div>
              <div className="grid grid-cols-[10rem_1fr] gap-3">
                <div>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">τ_rms</p>
                  <MathBlock tex="\tau^{\text{rms}}_i = \sqrt{\tfrac{1}{T}\!\int_0^T\!\tau_i^2(t)\,dt}" />
                </div>
                <p className="self-center text-[var(--foreground)]">
                  <strong>Moment skuteczny</strong> (RMS) — średnia kwadratowa po całym cyklu.
                  Dlaczego kwadratowa? Bo straty cieplne silnika to <M tex="P_{\text{cieplna}} = I^2 R" />,
                  a prąd jest proporcjonalny do momentu (<M tex="\tau = K_t I" />). RMS dyktuje{" "}
                  <em>moment ciągły</em> z karty katalogowej i temperaturę uzwojeń — to ona
                  decyduje czy silnik przeżyje cykl pracy bez przegrzania.
                </p>
              </div>
              <div className="grid grid-cols-[10rem_1fr] gap-3">
                <div>
                  <p className="font-semibold text-sky-600 dark:text-sky-400">q̇_peak</p>
                  <MathBlock tex="\dot q^{\max}_i = \max_t |\dot q_i(t)|" />
                </div>
                <p className="self-center text-[var(--foreground)]">
                  <strong>Prędkość kątowa maksymalna</strong> przegubu. Po przeskalowaniu
                  przez przełożenie przekładni daje wymaganą prędkość obrotową silnika{" "}
                  <M tex="\omega_{\text{silnika}} = \dot q \cdot n" />. Ogranicza ją no-load
                  speed silnika i max input speed przekładni harmonicznej (typowo 4000–6000 rpm).
                </p>
              </div>
              <div className="grid grid-cols-[10rem_1fr] gap-3">
                <div>
                  <p className="font-semibold text-purple-600 dark:text-purple-400">P_peak</p>
                  <MathBlock tex="P^{\max}_i = \max_t |\tau_i(t)\,\dot q_i(t)|" />
                </div>
                <p className="self-center text-[var(--foreground)]">
                  <strong>Moc szczytowa</strong> wymagana w danym momencie. Dyktuje wybór{" "}
                  <em>drivera</em> (sterownika silnika) i <em>zasilacza</em> (PSU). Często
                  pojawia się w innym momencie cyklu niż τ_peak — bo tam gdzie τ jest max,
                  q̇ często jest mała (i odwrotnie). Dla zasilania bateryjnego dodatkowo
                  liczy się energia cyklu <M tex="E = \int_0^T |P(t)|\,dt" />.
                </p>
              </div>
            </div>
          </div>

          <p>
            Poniższy interaktywny panel czyta <em>tę samą trajektorię</em>{" "}
            którą widzisz na wykresie τ(t) wyżej, ale agreguje ją do tych
            czterech liczb per napęd. <strong>Zmieniaj scenariusz i payload</strong>{" "}
            i obserwuj, jak rosną wymagania konstrukcyjne. Wiersz z żółtym tłem
            wskazuje napęd krytyczny (najwyższe wymagane τ_peak) — to on dyktuje
            wybór całej rodziny silników.
          </p>

          <DriveSizingMetrics />

          <p>
            <strong>Następny krok:</strong> mając te cztery metryki, przechodzimy
            do <a href="/modules/11-drive-sizing">modułu 11 (Dobór napędów)</a>,
            w którym budujemy pełny pipeline: krzywa T-N silnika z naniesionym
            punktem pracy, sprawdzenie bezwładności zredukowanej (wpływ na pasmo
            regulatora), cross-reference do realnych modeli z katalogów Maxon /
            Kollmorgen / Harmonic Drive, iteracja projektowa „za duży silnik →
            za drogo, za mały → niezawodność". To naturalne <em>zwieńczenie</em>{" "}
            wiedzy z modułów M9+M10 — tu liczyliśmy momenty, w M10 energię,
            w M11 składamy to w decyzję zakupową.
          </p>
        </section>

        <section className="space-y-3">
          <TwoLinkPlanarWorkedExample />
        </section>

        <section className="prose-ik">
          <h2>Wzorzec liczbowy — pełny rachunek dla jednej trajektorii (6-DOF ES5)</h2>
          <p>
            Mając już intuicję z 2R-planarnego (powyżej), spójrzmy na pełny
            6-DOF na konkretnym scenariuszu: <code>q = (0°, 45°, 45°, 0°, 90°, 0°)</code>,
            obrót pierwszego przegubu z prędkością <code>q̇₁ = 0.5 rad/s</code>,
            zerowe przyspieszenia. Wszystkie wartości pośrednie wyliczone analitycznie
            (algorytm <code>src/lib/dynamics/newton-euler.ts</code>) i tu wypisane —
            można je przepisać do własnego notebooka i sprawdzić implementację
            linijka po linijce.
          </p>
          <NumericalExampleM9 />
        </section>

        <section className="prose-ik">
          <h2>Ściąga formuł</h2>
          <p>
            Wszystkie kluczowe równania algorytmu Newton-Euler dla manipulatora
            w jednym miejscu — przydatne jako kompaktowa referencja przy
            implementacji albo powtórce przed egzaminem.
          </p>
          <CheatSheetM9 />
        </section>

        <section className="prose-ik">
          <h2>Co dalej</h2>
          <p>
            Mając wektor momentów napędowych <M tex="\tau_i" /> otwiera się kilka
            naturalnych dalszych dróg, w zależności od tego, do czego dynamika
            jest nam potrzebna:
          </p>
          <ul>
            <li>
              <strong>Energia napędów</strong> — czy silniki są w stanie wytworzyć
              te momenty? Ile prądu potrzeba? Jaka jest moc chwilowa? Ile energii
              zużywa robot w cyklu transportowym? Tym zajmuje się{" "}
              <a href="/modules/10-energy">moduł 10</a> — model elektromechaniczny
              silnika DC, przekładnia harmoniczna ze sprawnością zależną od
              obciążenia, i ostateczna metryka: zużycie energii dla zadanej
              trajektorii (kluczowa dla optymalizacji w rozdz. 7–8 dysertacji
              [Gruszka 2024]).
            </li>
            <li>
              <strong>Dynamika kontaktu</strong> — gdy robot trzyma obiekt albo
              wchodzi w interakcję z otoczeniem, w backward sweep zamiast{" "}
              <M tex="\mathbf{f}_{n+1} = \mathbf{0}" /> wpisujemy zmierzone (np. z
              czujnika 6-DOF F/T) lub żądane (impedance/admittance control)
              obciążenie zewnętrzne. Algorytm pozostaje ten sam — zmienia się
              tylko warunek początkowy ostatniej iteracji.
            </li>
            <li>
              <strong>Identyfikacja parametrów</strong> — w praktyce wartości
              <M tex="m_i" />, <M tex="\mathbf{p}_{Ci}" />, <M tex="I_{Ci}" /> z CAD
              są przybliżone (10–30% błędu). Można je <em>poprawiać</em> z pomiarów —
              regresja liniowa po zadanej trajektorii pozwala wyestymować
              parametry z dokładnością &lt; 3%. To temat rozdz. 9 dysertacji.
            </li>
            <li>
              <strong>Sterowanie wielocielne (whole-body)</strong> — dla
              humanoidów i robotów mobilnych ten sam algorytm uogólnia się na
              drzewa (tree-structured) i z więzami floating-base. Implementacje:
              <code> Pinocchio</code>, <code>RBDL</code>, <code>OCS2</code>.
              Aplikacje: chód dwunożny, mobile manipulation.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
