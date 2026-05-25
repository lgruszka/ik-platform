import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { TargetPoseInput } from "@/components/walkthrough/target-pose-input";
import { Puma560Playground } from "@/components/robot/puma560-playground";
import { OptimizationComparison } from "@/components/optimization/optimization-comparison";
import { Optimization1DDiagram } from "@/components/optimization/optimization-1d-diagram";
import { CommonsImage } from "@/components/walkthrough/commons-image";
import { NelderMeadVisualization } from "@/components/optimization/nelder-mead-visualization";
import { GradientDescentVisualization } from "@/components/optimization/gradient-descent-visualization";
import { SQPVisualization } from "@/components/optimization/sqp-visualization";

export default function Module4() {
  return (
    <>
      <ModuleHeader slug="4-optimization" />
      <div className="px-8 py-8 max-w-5xl space-y-10">

        <section className="prose-ik">
          <h2>Czym właściwie jest optymalizacja?</h2>
          <p>
            Wyobraź sobie, że jesteś w górach. Stoisz w nieznanym miejscu i
            chcesz zejść jak najniżej — do dna doliny. Nie masz mapy, ale
            masz dwie informacje: <em>na jakiej wysokości teraz jesteś</em>{" "}
            (możesz zmierzyć) i <em>w którą stronę teren opada</em> (możesz
            zobaczyć stopami). Co robisz? Idziesz w stronę spadku, krok po
            kroku, każdy krok kontrolując, czy jest niżej. Jeśli przypadkiem
            wszedłeś pod górę — cofasz się. To jest istota{" "}
            <strong>optymalizacji numerycznej</strong>.
          </p>
          <p>
            Formalnie: mamy funkcję <M tex="f(x)" />, która każdej wartości{" "}
            <M tex="x" /> przypisuje liczbę („wysokość", „koszt", „błąd").
            Szukamy <M tex="x^*" />, dla którego ta liczba jest{" "}
            <strong>najmniejsza</strong>. Tę wartość <M tex="x^*" /> nazywamy
            <em> argumentem minimum</em>:
          </p>
          <MathBlock tex="x^* = \arg\min_x f(x)" />
          <p>
            W jednym wymiarze wygląda to tak (zaczynamy z <M tex="x_0" /> i
            schodzimy w dół):
          </p>
          <Optimization1DDiagram />
          <p>
            W więcej niż jednym wymiarze (np. 2D) wizualizujemy zwykle{" "}
            <strong>linie konturowe</strong> funkcji — punkty o tej samej
            wartości. Algorytm zaczyna w punkcie startowym i przeskakuje
            zboczem ku centrum (minimum), prostopadle do konturów:
          </p>
          <CommonsImage
            src="/images/optimization/gradient-descent.svg"
            alt="Gradient descent w 2D z liniami konturowymi"
            caption="Klasyczna ilustracja gradient descent w 2D. Linie konturowe pokazują wartości funkcji kosztu, ścieżka iteracji prowadzi prostopadle do konturów ku minimum globalnemu."
            author="Zerodamage / Oleg Alexandrov"
            license="Public Domain"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Gradient_descent.svg"
            height={320}
          />
          <p>
            Dla funkcji jednej zmiennej możemy często znaleźć minimum
            analitycznie — przyrównujemy pochodną do zera (<M tex="f'(x) = 0" />)
            i rozwiązujemy równanie. Ale w praktyce funkcja jest skomplikowana
            albo wielowymiarowa, więc używamy iteracji numerycznej. W każdym
            kroku robimy mały ruch w stronę spadku:
          </p>
          <MathBlock tex="x_{k+1} = x_k - \alpha\,f'(x_k)" />
          <p>
            <M tex="\alpha" /> to <em>długość kroku</em> (rozmiar pojedynczej
            iteracji). Za małe — wolna zbieżność. Za duże — ryzyko przeskoczenia
            minimum i oscylacji. Strategie wyboru <M tex="\alpha" /> to bogata
            część teorii optymalizacji (np. <em>Armijo line search</em>, którą
            zobaczysz niżej).
          </p>

          <h2>A co to ma wspólnego z IK?</h2>
          <p>
            W IK chcemy znaleźć kąty przegubów <M tex="q" />, dla których
            końcówka robota trafia w zadaną pozę <M tex="T^*" />. Możemy to
            sformułować jako optymalizację: zdefiniujmy <em>funkcję kosztu</em>{" "}
            <M tex="J(q)" /> mierzącą, <strong>jak bardzo robot się myli</strong>:
          </p>
          <MathBlock tex="J(q) = \|\mathbf{p}(q) - \mathbf{p}^*\|^2 + \|R(q) - R^*\|^2_F" />
          <p>
            (pierwsza składowa to kwadrat odległości pomiędzy aktualną a
            zadaną pozycją końcówki, druga — analogicznie dla orientacji).
            Wartość <M tex="J(q) = 0" /> oznacza <em>idealne</em> trafienie w
            pozę. Każda inna konfiguracja daje <M tex="J(q) > 0" />. Zatem:
          </p>
          <MathBlock tex="q^* = \arg\min_q J(q) \quad\Longleftrightarrow\quad \text{IK}" />
          <p>
            <strong>Rozwiązanie IK to znalezienie minimum funkcji kosztu</strong>.
            Tylko że teraz <M tex="x" /> stało się 6-wymiarowym wektorem{" "}
            <M tex="q = (q_1, \dots, q_6)" />, a krajobraz „gór" stał się
            6-wymiarowy. Reszta logiki jest taka sama jak w 1D — schodzimy w
            dół iteracyjnie.
          </p>

          <h2>Dlaczego osobny moduł, skoro moduł 3 też tym jest?</h2>
          <p>
            Solvery Jakobianowe z modułu 3 też minimalizują funkcję
            kosztu — tylko bardzo specyficznym sposobem (linearyzacja przez
            Jakobian). Tu rozszerzamy spojrzenie:
          </p>
          <ul>
            <li>
              <strong>Funkcja kosztu może być bogatsza.</strong> Nie tylko
              błąd pozy — możemy dodać kary za przekroczenie limitów
              przegubów, kary za bliskość singularności, kary za kolizje, kary
              za odległość od „neutralnej" pozycji robota. Każdy taki cel to
              dodatkowy człon w <M tex="J(q)" />.
            </li>
            <li>
              <strong>Algorytmy są bardziej elastyczne.</strong> Nelder-Mead nie
              wymaga gradientu — działa nawet na funkcjach nieróżniczkowalnych
              (np. binarne „w kolizji?"). SQP narzuca twarde ograniczenia (nie
              jako kary, lecz jako ścisłe warunki). Algorytmy ewolucyjne
              eksplorują globalnie, nie lokalnie.
            </li>
            <li>
              <strong>Mniej wrażliwe na singularności.</strong> Solvery
              optymalizacyjne nie odwracają Jakobianu jawnie, więc problemy
              z uwarunkowaniem nie eskalują tak gwałtownie.
            </li>
          </ul>
          <p>
            Cena: zazwyczaj wolniejsze niż DLS dla pojedynczego zapytania IK
            (dziesiątki–setki ms vs ~ms). Ale dla problemów z bogatymi
            ograniczeniami lub redundancją robota są bezkonkurencyjne.
          </p>
        </section>

        <section className="prose-ik">
          <h2>IK jako problem optymalizacji — formalnie</h2>
          <p>
            Po tym wstępie możemy zapisać IK ścisle:
          </p>
          <MathBlock tex="q^* = \arg\min_{q \in Q} \; J(q) \quad\text{s.t.}\quad q_i^\text{min} \le q_i \le q_i^\text{max},\; g_k(q) \le 0" />
          <p>
            <M tex="J(q)" /> — funkcja kosztu (podobna do tej z modułu 3, ale
            może być bogatsza). <em>s.t.</em> (<em>subject to</em>) wprowadza
            ograniczenia: <strong>twarde</strong> dla limitów przegubów oraz
            ograniczenia ogólne <M tex="g_k(q) \le 0" /> (np. kolizje).
          </p>
          <p>W tym module standardowa funkcja kosztu wygląda tak:</p>
          <MathBlock tex="J(q) = w_p\,\|\mathbf{p}(q) - \mathbf{p}^*\|^2 + w_o\,\|\boldsymbol{\omega}(q, R^*)\|^2 + w_\ell \sum_i \max(0,\; q_i - q_i^\text{max})^2 + \max(0,\; q_i^\text{min} - q_i)^2" />
          <p>Trzy człony, każdy mierzący inną „karę":</p>
          <ul>
            <li><M tex="w_p\,\|\mathbf{p}(q) - \mathbf{p}^*\|^2" /> — kara za błąd pozycji końcówki (wagi <M tex="w_p" />)</li>
            <li><M tex="w_o\,\|\boldsymbol{\omega}\|^2" /> — kara za błąd orientacji (waga <M tex="w_o" />)</li>
            <li><M tex="w_\ell \sum_i \max(\dots)^2" /> — kara „miękka" za przekroczenie limitów (zero gdy w zakresie)</li>
          </ul>
          <p>
            <strong>Zalety tego sformułowania:</strong>
          </p>
          <ul>
            <li>
              <strong>Miękko</strong> narzucamy ograniczenia przegubowe (jako
              kara kwadratowa) — w odróżnieniu od twardego odcięcia, które
              potrafi „zablokować" solver na granicy.
            </li>
            <li>
              Dodawać drugorzędne cele: odległość od singularności
              (regularyzacja <M tex="-\gamma\,\log\det(JJ^\top)" />), bliskość
              neutralnej pozycji, unikanie kolizji (pole odstraszające).
            </li>
            <li>
              Łączyć <em>priorytety</em>: <M tex="w_p \gg w_o" /> oznacza „za
              wszelką cenę osiągnij pozycję, orientacja — jeśli się uda". To
              zasadniczo inna filozofia niż analityczna IK, która traktuje
              pozycję i orientację równoprawnie.
            </li>
          </ul>
        </section>

        <StepPanel number={1} title="Nelder–Mead — szukamy minimum bez gradientu">
          <p>
            <strong>Pomysł intuicyjny:</strong> wyobraź sobie, że nie znasz
            gradientu — nie wiesz, w którą stronę idzie spadek. Możesz tylko{" "}
            <em>zmierzyć wysokość</em> w kilku punktach. Co robisz?
          </p>
          <p>
            Postaw na terenie <strong>trójkąt</strong> (a w przestrzeni{" "}
            <M tex="n" />-wymiarowej — figurę z <M tex="n+1" /> wierzchołków,
            zwaną <em>simpleksem</em>). Zmierz wysokość każdego rogu. Najgorszy
            róg (najwyżej położony) — odbij przez środek pozostałych. Jeśli
            nowy róg jest niższy niż wszystkie poprzednie — świetnie, idź
            dalej w tym kierunku. Jeśli nie pomogło — ścisnij trójkąt do
            wewnątrz. Iteruj.
          </p>
          <p>
            To jest klasyczna metoda <strong>Nelder–Mead</strong> (1965). W
            każdej iteracji simpleks przesuwa się i deformuje, „pełzając" w
            kierunku minimum. Cztery podstawowe operacje:
          </p>
          <ol>
            <li>Posortuj wierzchołki po wartości kosztu.</li>
            <li><strong>Reflection:</strong> odbij najgorszy przez centroid pozostałych: <M tex="\mathbf{x}_r = \bar{\mathbf{x}} + \alpha (\bar{\mathbf{x}} - \mathbf{x}_\text{worst})" />.</li>
            <li><strong>Expansion:</strong> jeśli odbity był wyjątkowo dobry, pójdź dalej w tym kierunku.</li>
            <li><strong>Contraction:</strong> jeśli odbity nie pomógł, kontraktuj w stronę centroida.</li>
            <li><strong>Shrink:</strong> jeśli nic nie działa — zwiń cały simpleks ku najlepszemu wierzchołkowi.</li>
          </ol>
          <p>
            <strong>Zalety:</strong> nie wymaga gradientów, więc działa
            nawet jeśli funkcja kosztu jest nie-gładka (np. ma sztywne progi
            kolizyjne, „ścianki" z penalty). Implementacja jest trywialna
            (kilkadziesiąt linii kodu).
          </p>
          <p>
            <strong>Wady:</strong> brak teoretycznych gwarancji zbieżności
            dla funkcji niewypukłych. Dla wymiarów <M tex="n > 10" /> staje
            się powolne (simpleks ma <M tex="n+1" /> punktów do utrzymania).
            Dla naszych 6 wymiarów IK jest jeszcze rozsądny.
          </p>
          <pre><code>{`// pseudo-Nelder-Mead
simplex = [x0, x0+e1·step, x0+e2·step, ..., x0+en·step];
while not converged:
  sort(simplex by f(x))                    // posortuj
  centroid = mean(simplex except worst)    // środek bez najgorszego
  reflected = centroid + α·(centroid - worst)
  if f(reflected) < f(best):  try expansion
  elif f(reflected) < f(second_worst): replace worst
  elif f(reflected) < f(worst): contract
  else: shrink toward best`}</code></pre>

          <h3>Wizualizacja na żywo — Nelder-Mead w 2D</h3>
          <p>
            Funkcja kosztu: <M tex="f(x, y) = 0.5(x-2)^2 + 2(y-1)^2" /> — paraboloida
            asymetryczna, minimum w <M tex="(2, 1)" />. Simpleks startuje w lewym dolnym
            rogu z trzech wierzchołków. Naciśnij <span className="font-mono">▶ odtwórz</span> i obserwuj jak trójkąt
            „pełza" w stronę zielonego minimum, deformując się przy każdej iteracji.
          </p>
          <NelderMeadVisualization />
          <p>
            Najlepszy wierzchołek (zielony) <strong>nigdy się nie pogarsza</strong> — jest
            najmocniejszą gwarancją Nelder-Meada. Czerwony (najgorszy) jest zastępowany w
            każdym kroku. Kolejna ramka pokazuje, którą operację zastosowano:{" "}
            <span className="text-[#3b82f6]">reflection</span> dominuje na początku
            (długie skoki), <span className="text-[#f59e0b]">contraction</span> przy końcu
            (precyzyjne dopasowanie).
          </p>
        </StepPanel>

        <StepPanel number={2} title="Gradient descent — schodzenie po zboczu">
          <p>
            <strong>Pomysł intuicyjny:</strong> jeśli MOŻESZ obliczyć
            gradient (kierunek najszybszego wzrostu), to po prostu idź
            w przeciwną stronę. Każdy krok zmniejsza wysokość — przynajmniej
            jeśli krok nie jest za duży.
          </p>
          <p>
            Klasyczna metoda <strong>Gradient Descent</strong>:
          </p>
          <MathBlock tex="q_{k+1} = q_k - \alpha\,\nabla J(q_k)" />
          <p>
            <M tex="\nabla J(q)" /> to wektor pochodnych cząstkowych — mówi,
            jak bardzo każdy z 6 przegubów zmienia funkcję kosztu (w
            otoczeniu aktualnej konfiguracji). Dla naszej funkcji kosztu:
          </p>
          <MathBlock tex="\nabla J(q) = -2\,J^\top\,\mathbf{W}\,\mathbf{e}(q)" />
          <p>
            gdzie <M tex="J" /> to <em>jakobian</em> (z modułu 3),{" "}
            <M tex="\mathbf{e}(q)" /> to wektor błędu pozy, <M tex="\mathbf{W}" />{" "}
            — diagonalna macierz wag (pozycja vs orientacja).
          </p>
          <p>
            <strong>Problem długości kroku:</strong> stała wartość{" "}
            <M tex="\alpha" /> nie zawsze działa — w stromych dolinach
            wystarczy mały krok, na płaskich równinach trzeba dużych
            skoków. <strong>Warunek Armijo</strong> rozwiązuje to
            adaptacyjnie:
          </p>
          <MathBlock tex="J(q + \alpha\,\mathbf{d}) \le J(q) + c_1\,\alpha\,\nabla J(q)^\top \mathbf{d}" />
          <p>
            Słownie: po zrobieniu kroku nowa wartość kosztu ma być{" "}
            <em>wyraźnie mniejsza</em> niż gdyby gradient był liniowy.
            Jeśli nie jest — zmniejszamy <M tex="\alpha" /> (typowo połowicznie:
            <M tex="\alpha \leftarrow \beta \alpha" />, <M tex="\beta = 0{,}5" />)
            i próbujemy ponownie. Jeśli jest — akceptujemy krok.
          </p>
          <p>
            <strong>Obserwacja teoretyczna:</strong> dla naszego kosztu IK z
            <M tex="w_o = 0" /> (tylko pozycja, brak orientacji) i bez
            limitów, GD z Armijo pokrywa się z <strong>Jacobian Transpose</strong>{" "}
            z modułu 3 — to jest dokładnie ten sam algorytm, opisany z innej
            perspektywy. To jest piękny moment łączący moduły 3 i 4: różne
            tradycje matematyczne, ten sam algorytm.
          </p>
          <p>
            <strong>Ograniczenie:</strong> w dolinach o nierównym
            uwarunkowaniu (długie i wąskie, jak w pobliżu singularności) GD
            zygzakuje i jest powolny. Lepsze metody korzystają z drugiego
            rzędu (Hessianu) — patrz SQP niżej.
          </p>

          <h3>Wizualizacja na żywo — gradient descent w 2D</h3>
          <p>
            Ta sama funkcja kosztu, co poprzednio. Suwakiem regulujesz długość
            kroku <M tex="\alpha" />. Czerwona strzałka pokazuje krok{" "}
            <M tex="-\alpha\nabla f" />, niebieska linia — historię iteracji:
          </p>
          <GradientDescentVisualization />
          <p>
            Eksperymentuj z <M tex="\alpha" />:
          </p>
          <ul>
            <li>
              <strong><M tex="\alpha = 0{,}05" /></strong> — bardzo wolne, ale stabilne. Każdy krok mały, do
              minimum potrzeba dziesiątek iteracji.
            </li>
            <li>
              <strong><M tex="\alpha = 0{,}30" /></strong> — sensowny kompromis. Kilkanaście iteracji wystarczy.
            </li>
            <li>
              <strong><M tex="\alpha = 0{,}50+" /></strong> — krok za duży! Zauważ jak ścieżka <em>zygzakuje</em>{" "}
              między ścianami doliny. Oś y ma steeper gradient (współczynnik 4),
              więc duży krok przeskakuje przez minimum w pionie. Klasyczny przykład
              wrażliwości GD na uwarunkowanie funkcji kosztu.
            </li>
          </ul>
          <p>
            Ten zygzak to powód, dla którego w prawdziwych zastosowaniach używamy
            metod adaptacyjnych (Adam — patrz moduł 5) albo metod drugiego rzędu
            (Newton, BFGS — patrz SQP niżej).
          </p>
        </StepPanel>

        <StepPanel number={3} title="SQP — Sequential Quadratic Programming">
          <p>
            <strong>Pomysł intuicyjny:</strong> GD robi „liniowe" przybliżenie
            funkcji kosztu (gradient = pochodna pierwszego rzędu). Newton
            robi „kwadratowe" (gradient + Hessian = pochodne drugiego rzędu).
            <strong>SQP</strong> idzie krok dalej: w każdej iteracji buduje
            <em>lokalny problem kwadratowy</em> z liniowymi ograniczeniami i
            rozwiązuje go ściśle.
          </p>
          <p>
            Dla każdej iteracji:
          </p>
          <ol>
            <li>Aproksymuj Hessian Lagrangianu (BFGS lub dokładny).</li>
            <li>Rozwiąż lokalny problem kwadratowy (QP) ze zlinearyzowanymi ograniczeniami.</li>
            <li>Wykonaj krok z line search spełniającym warunki KKT (Karusha–Kuhna–Tuckera).</li>
          </ol>
          <p>
            <strong>Zalety:</strong>
          </p>
          <ul>
            <li><strong>Twarde ograniczenia</strong> — limity <M tex="q_i^{\text{min}} \le q_i \le q_i^{\text{max}}" /> są zachowywane ściśle, nie jako kary.</li>
            <li><strong>Wykorzystuje krzywiznę</strong> — szybciej zbiega niż GD na trudnych funkcjach.</li>
            <li><strong>Konwergencja kwadratowa</strong> blisko optimum — liczba dokładnych cyfr podwaja się z iteracją.</li>
          </ul>
          <p>
            <strong>Wady:</strong> kosztowne (rozwiązanie QP per iteracja to{" "}
            <M tex="O(n^3)" />), wymaga biblioteki (np. SciPy{" "}
            <code>minimize(method=&apos;SLSQP&apos;)</code> czy{" "}
            <code>trust-constr</code>).
          </p>
          <p>
            W aplikacji uruchamiamy SQP w przeglądarce przez{" "}
            <strong>Pyodide</strong> (SciPy skompilowany do WebAssembly —
            patrz moduł 1, sekcja „Ten sam solver, dwa języki"). W tym
            module używamy lekkich solverów TS (Nelder-Mead, GD) bez SQP —
            SQP wymagałby integracji z Pyodide, która jest poza zakresem
            tego modułu, ale dostępna w przyszłych rozszerzeniach.
          </p>

          <h3>Wizualizacja na żywo — projected gradient z aktywnym ograniczeniem</h3>
          <p>
            Ta sama funkcja kosztu, ale teraz dodajemy <strong>twarde
            ograniczenie</strong>: <M tex="g(x, y) = y + 0{,}5x - 1{,}5 \le 0" /> —
            obszar nad czerwoną prostą jest <em>zakazany</em>. Minimum bez
            ograniczenia (<M tex="2, 1" />) leży powyżej linii — czyli w obszarze
            niedopuszczalnym. Algorytm musi znaleźć minimum <em>na granicy</em>:
          </p>
          <SQPVisualization />
          <p>
            <strong>Co dokładnie pokazuje wizualizacja</strong> (uproszczona wersja
            SQP — projected gradient):
          </p>
          <ul>
            <li>
              <strong>Czerwona prosta</strong> — granica ograniczenia <M tex="g(x,y) = 0" />.
              Czerwony pasek nad nią — obszar niedopuszczalny.
            </li>
            <li>
              <strong>Zwykły GD</strong> (czerwona strzałka) chciałby iść prosto na
              <M tex="(2, 1)" />, ale wszedłby w obszar zakazany.
            </li>
            <li>
              <strong>Po napotkaniu granicy</strong> krok zostaje zrzutowany na
              styczną do ograniczenia (<span className="text-[#a855f7]">fioletowa
              strzałka</span>) — usuwamy składową gradientu prostopadłą do granicy.
              Algorytm „ślizga się" wzdłuż linii.
            </li>
            <li>
              <strong>Pełny SQP</strong> robi dokładnie to samo, ale używa Hessianu
              zamiast samego gradientu (krok kwadratowy). Trajektoria byłaby krótsza,
              ale charakter „ślizgania się po granicy" identyczny.
            </li>
          </ul>
          <p>
            Minimum z ograniczeniem leży w <M tex="(1{,}5,\ 0{,}75)" /> —{" "}
            <em>nie</em> w <M tex="(2, 1)" />! To pokazuje, że ograniczenia
            zmieniają nie tylko trajektorię, ale i samo rozwiązanie. W IK robota
            twarde limity przegubowe potrafią <strong>kompletnie zmienić</strong>{" "}
            wybraną gałąź rozwiązania.
          </p>
        </StepPanel>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Porównanie na żywo</h2>
          <p className="text-[var(--muted)]">
            Trzy solvery startują z aktualnej konfiguracji głównego kontrolera
            i zmierzają do tej samej pozy <M tex="T^*" />. Obserwuj wykresy
            zbieżności (pionowa = funkcja kosztu w skali log) i porównaj
            liczbę iteracji oraz czas. Możesz manipulować wagami funkcji
            kosztu — zobacz, jak zmienia to dynamikę.
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <Puma560Playground height={360} />
            <TargetPoseInput />
          </div>
          <OptimizationComparison />
        </section>

        <section className="prose-ik">
          <h2>Kiedy używać optymalizacji zamiast Jakobiana?</h2>
          <ul>
            <li>
              <strong>Twarde ograniczenia przegubowe / kolizyjne</strong> —
              SQP, trust-region lub metoda kar skutecznie je obsługują; czysty
              DLS ignoruje.
            </li>
            <li>
              <strong>Drugorzędne cele</strong> — odległość od singularności,
              bliskość neutralnej konfiguracji, minimalizacja zużycia energii;
              wchodzą do kosztu jako dodatkowe człony.
            </li>
            <li>
              <strong>Manipulatory redundantne</strong> (<M tex="n > 6" />) —
              niezerową przestrzeń zerową jakobianu (null-space) można
              zagospodarować dodatkowym kryterium.
            </li>
            <li>
              <strong>Nieróżniczkowalne cele</strong> — np. binarne „czy w
              kolizji z tym obiektem". Nelder-Mead, CMA-ES, PSO, Symulowane
              Wyżarzanie.
            </li>
            <li>
              <strong>Globalna wyszukiwarka rozwiązań</strong> — algorytmy
              ewolucyjne z restartami potrafią znajdować alternatywne gałęzie
              niedostępne dla metod lokalnych.
            </li>
          </ul>

          <h2>Wybrane strategie zaawansowane (sygnalnie)</h2>
          <ul>
            <li><strong>CMA-ES</strong> — Covariance Matrix Adaptation Evolution Strategy (Hansen & Ostermeier). Stochastyczna, skuteczna dla <M tex="n \le 100" />.</li>
            <li><strong>Trust-region</strong> — zamiast linii poszukiwania, adaptacyjny region zaufania dla kroku Newtona. SciPy <code>trust-krylov</code>, <code>trust-ncg</code>.</li>
            <li><strong>Interior-point</strong> — dla twardych ograniczeń nierównościowych; stosowane w optymalizacji trajektorii.</li>
            <li><strong>ADMM / rozwiązania rozdzielone</strong> — gdy koszt ma strukturę separowalną (pozycja + orientacja + limity).</li>
          </ul>

          <h2>Co dalej</h2>
          <p>
            W module 5 porzucamy klasyczny cyfrowy przepis i patrzymy, co stanie
            się, gdy IK chcemy <em>wyuczyć</em> na danych — od naiwnego MLP
            (który słabo radzi sobie z wielomodalnością 8 rozwiązań) po
            nowoczesne Invertible Neural Networks, samplujące pełny{" "}
            <em>posterior</em>. W module 6 wracamy do benchmarku, który zmierzy
            wszystkie solvery z modułów 1–5 na tym samym zbiorze testowych poz.
          </p>
        </section>
      </div>
    </>
  );
}
