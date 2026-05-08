import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { Es5Playground } from "@/components/dynamics/es5-playground";
import { TorqueDisplay } from "@/components/dynamics/torque-display";
import { TorqueChart } from "@/components/dynamics/torque-chart";
import { NumericalExampleM9 } from "@/components/dynamics/numerical-example-m9";
import { CheatSheetM9 } from "@/components/dynamics/cheat-sheet-m9";
import { DissertationFigure } from "@/components/dynamics/dissertation-figure";

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
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 my-4 text-sm">
            <p className="font-semibold mb-1">Newton-Euler vs Lagrange</p>
            <p className="text-[var(--muted)] mb-2">
              Dwa równoważne sformułowania dynamiki manipulatora:
            </p>
            <ul className="text-[var(--muted)] list-disc pl-5 space-y-1">
              <li>
                <strong>Newton-Euler (rekurencyjny)</strong> — propaguje stan kinematyczny
                od bazy do efektora (forward sweep), potem siły od efektora do bazy
                (backward sweep). Postać jawna, łatwa w implementacji, koszt{" "}
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
        </section>

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
            <li>Liniowość modelu (małe przemieszczenia, brak deformacji ogniw).</li>
            <li>Niezmienność czasowa parametrów (brak rozszerzalności termicznej itp.).</li>
            <li>Sztywne ciała — pomijamy sprężystość ogniw i przekładni.</li>
            <li>Brak tarcia w przegubach (tarcie Coulomba i wiskotyczne dodajemy później osobno, jeśli potrzeba).</li>
            <li>Brak rezonansu strukturalnego silnika z ogniwem.</li>
          </ul>
          <p>
            <strong>Skąd wartości liczbowe?</strong> W dysertacji (str. 55, Tab. 6.2)
            parametry inercji ES5 wyznaczono z modelu 3D w oprogramowaniu CAD.
            W tej aplikacji używamy <em>oszacowania cylindrycznego</em> — każde
            ogniwo aproksymujemy jednorodnym cylindrem o znanej masie i
            przybliżonych wymiarach. Algorytm działa identycznie; różnica jest
            w wartościach liczbowych (rzędu 10–30%).
          </p>
        </StepPanel>

        <StepPanel number={2} title="Forward sweep · prędkości (eq. 6.6, 6.8)">
          <p>
            Sweep forward propaguje <em>stan kinematyczny</em> od bazy{" "}
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

          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-4 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Subtelność: kierunek transformacji R
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <p>
                Macierz <M tex="{}^{i+1}R_i" /> w eq. (6.6) jest macierzą rotacji
                z układu (i) do (i+1). W kodzie funkcja <code>linkTransform</code>{" "}
                (modifiedDHTransform) zwraca macierz <M tex="T^{i-1}_i" /> której
                kolumny to baza (i) wyrażona w (i-1). Aby przeprowadzić wektor z
                (i-1) do (i), aplikujemy <strong>transpozycję</strong>:{" "}
                <M tex="R^{\top}\,\mathbf{v}" /> (bo macierz rotacji jest ortogonalna).
                W naszym kodzie używamy <code>mat3TmulVec3(R, v)</code>.
              </p>
              <p>
                Drobna różnica notacyjna, ale błąd kosztuje godziny debugowania —
                bo dla q=0 wszystkie macierze są tożsamością i bug się nie ujawnia.
              </p>
            </div>
          </details>
        </StepPanel>

        <StepPanel number={3} title="Forward sweep · przyspieszenia (eq. 6.7, 6.9)">
          <p>
            Przyspieszenie kątowe wymaga uwagi na <strong>człon Coriolisa</strong>:
            kombinację prędkości dziedziczonej i prędkości własnego przegubu, która
            generuje dodatkowe przyspieszenie kątowe nawet przy zerowym{" "}
            <M tex="\ddot\theta" />:
          </p>
          <MathBlock tex="{}^{i+1}\boldsymbol{\varepsilon}_{i+1} = {}^{i+1}R_i\,{}^i\boldsymbol{\varepsilon}_i + ({}^{i+1}R_i\,{}^i\boldsymbol{\omega}_i)\times\dot\theta_{i+1}\hat{\mathbf{z}}_{i+1} + \ddot\theta_{i+1}\hat{\mathbf{z}}_{i+1}" />

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
            <em>automatycznie zawierają grawitację</em> — w forward sweep nie
            trzeba o niej pamiętać oddzielnie. Środek masy ogniwa dziedziczy
            przyspieszenie analogicznie:
          </p>
          <MathBlock tex="{}^i\mathbf{a}_{Ci} = {}^i\boldsymbol{\varepsilon}_i\times {}^i\mathbf{p}_{Ci} + {}^i\boldsymbol{\omega}_i\times({}^i\boldsymbol{\omega}_i\times {}^i\mathbf{p}_{Ci}) + {}^i\mathbf{a}_i" />

          <p>
            Dla typowej trajektorii pick-and-place na ES5 (q̇ ~1 rad/s, q̈ ~5 rad/s²),
            człon dośrodkowy ω×(ω×p) jest rzędu 0.5–2 m/s² — porównywalny z
            grawitacją (9.81 m/s²) i nie do pominięcia.
          </p>
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
            <M tex="I\,\boldsymbol\varepsilon" />. Drugi człon{" "}
            <M tex="\boldsymbol\omega\times(I\,\boldsymbol\omega)" /> to{" "}
            <strong>moment giroskopowy</strong>: pojawia się gdy ciało obraca się
            wokół osi, która <em>nie jest</em> jej osią główną bezwładności.
            Klasyczny przykład — żyroskop, który „opiera się" zmianie osi obrotu.
          </p>
          <p>
            <strong>Specjalny przypadek:</strong> gdy <M tex="\boldsymbol\omega" />{" "}
            jest wektorem własnym <M tex="I_C" /> (czyli leży wzdłuż jednej z osi
            głównych), wtedy <M tex="I\boldsymbol\omega = \lambda\boldsymbol\omega" />{" "}
            i <M tex="\boldsymbol\omega\times\lambda\boldsymbol\omega = 0" /> —
            człon giroskopowy znika.
          </p>
        </StepPanel>

        <StepPanel number={5} title="Backward sweep · siły reakcji w przegubach (Craig, 6.49)">
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
                <em>backward sweep</em>: znając obciążenia zewnętrzne (zerowe za końcówką),
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
            Dla zadanej trajektorii q(t), q̇(t), q̈(t) wyliczamy τ(t) dla każdego
            z 6 napędów. Wybierz scenariusz w dropdownie, dostosuj masę chwytaka
            i obserwuj rozkład momentów napędowych.
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

        <section className="prose-ik">
          <h2>Wzorzec liczbowy — pełny rachunek dla jednej trajektorii</h2>
          <p>
            Konkretny scenariusz testowy: <code>q = (0°, 45°, 45°, 0°, 90°, 0°)</code>,
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
            Mając wektor momentów napędowych <M tex="\tau_i" /> potrafimy odpowiedzieć
            na pytania: czy silniki są w stanie wytworzyć ten moment? Ile prądu
            potrzeba? Jaka jest moc chwilowa? Ile energii zużywa robot w cyklu
            transportowym? Tym zajmuje się <strong>moduł 10</strong> — model elektromechaniczny
            silnika DC, przekładnia harmoniczna ze sprawnością zależną od obciążenia,
            i ostateczna metryka: zużycie energii dla zadanej trajektorii (kluczowa
            dla optymalizacji w rozdz. 7–8 dysertacji [Gruszka 2024]).
          </p>
        </section>
      </div>
    </>
  );
}
