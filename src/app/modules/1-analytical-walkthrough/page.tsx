import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { DHTablePuma560 } from "@/components/walkthrough/dh-table";
import { Puma560Playground } from "@/components/robot/puma560-playground";
import { TargetPoseInput } from "@/components/walkthrough/target-pose-input";
import { IntermediateValues } from "@/components/walkthrough/intermediate-values";
import { ArmPlaneDiagram } from "@/components/walkthrough/arm-plane-diagram";
import { SolutionsGrid } from "@/components/walkthrough/solutions-grid";
import { PieperSchematic } from "@/components/walkthrough/pieper-schematic";
import { PumaDHSchematic } from "@/components/walkthrough/puma-dh-schematic";
import { CommonsImage } from "@/components/walkthrough/commons-image";
import { CosineTriangleDiagram } from "@/components/walkthrough/cosine-triangle-diagram";
import { NumericalExample } from "@/components/walkthrough/numerical-example";
import { CheatSheet } from "@/components/walkthrough/cheat-sheet";
import { DualRuntimeComparison } from "@/components/pyodide/dual-runtime-comparison";

export default function Module1() {
  return (
    <>
      <ModuleHeader slug="1-analytical-walkthrough" />
      <div className="px-8 py-8 max-w-5xl space-y-8">

        <section className="prose-ik">
          <h2>O czym jest ten moduł</h2>
          <p>
            Chcemy znaleźć kąty wszystkich sześciu przegubów Pumy560 tak, aby
            końcówka narzędzia (TCP) znalazła się w zadanym punkcie z zadaną
            orientacją. Zrobimy to <strong>analitycznie</strong> — czyli
            podamy jawne wzory algebraiczne, bez iteracji i bez szukania
            numerycznego. Dla Pumy jest to wyjątkowo proste dzięki szczególnej
            własności geometrycznej: osie trzech ostatnich przegubów
            (<M tex="q_4" />, <M tex="q_5" />, <M tex="q_6" />) przecinają się w
            jednym punkcie — <strong>środku nadgarstka</strong>. Ta własność jest
            jedną z form <em>warunku Piepera</em> (Pieper 1968).
          </p>
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 my-4 text-sm">
            <p className="font-semibold mb-1">Warunek Piepera — wystarczający, nie konieczny</p>
            <p className="text-[var(--muted)] mb-2">
              W literaturze (i często w skryptach uczelnianych) pada teza, że
              „rozwiązanie analityczne istnieje wtedy i tylko wtedy, gdy spełniony
              jest warunek Piepera". To <strong>nieprawda</strong>. Pieper pokazał
              jedynie, że jeśli trzy kolejne osie (a) przecinają się w jednym
              punkcie <em>albo</em> (b) są wzajemnie równoległe, to istnieje
              rozwiązanie zamknięte z dekompozycji 3+3.
            </p>
            <p className="text-[var(--muted)] mb-2">
              <strong>Kontrprzykłady:</strong>
            </p>
            <ul className="text-[var(--muted)] list-disc pl-5 space-y-1">
              <li>
                <strong>UR5/UR10</strong> (Universal Robots) — wrist nie zbiega
                w punkcie (przesunięcie <M tex="d_5" /> niezerowe), więc
                klasyczna „forma A" Piepera nie jest spełniona. Ale q₂, q₃, q₄
                są wzajemnie równoległe → spełnia formę B i ma rozwiązanie
                zamknięte (Hawkins 2013, Kufieta 2014).
              </li>
              <li>
                Manipulatory <strong>nie spełniające żadnej z form</strong>{" "}
                czasem także mają zamkniętą formę — przez ogólniejsze metody
                (Raghavan–Roth, redukcja do równania 16. stopnia). Trudniejszą
                geometrycznie, ale wciąż <em>nie</em> iteracyjną.
              </li>
            </ul>
            <p className="text-[var(--muted)] mt-2">
              Praktycznie każdy 6-DOF stosowany dziś w przemyśle (Puma, Stäubli,
              KUKA, ABB, Fanuc, UR) ma analityczne IK — bo producenci celowo
              projektują geometrię, by upraszczała wyprowadzenie. Dlatego
              analityczne IK <em>nie</em> jest egzotyką ani ograniczone do
              archaicznych konstrukcji.
            </p>
          </div>
          <p>
            Wracając do Pumy: warunek Piepera (forma A) sprawia, że 6-wymiarowe
            zadanie rozpada się na dwa łatwiejsze podproblemy 3-wymiarowe —
            najpierw wyznaczamy <M tex="q_1, q_2, q_3" />, żeby środek
            nadgarstka trafił w odpowiednie miejsce w przestrzeni, a potem{" "}
            <M tex="q_4, q_5, q_6" />, żeby narzędzie miało żądaną orientację.
            Cały rachunek sprowadza się do kilku zastosowań twierdzenia cosinusów
            i funkcji <code>atan2</code>.
          </p>
          <PieperSchematic />
        </section>

        <section className="prose-ik">
          <h2>Geometria Pumy560 w konwencji DH (Craig)</h2>
          <p>
            Do opisu manipulatora używamy <strong>zmodyfikowanej konwencji
            Denavita–Hartenberga</strong> (Craig, <em>Introduction to Robotics</em>,
            wyd. 3, rozdz. 3). Każdemu ogniwu przypisujemy własny{" "}
            <strong>układ współrzędnych</strong> (w literaturze angielskiej:{" "}
            <em>frame</em> — dalej krócej „układ {"{i}"}"). Przypisanie nie jest
            dowolne: oś <M tex="\hat{\mathbf{z}}_i" /> musi pokrywać się z osią
            obrotu przegubu <em>i</em>, a oś <M tex="\hat{\mathbf{x}}_{i-1}" />{" "}
            leży wzdłuż wspólnej normalnej łączącej osie przegubów <em>i−1</em>{" "}
            i <em>i</em>.
          </p>
          <CommonsImage
            src="/images/dh/dh-transformation.svg"
            alt="Cztery parametry Denavita–Hartenberga"
            caption="Cztery parametry DH: skręcenie ogniwa α (zielony), długość ogniwa a (fioletowy), odsadzenie d (czerwony), kąt przegubu θ (niebieski). Osie pokazane na dwóch sąsiednich ogniwach."
            author="Jahobr"
            license="Public Domain"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Denavit-Hartenberg-Transformation.svg"
            height={380}
          />
          <p>
            Cztery parametry na ogniwo — <M tex="\alpha_{i-1}" />,{" "}
            <M tex="a_{i-1}" />, <M tex="d_i" />, <M tex="\theta_i" /> — w
            pełni wyznaczają transformację z układu {"{i−1}"} do {"{i}"}.
            Intuicja geometryczna każdego z nich:
          </p>
          <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-2 text-xs my-4">
            <ParamPanel color="#c87941" symbol="aᵢ₋₁" name="długość ogniwa i−1">
              Odległość między osiami przegubów i−1 oraz i, mierzona wzdłuż ich wspólnej normalnej.
            </ParamPanel>
            <ParamPanel color="#a855f7" symbol="αᵢ₋₁" name="skręcenie ogniwa i−1">
              Kąt obrotu osi <i>ẑ</i><sub>i−1</sub> do <i>ẑ</i><sub>i</sub>, obracany wokół wspólnej normalnej.
            </ParamPanel>
            <ParamPanel color="#c87941" symbol="dᵢ" name="odsadzenie przegubu i">
              Przesunięcie początku układu {"{i}"} wzdłuż osi <i>ẑ</i><sub>i</sub> od wspólnej normalnej.
            </ParamPanel>
            <ParamPanel color="#a855f7" symbol="θᵢ" name="kąt przegubu i">
              Kąt obrotu osi <i>x̂</i><sub>i−1</sub> do <i>x̂</i><sub>i</sub> wokół <i>ẑ</i><sub>i</sub>. Dla przegubu obrotowego jest to zmienna konfiguracji.
            </ParamPanel>
          </div>
          <h3>Cztery elementarne transformacje składające się na T_{"{i−1}"}^{"{i}"}</h3>
          <p>
            Transformację z układu {"{i−1}"} do {"{i}"} można rozbić na cztery
            kolejne operacje wzdłuż lub wokół pojedynczej osi:
            <M tex="\;T_{i-1}^{i} = \mathrm{Rot}_x(\alpha_{i-1})\,\mathrm{Trans}_x(a_{i-1})\,\mathrm{Rot}_z(\theta_i)\,\mathrm{Trans}_z(d_i)" />.
            Każdy krok wprowadza jeden pośredni układ pomocniczy:
          </p>
          <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            <CommonsImage
              src="/images/dh/dh-step1.svg"
              alt="Krok 1 — rotacja wokół osi x o kąt α_{i-1}"
              caption="Krok 1 — Rot_x(α): obrót wokół osi x̂_{i−1} o kąt skręcenia ogniwa."
              author="Jahobr" license="Public Domain"
              sourceUrl="https://commons.wikimedia.org/wiki/File:Denavit-Hartenberg-Transformation_Step1.svg"
              height={180}
            />
            <CommonsImage
              src="/images/dh/dh-step2.svg"
              alt="Krok 2 — translacja wzdłuż osi x o długość a_{i-1}"
              caption="Krok 2 — Trans_x(a): translacja wzdłuż osi x̂ o długość ogniwa."
              author="Jahobr" license="Public Domain"
              sourceUrl="https://commons.wikimedia.org/wiki/File:Denavit-Hartenberg-Transformation_Step2.svg"
              height={180}
            />
            <CommonsImage
              src="/images/dh/dh-step3.svg"
              alt="Krok 3 — rotacja wokół osi z o kąt θ_i"
              caption="Krok 3 — Rot_z(θ): obrót wokół nowej osi ẑ o kąt przegubu (zmienna konfiguracji)."
              author="Jahobr" license="Public Domain"
              sourceUrl="https://commons.wikimedia.org/wiki/File:Denavit-Hartenberg-Transformation_Step3.svg"
              height={180}
            />
            <CommonsImage
              src="/images/dh/dh-step4.svg"
              alt="Krok 4 — translacja wzdłuż osi z o odsadzenie d_i"
              caption="Krok 4 — Trans_z(d): translacja wzdłuż osi ẑ o odsadzenie przegubu."
              author="Jahobr" license="Public Domain"
              sourceUrl="https://commons.wikimedia.org/wiki/File:Denavit-Hartenberg-Transformation_Step4.svg"
              height={180}
            />
          </div>
          <p>
            Złożenie tych czterech operacji daje pełną transformację 4×4. W
            praktyce piszemy od razu macierz w postaci zamkniętej (niżej),
            ale rozbicie na cztery kroki bywa pomocne przy derywacji i
            debugowaniu.
          </p>

          <h3>Klasyczna vs zmodyfikowana konwencja DH</h3>
          <p>
            W literaturze funkcjonują <strong>dwie różne wersje</strong>{" "}
            konwencji Denavita–Hartenberga. Różnią się miejscem przypinania
            układu współrzędnych do ogniwa oraz kolejnością elementarnych
            transformacji. Liczbowo te same parametry, ale{" "}
            <em>inny indeks</em> ogniwa — to najczęstsza pułapka przy
            porównywaniu wzorów z różnych książek.
          </p>
          <div className="grid gap-4 md:grid-cols-2 not-prose my-4">
            <CommonsImage
              src="/images/dh/dh-classic-convention.png"
              alt="Klasyczna konwencja DH (Denavit-Hartenberg 1955)"
              caption="Klasyczna DH: układ {i} przypięty do końca ogniwa i. Transformacja T_{i-1}^i = Rot_z(θᵢ)·Trans_z(dᵢ)·Trans_x(aᵢ)·Rot_x(αᵢ). Wszystkie cztery parametry mają ten sam indeks i."
              author="Pushpendra050"
              license="CC BY-SA 4.0"
              sourceUrl="https://commons.wikimedia.org/wiki/File:Classic_DH_Parameters_Convention.png"
              licenseUrl="https://creativecommons.org/licenses/by-sa/4.0/"
              height={320}
            />
            <CommonsImage
              src="/images/dh/dh-modified-convention.png"
              alt="Zmodyfikowana konwencja DH (Craig 1986)"
              caption="Zmodyfikowana DH (Craig): układ {i} przypięty do początku ogniwa i, na osi przegubu i. Transformacja T_{i-1}^i = Rot_x(αᵢ₋₁)·Trans_x(aᵢ₋₁)·Rot_z(θᵢ)·Trans_z(dᵢ). Indeksy α i a to i−1, nie i."
              author="Ollydbg"
              license="GFDL"
              sourceUrl="https://commons.wikimedia.org/wiki/File:DHParameter.png"
              licenseUrl="https://www.gnu.org/licenses/fdl-1.3.html"
              height={320}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Aspekt</th>
                <th>Klasyczna DH (1955)</th>
                <th>Zmodyfikowana DH Craiga (1986)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pozycja układu {"{i}"}</td>
                <td>Na końcu ogniwa i (po przegubie i+1)</td>
                <td>Na początku ogniwa i (oś <M tex="\hat{\mathbf{z}}_i" /> = oś przegubu i)</td>
              </tr>
              <tr>
                <td>Oś <M tex="\hat{\mathbf{z}}_i" /></td>
                <td>Pokrywa się z osią przegubu <em>i+1</em></td>
                <td>Pokrywa się z osią przegubu <em>i</em></td>
              </tr>
              <tr>
                <td>Transformacja <M tex="T_{i-1}^i" /></td>
                <td><M tex="R_z(\theta_i)\,T_z(d_i)\,T_x(a_i)\,R_x(\alpha_i)" /></td>
                <td><M tex="R_x(\alpha_{i-1})\,T_x(a_{i-1})\,R_z(\theta_i)\,T_z(d_i)" /></td>
              </tr>
              <tr>
                <td>Indeksy parametrów</td>
                <td>Wszystkie mają indeks <em>i</em> (<M tex="\alpha_i, a_i, d_i, \theta_i" />)</td>
                <td>Mieszane: <M tex="\alpha_{i-1}, a_{i-1}" /> i <M tex="d_i, \theta_i" /></td>
              </tr>
              <tr>
                <td>Kolejność operacji</td>
                <td>Najpierw rotacja wokół <M tex="z" /> (<M tex="\theta" />)</td>
                <td>Najpierw rotacja wokół <M tex="x" /> (<M tex="\alpha" />)</td>
              </tr>
              <tr>
                <td>Intuicja indeksu</td>
                <td>Parametry „opisują" ogniwo i−1→i jako całość</td>
                <td><M tex="\alpha, a" /> charakteryzują ogniwo <em>stałe</em>, <M tex="\theta, d" /> — przegub <em>zmienny</em></td>
              </tr>
              <tr>
                <td>Obsługa manipulatorów rozgałęzionych</td>
                <td>Trudna (indeks <em>i</em> zbiera parametry dwóch różnych ogniw)</td>
                <td>Naturalna (parametry jednoznacznie przypisane do linku)</td>
              </tr>
            </tbody>
          </table>
          <p>
            <strong>Jak to wpływa na IK?</strong> Dla tego samego fizycznego
            robota <em>liczby</em> <M tex="\alpha, a, d, \theta" /> są takie same,
            ale ich{" "}
            <em>przypisanie do indeksów</em> różni się o jeden. Jeśli wyprowadzasz
            rozwiązanie analityczne, pilnuj której książki używasz — wzory
            Craiga (które stosujemy w tym module) nie pasują dosłownie do
            tabeli DH z Siciliano/Khatib bez reindeksacji.
          </p>
          <p>
            W tym module i w całej aplikacji używamy <strong>zmodyfikowanej
            konwencji Craiga</strong> — głównie dlatego, że dla Pumy560 ma ona
            najkrótsze i najczytelniejsze wzory (tabela <em>α_{"{i-1}"}</em>{" "}
            kończy się zerami i <M tex="\pm\pi/2" />, co od razu upraszcza
            iloczyny macierzy). Wybór ma jednak charakter notacyjny — to nie
            jest „jedyna poprawna" konwencja.
          </p>

          <PumaDHSchematic />
          <DHTablePuma560/>
          <p>
            <M tex="a_2" /> to <em>długość ramienia</em> (upper arm),{" "}
            <M tex="d_4" /> to <em>długość przedramienia</em> (forearm).
            Dodatkowo w Pumie występują dwa niezerowe <em>odsadzenia</em>:
            <M tex="d_3" /> (odsadzenie przedramienia od osi ramienia, ok. 12,5 cm)
            oraz <M tex="a_3" /> (mały bok łokcia, ok. 2 cm). Te odsadzenia są
            źródłem większości komplikacji w wyprowadzeniu — bez nich Puma
            sprowadzałaby się do klasycznego planarnego manipulatora 2R.
          </p>
          <p>Transformacja ogniwa zapisana w konwencji zmodyfikowanej:</p>
          <MathBlock tex="{}^{i-1}T_{i} = \mathrm{Rot}_x(\alpha_{i-1})\,\mathrm{Trans}_x(a_{i-1})\,\mathrm{Rot}_z(\theta_i)\,\mathrm{Trans}_z(d_i)" />
          <MathBlock tex="= \begin{bmatrix} c\theta & -s\theta & 0 & a_{i-1} \\ s\theta\,c\alpha & c\theta\,c\alpha & -s\alpha & -s\alpha\,d_i \\ s\theta\,s\alpha & c\theta\,s\alpha & c\alpha & c\alpha\,d_i \\ 0 & 0 & 0 & 1 \end{bmatrix}" />
          <p>
            gdzie <M tex="c\theta = \cos\theta_i" />,{" "}
            <M tex="s\theta = \sin\theta_i" /> itd. Mnożąc kolejne takie
            macierze, dostaniemy <M tex="T_0^{6}" /> — pełne przekształcenie z
            bazy do układu efektora.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Laboratorium</h2>
          <p className="text-[var(--muted)]">
            Po lewej: manipulator, którym sterujesz ręcznie sześcioma suwakami —
            służy do generowania dowolnych poz testowych. Po prawej: pole pozy
            docelowej <M tex="T^*" /> z przyciskiem „zrzut z kontrolera", który
            kopiuje aktualne <M tex="T_0^{6}" /> robota jako cel IK. Wszystkie
            wartości pośrednie w kolejnych krokach przeliczane są na bieżąco —
            zmiana pozy celu od razu aktualizuje liczby poniżej.
          </p>
          <Puma560Playground showWristCenter height={420} />
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <IntermediateValues />
            <TargetPoseInput />
          </div>
        </section>

        <StepPanel number={0} title="Odseparowanie pozycji od orientacji (dekompozycja wristowa)">
          <p>
            Zadana poza efektora to macierz transformacji jednorodnej{" "}
            <M tex="4\times 4" /> — górne <M tex="3\times 3" /> to orientacja
            (macierz rotacji <M tex="R" />), a ostatnia kolumna to pozycja{" "}
            <M tex="\mathbf{p}" />:
          </p>
          <MathBlock tex="T^* = \begin{bmatrix} R & \mathbf{p} \\ \mathbf{0}^\top & 1 \end{bmatrix} \in SE(3)" />
          <p>
            Zbiór <M tex="SE(3)" /> to zbiór wszystkich takich macierzy — grupa
            sztywnych przesunięć i obrotów w przestrzeni. Szukamy wektora
            kątów <M tex="q = (q_1, \dots, q_6)" /> spełniającego{" "}
            <M tex="f(q) = T^*" />, gdzie <M tex="f" /> to odwzorowanie FK
            (kinematyka prosta).
          </p>
          <p>
            <strong>Obserwacja kluczowa:</strong> obroty w przegubach 4, 5, 6
            dzieją się wokół osi przecinających się w jednym punkcie (środku
            nadgarstka <M tex="\mathbf{p}_\mathrm{wc}" />). Obrót wokół osi
            przechodzącej przez punkt nie przesuwa tego punktu. Wobec tego
            położenie <M tex="\mathbf{p}_\mathrm{wc}" /> <em>nie zależy</em> od
            <M tex="q_4, q_5, q_6" /> — zależy tylko od{" "}
            <M tex="q_1, q_2, q_3" />.
          </p>
          <p>
            W konwencji Craiga dla Pumy zachodzi{" "}
            <M tex="d_6 = 0" />, więc środek nadgarstka pokrywa się z
            początkiem układu {"{6}"}. Jeśli dodatkowo nie ma offsetu narzędzia,
            środek nadgarstka to po prostu pozycja efektora:
          </p>
          <MathBlock tex="\mathbf{p}_\mathrm{wc} = \mathbf{p} - d_6 \cdot R\,\hat{\mathbf{z}} \;\overset{d_6 = 0}{=}\; \mathbf{p}" />
          <p>
            Gdy jest narzędzie (pewien stały offset <M tex="T_\mathrm{tool}" />{" "}
            między układem {"{6}"} a układem TCP), cofamy się o ten offset:
          </p>
          <MathBlock tex="T_0^{6} \;=\; T^* \cdot T_\mathrm{tool}^{-1}" />
          <p>
            Reasumując plan: najpierw znajdziemy{" "}
            <M tex="q_1, q_2, q_3" /> z pozycji środka nadgarstka (3 równania,
            3 niewiadome), potem <M tex="q_4, q_5, q_6" /> z warunku, że
            orientacja pozostałych trzech przegubów ma domknąć zadane{" "}
            <M tex="R" />.
          </p>
          <pre><code>{`const T06 = options.toolOffset
  ? mul4(target, invSE3(options.toolOffset))
  : target;

const R = extractRotation(T06);      // górne 3×3
const [px, py, pz] = extractPosition(T06);  // ostatnia kolumna`}</code></pre>
        </StepPanel>

        <StepPanel number={1} title="Wzór na pozycję środka nadgarstka">
          <p>
            Pozycja początku układu {"{4}"} (czyli środka nadgarstka) w bazie to
            ostatnia kolumna iloczynu czterech macierzy{" "}
            <M tex="T_0^4 = T_0^1\,T_1^2\,T_2^3\,T_3^4" />. Wstawiając parametry
            z tabeli DH (patrz wyprowadzenie poniżej), otrzymujemy:
          </p>
          <MathBlock tex="\begin{aligned} p_x &= c_1\,\bigl(a_2\,c_2 + a_3\,c_{23} - d_4\,s_{23}\bigr) - d_3\,s_1 \\ p_y &= s_1\,\bigl(a_2\,c_2 + a_3\,c_{23} - d_4\,s_{23}\bigr) + d_3\,c_1 \\ p_z &= -a_2\,s_2 - a_3\,s_{23} - d_4\,c_{23} \end{aligned}" />
          <p>
            gdzie <M tex="c_i = \cos q_i" />, <M tex="s_i = \sin q_i" />,{" "}
            <M tex="c_{23} = \cos(q_2+q_3)" />, <M tex="s_{23} = \sin(q_2+q_3)" />.
          </p>

          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-4 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Pokaż pełne wyprowadzenie iloczynu T<sub>0</sub><sup>4</sup>
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <p>
                Każda <M tex="T_{i-1}^i" /> w konwencji Craiga ma postać podaną wyżej.
                Dla Pumy 560 podstawiamy z tabeli DH:
              </p>
              <MathBlock tex="T_0^1 = R_z(q_1) = \begin{bmatrix} c_1 & -s_1 & 0 & 0 \\ s_1 & c_1 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}" />
              <p>(<M tex="\alpha_0 = 0,\,a_0 = 0,\,d_1 = 0" />, więc tylko obrót wokół z).</p>
              <MathBlock tex="T_1^2 = R_x(-\pi/2)\,R_z(q_2) = \begin{bmatrix} c_2 & -s_2 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ -s_2 & -c_2 & 0 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}" />
              <p>(<M tex="\alpha_1 = -\pi/2,\,a_1 = 0,\,d_2 = 0" />).</p>
              <MathBlock tex="T_2^3 = \mathrm{Trans}_x(a_2)\,R_z(q_3)\,\mathrm{Trans}_z(d_3) = \begin{bmatrix} c_3 & -s_3 & 0 & a_2 \\ s_3 & c_3 & 0 & 0 \\ 0 & 0 & 1 & d_3 \\ 0 & 0 & 0 & 1 \end{bmatrix}" />
              <p>(<M tex="\alpha_2 = 0,\,a_2 = a_2,\,d_3 = d_3" />).</p>
              <MathBlock tex="T_3^4 = R_x(-\pi/2)\,\mathrm{Trans}_x(a_3)\,R_z(q_4)\,\mathrm{Trans}_z(d_4)" />
              <p>
                Przy szukaniu <em>pozycji</em> środka nadgarstka (pierwsze 3 elementy
                ostatniej kolumny <M tex="T_0^4" />) nie potrzebujemy <M tex="q_4" />:
                wystarczy „adres" początku układu {"{4}"}, czyli punkt{" "}
                <M tex="(a_3, 0, d_4)^\top" /> wyrażony w bazie. Liczymy więc krócej:
              </p>
              <MathBlock tex="\mathbf{p}_\mathrm{wc} = T_0^1\,T_1^2\,T_2^3\,T_3^4\,(0,0,0,1)^\top = T_0^3\,(a_3,\,0,\,d_4,\,1)^\top" />
              <p>
                gdzie ostatnia transformacja <M tex="T_3^4" /> sprowadza się do
                obrotu wokół x i przesunięcia o <M tex="a_3" /> w x i <M tex="d_4" /> w z.
              </p>
              <p>
                Wymnażając kolejno: najpierw <M tex="T_2^3\,T_3^4" /> daje przesunięcie
                łokcia o <M tex="(a_3, 0, d_4)" /> obrócone przez <M tex="R_z(q_3)" />,
                potem <M tex="T_1^2" /> obraca to wokół osi x o <M tex="-\pi/2" /> i
                dodaje przegub <M tex="q_2" />, finalnie <M tex="T_0^1" /> obraca całość
                wokół pionowej osi bazy. W rezultacie dostajemy podane wyżej{" "}
                <M tex="p_x, p_y, p_z" /> — z efektywną długością przedramienia
                rozłożoną na składowe <M tex="a_3 c_{23} - d_4 s_{23}" /> w „radialnym"
                kierunku oraz <M tex="-a_3 s_{23} - d_4 c_{23}" /> w pionie.
              </p>
            </div>
          </details>

          <p>
            Zauważmy, że w pierwszych dwóch równaniach powtarza się to samo
            wyrażenie w nawiasie. Wprowadźmy skrót:
          </p>
          <MathBlock tex="\rho \;\equiv\; a_2\,c_2 + a_3\,c_{23} - d_4\,s_{23}" />
          <p>
            Geometrycznie <M tex="\rho" /> to <em>radialna odległość</em> środka
            nadgarstka od pionowej osi bazy w obróconym o <M tex="q_1" /> układzie —
            innymi słowy, „jak daleko" wrist centre jest od pionowej osi obrotu barku.
          </p>
          <p>
            Z dwóch pierwszych równań mamy <M tex="p_x = c_1\,\rho - d_3\,s_1" /> i{" "}
            <M tex="p_y = s_1\,\rho + d_3\,c_1" />. Są to składowe obrotu o kąt{" "}
            <M tex="q_1" /> wektora <M tex="(\rho, d_3)" /> w płaszczyźnie XY:
          </p>
          <MathBlock tex="\begin{bmatrix} p_x \\ p_y \end{bmatrix} = \underbrace{\begin{bmatrix} c_1 & -s_1 \\ s_1 & c_1 \end{bmatrix}}_{R_z(q_1)} \begin{bmatrix} \rho \\ d_3 \end{bmatrix}" />
          <p>
            Mnożąc obie strony tej równości przez{" "}
            <M tex="R_z(q_1)^{\top}" /> (transpozycja = inwersja, bo macierz
            obrotu jest ortogonalna) i odczytując:
          </p>
          <MathBlock tex="\begin{bmatrix} \rho \\ d_3 \end{bmatrix} = \begin{bmatrix} c_1 & s_1 \\ -s_1 & c_1 \end{bmatrix} \begin{bmatrix} p_x \\ p_y \end{bmatrix} \;\Longleftrightarrow\; \begin{cases} \rho = p_x\cos q_1 + p_y\sin q_1 \\ d_3 = -p_x\sin q_1 + p_y\cos q_1 \end{cases}" />
          <p>
            Podnosząc oba równania do kwadratu i dodając, lewa strona daje{" "}
            <M tex="\rho^2 + d_3^2" />, a prawa{" "}
            <M tex="(p_x c_1 + p_y s_1)^2 + (-p_x s_1 + p_y c_1)^2" /> = po
            rozwinięciu i uproszczeniu (krzyżowe wyrazy się znoszą,{" "}
            <M tex="c_1^2 + s_1^2 = 1" />) <M tex="p_x^2 + p_y^2" />. Stąd{" "}
            <strong>kluczowa identyczność</strong>:
          </p>
          <MathBlock tex="\boxed{\;p_x^2 + p_y^2 \;=\; \rho^2 + d_3^2\;}" />
          <p>
            Ta równość jest fundamentem całej dekompozycji. Lewa strona zależy
            wyłącznie od zadanych <M tex="p_x, p_y" /> (wiemy je), prawa strona
            zawiera tylko <M tex="\rho" />. Dlatego{" "}
            <M tex="\rho" /> wyliczamy natychmiast — <em>bez</em> znajomości{" "}
            <M tex="q_2, q_3" />.
          </p>
        </StepPanel>

        <StepPanel number={2} title="Wyznaczenie q₁ — dwie gałęzie barku">
          <p>
            Z identyczności kroku 1 wyznaczamy <M tex="\rho" />, ale z
            dokładnością do znaku (bo pierwiastek kwadratowy daje dwie wartości):
          </p>
          <MathBlock tex="\rho = \pm\sqrt{p_x^2 + p_y^2 - d_3^2}" />
          <p>
            Jeśli <M tex="p_x^2 + p_y^2 < d_3^2" />, zadanie jest{" "}
            <strong>nieosiągalne</strong> — cel leży w „zakazanym" cylindrze o
            promieniu <M tex="d_3" /> wokół pionowej osi bazy. W pozostałych
            przypadkach znak <M tex="\rho" /> wyznacza, czy bark Pumy zwraca
            się w kierunku celu (<em>shoulder right</em>,{" "}
            <M tex="\rho > 0" />), czy odwrotnie, o <M tex="\pi" /> obrócony{" "}
            (<em>shoulder left</em>, <M tex="\rho < 0" />). Obie konfiguracje
            dają identyczną pozycję wrist centre — stąd „gałąź" w algorytmie.
          </p>
          <p>
            Mając <M tex="\rho" /> i <M tex="d_3" />, rozwiązujemy układ dwóch
            liniowych równań w <M tex="(\cos q_1, \sin q_1)" /> z poprzedniej
            strony:
          </p>
          <MathBlock tex="\begin{cases} p_x\cos q_1 + p_y\sin q_1 = \rho \\ -p_x\sin q_1 + p_y\cos q_1 = d_3 \end{cases}" />
          <p>
            Formalnie rozwiązujemy go przez wyznacznik, ale ładniej zapisuje się
            to przez różnicę dwóch funkcji <code>atan2</code> — <M tex="q_1" />{" "}
            jest różnicą kąta do celu (<M tex="p_x, p_y" />) i kąta „w bok" o
            odsadzeniu <M tex="d_3" />:
          </p>
          <MathBlock tex="\boxed{\;q_1 \;=\; \operatorname{atan2}(p_y,\,p_x) \;-\; \operatorname{atan2}(d_3,\,\rho)\;}" />
          <p>
            Dwuargumentowa funkcja <code>atan2(y, x)</code> — w odróżnieniu od
            zwykłego <code>arctan(y/x)</code> — zwraca kąt na pełnym przedziale{" "}
            <M tex="(-\pi, \pi]" />, uwzględniając znaki obu argumentów. To
            ważne: zwykły <code>arctan</code> traci informację o ćwiartce, przez
            co „widzi" kąty z góry i z dołu jako identyczne.
          </p>
          <p>
            <strong>Częsty błąd w kodach studenckich:</strong> użycie{" "}
            <code>atan2(py, px)</code> bez drugiego członu{" "}
            <code>atan2(d₃, ρ)</code>. Dla Pumy daje to stały błąd rzędu 7°
            — odpowiadający kątowi „w bok" wymuszonemu przez odsadzenie{" "}
            <M tex="d_3" />.
          </p>
          <pre><code>{`const phi   = Math.atan2(py, px);                           // kąt do celu w XY
const rho   = rhoSign * Math.sqrt(px*px + py*py - D3*D3);   // ±
const q1    = phi - Math.atan2(D3, rho);                    // q₁ na obu gałęziach`}</code></pre>
        </StepPanel>

        <StepPanel number={3} title="Przejście do 2-wymiarowej płaszczyzny ramienia">
          <p>
            Po wyznaczeniu <M tex="q_1" /> obracamy cały układ o ten kąt wokół
            pionowej osi bazy. W tak obróconym układzie całe ramię robota leży
            w <strong>jednej pionowej płaszczyźnie</strong> — oznaczmy jej
            współrzędne jako <M tex="(\rho, z)" />, gdzie <M tex="\rho" /> to
            odległość od pionowej osi bazy (dodatnia po „stronie" celu),
            a <M tex="z" /> — wysokość nad płaszczyzną podstawy.
          </p>
          <p>
            W tej płaszczyźnie zostało nam zadanie 2-wymiarowe: połączyć bark{" "}
            <M tex="(0, 0)" /> ze środkiem nadgarstka <M tex="(\rho, z)" /> za
            pomocą dwóch ogniw — <strong>ramienia</strong> o długości{" "}
            <M tex="a_2" /> i <strong>przedramienia</strong> o pewnej{" "}
            <em>efektywnej długości</em> <M tex="L" />, z łokciem gdzieś
            pomiędzy.
          </p>
          <p>
            Czym jest <M tex="L" />? Początek układu {"{4}"} (wrist centre) nie
            leży na prostym przedłużeniu ramienia — jest przesunięty względem
            łokcia o dwa składowe: <M tex="a_3" /> wzdłuż osi X układu {"{3}"}{" "}
            (mały bok, ok. 2 cm) i <M tex="d_4" /> wzdłuż osi Z układu {"{3}"}{" "}
            (długi, ok. 43 cm). Skąd ta konstrukcja? Fizycznie wynika z tego, że
            silnik napędzający przedramię musi się gdzieś zmieścić obok łokcia,
            więc geometrycznie przedramię jest „schowane" za mały boczny
            segment.
          </p>
          <p>
            W płaszczyźnie ramienia wektor od łokcia do środka nadgarstka ma
            długość:
          </p>
          <MathBlock tex="L = \sqrt{a_3^2 + d_4^2} \approx 0{,}4323\,\mathrm{m}" />
          <p>
            i jest odchylony od osi X układu {"{3}"} o stały kąt:
          </p>
          <MathBlock tex="\beta = \operatorname{atan2}(d_4, a_3) \approx 87{,}3^\circ" />
          <p>
            O tym odchyleniu pamiętamy przy obliczaniu <M tex="q_3" /> w
            następnym kroku.
          </p>
          <ArmPlaneDiagram />
        </StepPanel>

        <StepPanel number={4} title="Wyznaczenie q₃ — twierdzenie cosinusów, dwie gałęzie łokcia">
          <p>
            <strong>Spojrzenie geometryczne.</strong> W płaszczyźnie ramienia bark{" "}
            <M tex="A" />, łokieć <M tex="E" /> i środek nadgarstka <M tex="W" />{" "}
            tworzą trójkąt z <em>trzema znanymi długościami</em>: <M tex="a_2" />{" "}
            (ramię), <M tex="L" /> (efektywne przedramię) i{" "}
            <M tex="D = \sqrt{\rho^2 + p_z^2}" /> (przekątna bark→wrist). Każdy
            trójkąt o danych trzech bokach ma jednoznacznie wyznaczone wszystkie
            kąty wewnętrzne — w szczególności kąt <M tex="\gamma" /> przy łokciu:
          </p>
          <CosineTriangleDiagram />
          <p>
            Z prawa cosinusów (zastosowanego do boku <M tex="D" /> przeciwległego
            kątowi <M tex="\gamma" />):
          </p>
          <MathBlock tex="D^2 = a_2^2 + L^2 - 2\,a_2\,L\,\cos\gamma \;\Rightarrow\; \cos\gamma = \frac{a_2^2 + L^2 - D^2}{2\,a_2\,L}" />
          <p>
            Pełny kąt wewnętrzny trójkąta wyciąga się standardowo przez{" "}
            <code>atan2</code> (a nie <code>acos</code>), żeby zachować
            informację o znaku <M tex="\sin\gamma" />:
          </p>
          <MathBlock tex="\gamma = \operatorname{atan2}\bigl(\pm\sqrt{1 - \cos^2\gamma},\;\cos\gamma\bigr)" />
          <p>
            Znak <M tex="\pm" /> przed <M tex="\sin\gamma" /> odpowiada wyborowi
            <em> elbow up </em>(łokieć powyżej linii bark↔wrist) lub{" "}
            <em>elbow down</em> (poniżej) — dwa odbicia trójkąta względem boku{" "}
            <M tex="D" />.
          </p>

          <p>
            <strong>Powiązanie z q₃.</strong> Kąt <M tex="\gamma" /> przy łokciu
            nie jest tożsamy z <M tex="q_3" />. Gdyby przedramię biegło dokładnie
            wzdłuż osi <M tex="\hat{x}_3" /> (czyli{" "}
            <M tex="d_4 = 0" />), wówczas <M tex="q_3 = \pi - \gamma" />. W Pumie
            jednak przedramię jest „odchylone" od osi <M tex="\hat{x}_3" /> o
            stały kąt <M tex="\beta = \operatorname{atan2}(d_4, a_3) \approx 87{,}3^\circ" />{" "}
            (z kroku 3), więc:
          </p>
          <MathBlock tex="q_3 \;=\; \pi - \gamma - \beta" />

          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-4 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Pokaż równoważne wyprowadzenie algebraiczne (z dwóch równań pozycji)
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <p>
                Biorąc dwie zależności z kroku 1,{" "}
                <M tex="\rho = a_2 c_2 + a_3 c_{23} - d_4 s_{23}" /> i{" "}
                <M tex="p_z = -a_2 s_2 - a_3 s_{23} - d_4 c_{23}" />, podnosimy
                oba do kwadratu i dodajemy. Wyrazy z <M tex="c_2 s_{23}" /> i{" "}
                <M tex="s_2 c_{23}" /> składają się w sumę kątów{" "}
                <M tex="\sin(q_2 - (q_2 + q_3)) = -\sin q_3" />, podobnie{" "}
                <M tex="c_2 c_{23} + s_2 s_{23} = \cos q_3" />. Po uproszczeniu:
              </p>
              <MathBlock tex="\rho^2 + p_z^2 \;=\; a_2^2 + a_3^2 + d_4^2 + 2a_2\bigl(a_3\,c_3 - d_4\,s_3\bigr)" />
              <p>Oznaczając lewą stronę (znaną) przez <M tex="K" />:</p>
              <MathBlock tex="K \;=\; \frac{\rho^2 + p_z^2 - a_2^2 - a_3^2 - d_4^2}{2 a_2} \;=\; a_3\,c_3 - d_4\,s_3" />
              <p>
                Wyrażenie <M tex="a_3\,c_3 - d_4\,s_3" /> to liniowa kombinacja
                sinusa i cosinusa o tym samym argumencie — można ją zapisać jako
                jeden cosinus z przesuniętym kątem:
              </p>
              <MathBlock tex="a_3\cos q_3 - d_4\sin q_3 \;=\; L\,\cos(q_3 + \beta)" />
              <p>
                (sprawdź: rozwijając prawą stronę przez{" "}
                <M tex="\cos(q_3+\beta) = c_3\cos\beta - s_3\sin\beta" /> i
                podstawiając <M tex="L\cos\beta = a_3" />,{" "}
                <M tex="L\sin\beta = d_4" /> — obie strony się zgadzają).
              </p>
              <p>
                Stąd <M tex="\cos(q_3 + \beta) = K/L" />, więc{" "}
                <M tex="\sin(q_3 + \beta) = \pm\sqrt{1 - K^2/L^2}" />, i:
              </p>
              <MathBlock tex="q_3 \;=\; \operatorname{atan2}\!\bigl(\pm\sqrt{L^2 - K^2},\;K\bigr) \;-\; \beta" />
              <p>
                <strong>Spójność z wyprowadzeniem geometrycznym:</strong>{" "}
                <M tex="K = -L\cos\gamma" /> (różnica znaku wynika z definicji
                kąta), więc <M tex="\cos(q_3+\beta) = -\cos\gamma = \cos(\pi - \gamma)" />,
                czyli <M tex="q_3 + \beta = \pi - \gamma" /> — ten sam wynik.
              </p>
            </div>
          </details>

          <p>
            <strong>Postać końcowa</strong> (wykorzystywana w kodzie — jeden{" "}
            <code>atan2</code> zamiast łańcucha kątów):
          </p>
          <MathBlock tex="\boxed{\;q_3 \;=\; \operatorname{atan2}\!\bigl(\pm\sqrt{L^2 - K^2},\;K\bigr) \;-\; \beta\;}" />
          <p>
            Znak <M tex="\pm" /> odpowiada dwóm gałęziom geometrycznym — łokieć „w
            górę" lub „w dół". Gdy <M tex="L^2 < K^2" />, cel leży poza zasięgiem
            ramienia dla danej gałęzi barku — kombinacja{" "}
            <em>shoulder</em>+<em>elbow</em> nie ma rozwiązania (trójkąt o takich
            bokach nie istnieje, bo nie spełnia nierówności trójkąta).
          </p>
          <pre><code>{`const K     = (rho*rho + pz*pz - A2*A2 - A3*A3 - D4*D4) / (2*A2);
const L     = Math.sqrt(A3*A3 + D4*D4);
const beta  = Math.atan2(D4, A3);
const disc  = L*L - K*K;
if (disc < 0) continue;                               // poza zasięgiem
const q3    = Math.atan2(elbowSign * Math.sqrt(disc), K) - beta;`}</code></pre>
        </StepPanel>

        <StepPanel number={5} title="Wyznaczenie q₂ — 2×2 układ liniowy w cosinusach">
          <p>
            Mając już znane <M tex="q_3" />, wracamy do dwóch równań pozycji z
            kroku 1 — tym razem traktując <M tex="q_2" /> jako jedyną niewiadomą.
            Składowe radialna i pionowa to:
          </p>
          <MathBlock tex="\rho \;=\; a_2\,c_2 + a_3\,c_{23} - d_4\,s_{23}, \qquad p_z \;=\; -a_2\,s_2 - a_3\,s_{23} - d_4\,c_{23}" />
          <p>
            Stosujemy wzory na sumę kątów:{" "}
            <M tex="c_{23} = c_2 c_3 - s_2 s_3" /> oraz{" "}
            <M tex="s_{23} = s_2 c_3 + c_2 s_3" />. Wstawiając do pierwszego równania:
          </p>
          <MathBlock tex="\rho \;=\; a_2 c_2 + a_3(c_2 c_3 - s_2 s_3) - d_4(s_2 c_3 + c_2 s_3)" />
          <p>
            Grupujemy wyrazy przy <M tex="c_2" /> i <M tex="s_2" /> osobno:
          </p>
          <MathBlock tex="\rho \;=\; (a_2 + a_3 c_3 - d_4 s_3)\,c_2 \;-\; (a_3 s_3 + d_4 c_3)\,s_2" />
          <p>
            Tak samo dla <M tex="p_z" />:{" "}
            <M tex="-(a_3 s_3 + d_4 c_3)\,c_2 - (a_2 + a_3 c_3 - d_4 s_3)\,s_2" />.
            Wprowadzając skróty na powtarzające się grupy:
          </p>
          <MathBlock tex="M \;\equiv\; a_2 + a_3\,c_3 - d_4\,s_3, \qquad N \;\equiv\; a_3\,s_3 + d_4\,c_3" />
          <p>
            (zauważ: <M tex="M, N" /> zależą tylko od znanego{" "}
            <M tex="q_3" /> i stałych DH), oba równania zapisują się zwarto jako
            układ liniowy 2×2:
          </p>
          <MathBlock tex="\begin{bmatrix} M & -N \\ -N & -M \end{bmatrix} \begin{bmatrix} c_2 \\ s_2 \end{bmatrix} \;=\; \begin{bmatrix} \rho \\ p_z \end{bmatrix}" />
          <p>
            Wyznacznik macierzy współczynników:{" "}
            <M tex="\det = M\cdot(-M) - (-N)\cdot(-N) = -(M^2 + N^2)" />. Z reguły
            Cramera (lub bezpośrednio przez inwersję 2×2):
          </p>
          <MathBlock tex="c_2 \;=\; \frac{M\,\rho - N\,p_z}{M^2 + N^2}, \qquad s_2 \;=\; \frac{-M\,p_z - N\,\rho}{M^2 + N^2}" />
          <p>
            Wyznacznik <M tex="M^2 + N^2" /> znika tylko, gdy jednocześnie{" "}
            <M tex="a_2 = a_3 = d_4 = 0" /> — niemożliwe dla fizycznego
            manipulatora. Mając <M tex="c_2" /> i <M tex="s_2" /> jednocześnie,
            kąt wyznacza <code>atan2</code>:
          </p>
          <MathBlock tex="\boxed{\;q_2 \;=\; \operatorname{atan2}(s_2,\,c_2)\;}" />
          <p>
            <strong>Dlaczego nie</strong> <code>q₂ = arcsin(s₂)</code>{" "}
            <strong>lub</strong> <code>arccos(c₂)</code>? Każda z tych funkcji
            zwraca wartość tylko z połowy okręgu — tracimy informację o znaku
            drugiego składnika. <code>atan2(s, c)</code> używa znaków{" "}
            <em>obu</em> argumentów, dając jednoznaczny kąt na całym okręgu{" "}
            <M tex="(-\pi, \pi]" />. Klasyczny błąd implementacyjny: „policz{" "}
            <code>arctan(s/c)</code> i zgadnij ćwiartkę po znakach" — działa
            tylko po stronie poprawnie pamiętających autorów.
          </p>
        </StepPanel>

        <StepPanel number={6} title="Przejście od pozycji do orientacji — macierz R₃⁶">
          <p>
            Do tego momentu zajmowaliśmy się <em>pozycją</em> środka
            nadgarstka. Teraz przechodzimy do <em>orientacji</em>: trzy ostatnie
            przeguby <M tex="q_4, q_5, q_6" /> muszą obrócić nadgarstek tak,
            aby pełna macierz <M tex="R_0^6" /> zgodziła się z zadanym{" "}
            <M tex="R" />.
          </p>
          <p>
            Część rotacyjną macierzy <M tex="T_0^3" /> — czyli{" "}
            <M tex="R_0^3" /> — wyliczamy ze znanych już{" "}
            <M tex="q_1, q_2, q_3" />. Kluczowa obserwacja: w konwencji Craiga{" "}
            <M tex="q_2" /> i <M tex="q_3" /> obracają się wokół tej samej
            (poziomej) osi <M tex="\hat{z}_2 = \hat{z}_3" />, bo{" "}
            <M tex="\alpha_2 = 0" /> w tabeli DH (między układami {"{2}"} i {"{3}"}{" "}
            nie ma skręcenia osi). Obroty wokół wspólnej osi zwyczajnie się
            dodają: <M tex="R_z(q_2)\,R_z(q_3) = R_z(q_2 + q_3)" />. Razem:
          </p>
          <MathBlock tex="R_0^3 \;=\; \underbrace{R_z(q_1)}_{T_0^1}\,\underbrace{R_x(-\pi/2)}_{T_1^2,\;\text{część rotacyjna}}\,\underbrace{R_z(q_2 + q_3)}_{T_2^3,\;\text{część rotacyjna}}" />

          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-4 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Pokaż jawne mnożenie trzech macierzy 3×3
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <p>Krok 1 — pomnóżmy <M tex="R_x(-\pi/2)\,R_z(q_2 + q_3)" />:</p>
              <MathBlock tex="\begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & -1 & 0 \end{bmatrix} \begin{bmatrix} c_{23} & -s_{23} & 0 \\ s_{23} & c_{23} & 0 \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} c_{23} & -s_{23} & 0 \\ 0 & 0 & 1 \\ -s_{23} & -c_{23} & 0 \end{bmatrix}" />
              <p>
                (mnożenie wiersz·kolumna; <M tex="R_x(-\pi/2)" /> ma{" "}
                <M tex="\cos(-\pi/2) = 0,\,\sin(-\pi/2) = -1" />, stąd druga i
                trzecia kolumna).
              </p>
              <p>Krok 2 — pomnóżmy <M tex="R_z(q_1)" /> z wynikiem powyżej:</p>
              <MathBlock tex="\begin{bmatrix} c_1 & -s_1 & 0 \\ s_1 & c_1 & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} c_{23} & -s_{23} & 0 \\ 0 & 0 & 1 \\ -s_{23} & -c_{23} & 0 \end{bmatrix}" />
              <p>
                Pierwszy wiersz: <M tex="(c_1\cdot c_{23} + (-s_1)\cdot 0 + 0\cdot(-s_{23}),\;c_1\cdot(-s_{23}) + (-s_1)\cdot 0 + 0\cdot(-c_{23}),\;c_1\cdot 0 + (-s_1)\cdot 1 + 0\cdot 0)" />.
              </p>
              <p>Po uproszczeniu wszystkich trzech wierszy:</p>
              <MathBlock tex="R_0^3 \;=\; \begin{bmatrix} c_1\,c_{23} & -c_1\,s_{23} & -s_1 \\ s_1\,c_{23} & -s_1\,s_{23} & c_1 \\ -s_{23} & -c_{23} & 0 \end{bmatrix}" />
              <p>
                Sprawdzenie ortogonalności: każdy wiersz ma normę{" "}
                <M tex="c_1^2 c_{23}^2 + c_1^2 s_{23}^2 + s_1^2 = c_1^2 + s_1^2 = 1" />,
                a iloczyn skalarny pierwszych dwóch wierszy:{" "}
                <M tex="c_1 s_1 c_{23}^2 + c_1 s_1 s_{23}^2 - s_1 c_1 = 0" />.
                Zgodnie z oczekiwaniem dla macierzy obrotu.
              </p>
            </div>
          </details>

          <p>
            Wynik jawny (przepisany dla wygody — używamy go bezpośrednio w kodzie):
          </p>
          <MathBlock tex="R_0^3 \;=\; \begin{bmatrix} c_1\,c_{23} & -c_1\,s_{23} & -s_1 \\ s_1\,c_{23} & -s_1\,s_{23} & c_1 \\ -s_{23} & -c_{23} & 0 \end{bmatrix}" />
          <p>
            Dalej: jeśli <M tex="R = R_0^6 = R_0^3 \cdot R_3^6" />, to nadgarstek
            musi dostarczyć „brakującą" rotację:
          </p>
          <MathBlock tex="R_3^6 \;=\; (R_0^3)^{-1}\,R \;=\; (R_0^3)^{\!\top}\,R" />
          <p>
            Równość <M tex="(R_0^3)^{-1} = (R_0^3)^{\top}" /> wynika z
            ortogonalności macierzy rotacji (wiersze są ortonormalne). W
            implementacji liczymy więc po prostu iloczyn transponowanej
            macierzy przez <M tex="R" /> — bez wywoływania numerycznej inwersji.
          </p>
          <pre><code>{`const c1 = Math.cos(q1), s1 = Math.sin(q1);
const c23 = Math.cos(q2+q3), s23 = Math.sin(q2+q3);

// R₃⁶ = R₀³ᵀ · R   (mnożenie wiersz po wierszu)
const R36_00 =  c1*c23*r11 + s1*c23*r21 - s23*r31;
// ... pozostałe 8 elementów analogicznie`}</code></pre>
        </StepPanel>

        <StepPanel number={7} title="Ekstrakcja q₄, q₅, q₆ z macierzy R₃⁶">
          <p>
            Trzy ostatnie ogniwa Pumy to klasyczny <strong>nadgarstek
            ZYZ-podobny</strong>: dwa skręcenia osi <M tex="\pm\pi/2" /> między
            kolejnymi przegubami sprawiają, że osie <M tex="\hat z_4" />,{" "}
            <M tex="\hat z_5" />, <M tex="\hat z_6" /> są wzajemnie prostopadłe i
            schodzą się w jednym punkcie (środek nadgarstka). Z tabeli DH (
            <M tex="\alpha_3 = -\pi/2" />, <M tex="\alpha_4 = \pi/2" />,{" "}
            <M tex="\alpha_5 = -\pi/2" />), iloczyn:
          </p>
          <MathBlock tex="R_3^6 = R_z(q_4)\,R_x(-\pi/2)\,R_z(q_5)\,R_x(\pi/2)\,R_z(q_6)" />
          <p>
            ma klasyczną postać macierzy ZYZ: środkowy <M tex="q_5" /> obraca
            wokół osi prostopadłej do osi <M tex="q_4" /> i <M tex="q_6" />, więc
            środkowy element całej macierzy to <M tex="\cos q_5" />, a środkowy
            wiersz/kolumna kodują <M tex="q_4 \pm q_6" />. Po wymnożeniu:
          </p>
          <MathBlock tex="R_3^6 = \begin{bmatrix} c_4 c_5 c_6 - s_4 s_6 & -c_4 c_5 s_6 - s_4 c_6 & -c_4 s_5 \\ s_5 c_6 & -s_5 s_6 & c_5 \\ -s_4 c_5 c_6 - c_4 s_6 & s_4 c_5 s_6 - c_4 c_6 & s_4 s_5 \end{bmatrix}" />
          <p>
            Element środkowego wiersza{" "}
            <M tex="R_3^6[1][2] = c_5" /> daje nam <M tex="q_5" /> z dokładnością
            do znaku <M tex="\sin q_5" />. Pozostałe elementy średniej kolumny
            i wiersza rozszyfrowują <M tex="q_4" /> i <M tex="q_6" />:
          </p>
          <MathBlock tex="c_5 = R_3^6[1][2], \qquad s_5\cos q_6 = R_3^6[1][0], \qquad -\,s_5\sin q_6 = R_3^6[1][1]" />
          <MathBlock tex="-\,c_4\,s_5 = R_3^6[0][2], \qquad s_4\,s_5 = R_3^6[2][2]" />
          <p>
            Ponieważ <M tex="\sin q_5" /> występuje w każdej równości osobno, a
            może być dodatni lub ujemny, dostajemy <strong>dwie gałęzie</strong>{" "}
            nadgarstka (<em>no-flip</em> i <em>flip</em>). Dla{" "}
            <M tex="\sin q_5 \neq 0" />:
          </p>
          <MathBlock tex="q_5 \;=\; \operatorname{atan2}\!\left(\pm\sqrt{R_3^6[1][0]^2 + R_3^6[1][1]^2},\;R_3^6[1][2]\right)" />
          <MathBlock tex="q_4 \;=\; \operatorname{atan2}(\pm R_3^6[2][2],\;\mp R_3^6[0][2])" />
          <MathBlock tex="q_6 \;=\; \operatorname{atan2}(\mp R_3^6[1][1],\;\pm R_3^6[1][0])" />
          <p>(górne znaki — gałąź no-flip, dolne — flip).</p>

          <h3>Singularność nadgarstka (q₅ ≈ 0)</h3>
          <p>
            Gdy <M tex="\sin q_5 \to 0" />, dwa końcowe obroty nadgarstka
            zachodzą wokół tej samej osi. Matematycznie wyzerowuje się cała
            średnia kolumna i średni wiersz (poza <M tex="c_5 = \pm 1" />),
            a w macierzy <M tex="R_3^6" /> pozostaje tylko rotacja sumaryczna{" "}
            <M tex="q_4 + q_6" />. Tracimy stopień swobody: pojedynczy kąt{" "}
            <M tex="q_4" /> albo <M tex="q_6" /> z osobna jest{" "}
            <strong>nieokreślony</strong>, wyznaczona jest tylko ich suma.
          </p>
          <p>
            W kodzie detekujemy to przez obliczenie{" "}
            <M tex="|\sin q_5| = \sqrt{R_3^6[1][0]^2 + R_3^6[1][1]^2}" />.
            Gdy ta liczba jest mniejsza niż ustalona tolerancja, wybieramy
            umownie <M tex="q_4 = 0" /> i resztę dopasowujemy tak, by
            orientacja docelowa była zachowana.
          </p>
          <pre><code>{`const sq5_abs = Math.hypot(R36_10, R36_11);
if (sq5_abs < eps) {
  // singularność: tylko q₄ + q₆ określone; przyjmujemy q₄ = 0
  const q5 = Math.atan2(0, R36_12);
  const q6 = Math.atan2(-R36_01, R36_00);
} else {
  for (const wristSign of [+1, -1]) {
    const q5 = Math.atan2(wristSign * sq5_abs, R36_12);
    const q4 = Math.atan2( wristSign*R36_22, -wristSign*R36_02);
    const q6 = Math.atan2(-wristSign*R36_11,  wristSign*R36_10);
  }
}`}</code></pre>
        </StepPanel>

        <StepPanel number={8} title="Osiem rozwiązań — enumeracja i selekcja praktyczna">
          <p>
            W trzech miejscach podejmowaliśmy decyzję „znak <M tex="+" /> czy{" "}
            <M tex="-" />":
          </p>
          <ul>
            <li><strong>shoulder</strong> — znak <M tex="\rho" /> (krok 2),</li>
            <li><strong>elbow</strong> — znak <M tex="\sqrt{L^2 - K^2}" /> (krok 4),</li>
            <li><strong>wrist</strong> — znak <M tex="\sin q_5" /> (krok 7).</li>
          </ul>
          <p>
            Trzy niezależne wybory binarne dają <M tex="2^3 = 8" /> kombinacji
            — dlatego typowo dla Pumy mamy do ośmiu różnych konfiguracji{" "}
            <M tex="q" /> osiągających tę samą pozę efektora. W praktyce bywa
            mniej: jeśli dyskryminant łokcia wyjdzie ujemny, odrzucamy parę
            <em>shoulder</em>+<em>elbow</em>; jeśli natrafimy na singularność
            nadgarstka, dwie gałęzie <em>wrist</em> zlewają się w jedną.
          </p>
          <p>
            Który z tych ośmiu wyników wybrać? Sam algorytm IK tego nie
            rozstrzyga — selekcja to osobny krok planowania ruchu. Najczęściej
            stosowane kryteria:
          </p>
          <ul>
            <li>
              <strong>Najbliższy aktualnej konfiguracji</strong> —
              minimalizacja ruchu przegubów, z uwzględnieniem zawinięcia kątów
              (bo <M tex="q_i" /> i <M tex="q_i + 2\pi" /> to mechanicznie różne
              położenia, a matematycznie ten sam kąt).
            </li>
            <li>
              <strong>W granicach przegubowych</strong> — niektóre teoretyczne
              rozwiązania mogą być fizycznie nieosiągalne.
            </li>
            <li>
              <strong>Z dala od singularności</strong> — wartość manipulacyjności{" "}
              (patrz moduł 7) jako dodatkowe kryterium.
            </li>
            <li>
              <strong>Bez kolizji</strong> — sprawdzenie zewnętrznym kolizją
              checker.
            </li>
          </ul>
          <p className="text-[var(--muted)]">
            Poniżej miniatury wszystkich rozwiązań dla aktualnej pozy{" "}
            <M tex="T^*" />. Kliknięcie ładuje konfigurację do głównego
            kontrolera powyżej — efektor pozostaje w tym samym miejscu, a
            ramię robota przybiera drastycznie różne kształty. To daje intuicję,
            o co walczy wybór gałęzi.
          </p>
          <div className="not-prose">
            <SolutionsGrid/>
          </div>
        </StepPanel>

        <section className="prose-ik">
          <h2>Wzorzec liczbowy — pełny rachunek dla jednej pozy</h2>
          <p>
            Powyżej każdy krok zawierał już <em>wzór symboliczny</em>. Tutaj
            wszystkie kroki sklejone w jednym przejściu, dla konkretnej pozy
            celu. Liczby są stałe — można je przepisać na kalkulator/notebook i
            sprawdzić własną implementację linijka po linijce, w izolacji od
            interaktywnego playgroundu wyżej.
          </p>
          <NumericalExample />
        </section>

        <section className="prose-ik">
          <h2>Ściąga formuł</h2>
          <p>
            Wszystkie kluczowe wzory algorytmu IK Pumy 560 zebrane w jednym
            miejscu — przydatne jako kompaktowa referencja przy implementacji
            albo powtórce przed egzaminem.
          </p>
          <CheatSheet />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Ten sam solver, dwa języki</h2>
          <p className="text-[var(--muted)]">
            Cały walkthrough jest realizowany w TypeScript (natywnie w przeglądarce).
            Poniżej ten sam algorytm, linijka po linijce przeniesiony do
            Pythona, uruchamiamy przez <strong>Pyodide</strong> w osobnym web
            workerze. Oba środowiska startują z identycznej pozy docelowej i
            powinny zwrócić identyczny zbiór rozwiązań, z różnicą nie większą
            niż precyzja arytmetyki zmiennoprzecinkowej (~10⁻¹⁵). Pyodide jest
            ładowany leniwie — pierwsze uruchomienie zajmie kilka sekund
            (pobranie ~10 MB runtime).
          </p>
          <DualRuntimeComparison />
        </section>

        <section className="prose-ik">
          <h2>Co dalej</h2>
          <p>
            W module 2 bierzemy tę samą matematykę i przenosimy ją w tryb
            interaktywnego eksperymentu: wszystkie 8 rozwiązań jednocześnie na
            jednej scenie, sterowanie gałęziami checkboxami, animacja trajektorii
            pokazująca, jak gałęzie „znikają" przy przekraczaniu granic
            osiągalności. Moduły 3 i 4 pokazują alternatywne strategie
            rozwiązania — numeryczne (Jakobian, optymalizacja) — które są
            wolniejsze i mniej dokładne, ale za to <em>uniwersalne</em>: nie
            wymagają ręcznego wyprowadzania wzorów dla każdej rodziny robotów
            i działają dla dowolnej geometrii (także tych, dla których
            zamknięta forma byłaby trudna do wyprowadzenia).
          </p>
        </section>
      </div>
    </>
  );
}

function ParamPanel({
  color, symbol, name, children,
}: { color: string; symbol: string; name: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono font-bold text-base" style={{ color }}>{symbol}</span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{name}</span>
      </div>
      <p className="text-[11px] leading-snug text-[var(--foreground)]">{children}</p>
    </div>
  );
}
