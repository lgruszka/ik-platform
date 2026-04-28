import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { TargetPoseInput } from "@/components/walkthrough/target-pose-input";
import { Puma560Playground } from "@/components/robot/puma560-playground";
import { MLPDemo } from "@/components/neural/mlp-demo";
import { NeuralNetworkBasicsDiagram } from "@/components/neural/neural-network-basics";
import { MultimodalFailureDiagram } from "@/components/neural/multimodal-failure-diagram";
import { CommonsImage } from "@/components/walkthrough/commons-image";
import { NeuralNetworkAnimation } from "@/components/neural/network-animation";
import { MDNSuccessDiagram } from "@/components/neural/mdn-success-diagram";
import { NormalizingFlowDiagram } from "@/components/neural/normalizing-flow-diagram";
import { DiffusionAnimation } from "@/components/neural/diffusion-animation";
import { IKFlow2RDemo } from "@/components/neural/ikflow-2r-demo";
import { Diffusion2RDemo } from "@/components/neural/diffusion-2r-demo";

export default function Module5() {
  return (
    <>
      <ModuleHeader slug="5-neural" />
      <div className="px-8 py-8 max-w-5xl space-y-10">

        <section className="prose-ik">
          <h2>Trochę inaczej niż dotychczas</h2>
          <p>
            Do tej pory rozwiązywaliśmy IK przez{" "}
            <strong>jawne wzory matematyczne</strong> — albo zamknięte (moduł 1),
            albo iteracyjne (moduły 3 i 4). Teraz spróbujemy czegoś
            zupełnie innego: <strong>nauczyć</strong> komputer rozwiązywać IK
            przez pokazywanie mu tysięcy poprawnych przykładów. Zamiast
            programować algorytm, dostarczamy dane — a komputer sam odkrywa
            prawidłowości.
          </p>
          <p>
            Wyobraź sobie, że uczysz dziecko rozpoznawać psy i koty. Nie
            tłumaczysz definicji („pies ma długi pysk i…") — pokazujesz
            tysiąc zdjęć z podpisami „pies" i „kot". Po jakimś czasie dziecko
            samo zaczyna rozpoznawać. <strong>Dokładnie</strong> tak działają sieci
            neuronowe: są to programy, które uczą się funkcji „wejście →
            wyjście" przez przykłady. Dla nas „wejście" = poza T, a „wyjście"
            = kąty q.
          </p>
        </section>

        <section className="prose-ik">
          <h2>Co siedzi w środku sieci? — animacja krok po kroku</h2>
          <p>
            Zanim przejdziemy do skomplikowanych architektur, zobaczmy, jak
            działa <strong>najprostsza</strong> sieć neuronowa — wielowarstwowy
            perceptron (MLP). Animacja niżej przeprowadzi Cię przez jeden
            <em> forward pass</em> — czyli jedno przejście danych od wejścia do
            wyjścia. Naciśnij <span className="font-mono">▶ odtwórz</span>{" "}
            albo klikaj <span className="font-mono">dalej →</span>:
          </p>
          <NeuralNetworkAnimation />
          <p>
            Zauważ — w środku sieci nie ma żadnej magii. Każdy <strong>neuron</strong>{" "}
            to po prostu kalkulator, który robi trzy rzeczy:
          </p>
          <ol>
            <li>Bierze wartości z poprzedniej warstwy.</li>
            <li>Mnoży każdą przez przypisaną <strong>wagę</strong> i sumuje.</li>
            <li>Wynik puszcza przez prostą funkcję nieliniową (np. <code>tanh</code>).</li>
          </ol>
          <p>
            Cała tajemnica sieci jest w tym, <strong>jakie dokładnie wagi</strong>{" "}
            siedzą przy strzałkach. Tych wag może być setki tysięcy. Nikt ich
            nie wpisuje ręcznie — uczą się same na danych treningowych. To
            jest właśnie <strong>uczenie</strong> (training).
          </p>
        </section>

        <section className="prose-ik">
          <h2>Schemat sieci — dwa widoki</h2>
          <p>
            Po lewej — wersja specjalna dla naszego zadania (poza T → kąty q).
            Niżej — kanoniczny schemat z literatury. Obie pokazują to samo:
            warstwy neuronów połączone wagami.
          </p>
          <NeuralNetworkBasicsDiagram />
          <CommonsImage
            src="/images/neural/multilayer-perceptron.svg"
            alt="Klasyczny schemat MLP"
            caption="Klasyczny diagram MLP — warstwa wejściowa, warstwy ukryte, warstwa wyjściowa. Każda strzałka to jeden parametr (waga)."
            author="Sky99"
            license="CC BY-SA 3.0"
            sourceUrl="https://commons.wikimedia.org/wiki/File:MultiLayerPerceptron.svg"
            licenseUrl="https://creativecommons.org/licenses/by-sa/3.0/"
            height={260}
          />
        </section>

        <section className="prose-ik">
          <h2>Trening — jak komputer uczy się wag?</h2>
          <p>
            Trening sieci neuronowej to dokładnie <strong>ten sam problem
            optymalizacyjny</strong> co w module 4 — tylko że tu zmiennymi są
            <em> wagi</em>, a kosztem jest <strong>średni błąd predykcji na
            danych treningowych</strong>:
          </p>
          <MathBlock tex="\theta^* = \arg\min_\theta \; \frac{1}{N} \sum_{i=1}^{N} \big\|f_\theta(x_i) - y_i\big\|^2" />
          <p>
            Procedura w pseudokodzie:
          </p>
          <ol>
            <li>Inicjuj wagi <strong>losowo</strong> (małe wartości z gaussowskiego rozkładu).</li>
            <li>Bierz przykład <M tex="(x_i, y_i)" /> z datasetu.</li>
            <li>Forward pass: oblicz <M tex="\hat{y} = f_\theta(x_i)" />.</li>
            <li>Sprawdź błąd: <M tex="\|\hat{y} - y_i\|^2" />.</li>
            <li><strong>Backpropagation</strong> — algorytm wyliczający, jak każdą wagę przesunąć, żeby błąd zmalał (to jest tylko gradient z modułu 4, sprytnie zorganizowany).</li>
            <li>Przesuń wagi w tym kierunku (<em>SGD</em> albo <em>Adam</em>).</li>
            <li>Wróć do 2. Powtarzaj miliony razy.</li>
          </ol>
          <p>
            Po skończonym treningu sieć — przy odrobinie szczęścia — daje
            sensowne predykcje także dla <strong>nowych</strong> danych, których
            nie widziała. To zjawisko nazywa się <em>generalizacją</em>. Jeśli
            sieć nauczyła się tylko zapamiętać dane treningowe i nie umie
            odpowiadać na nowe — mówimy o <em>przetrenowaniu</em> (overfitting).
          </p>

          <h3>SGD i Adam — co to za algorytmy?</h3>
          <p>
            W kroku 6 procedury napisałem „przesuń wagi w tym kierunku (SGD
            albo Adam)". Co to dokładnie?
          </p>
          <p>
            <strong>SGD</strong> — <em>Stochastic Gradient Descent</em>,
            stochastyczny gradient descent. To po prostu zwykły gradient
            descent z modułu 4, ale z jedną sprytną modyfikacją: zamiast
            liczyć gradient na <strong>całym</strong> datasecie (co dla
            milionów przykładów zajmuje wieczność), liczymy go na{" "}
            <strong>jednym</strong> losowo wybranym przykładzie albo małym{" "}
            <em>mini-batchu</em> (zazwyczaj 32, 64 lub 128 przykładów):
          </p>
          <MathBlock tex="\theta_{k+1} = \theta_k - \alpha\,\nabla L_i(\theta_k), \quad i \sim \text{Uniform}(1, N)" />
          <p>
            Gradient z jednego przykładu jest <em>niedokładnym</em>{" "}
            oszacowaniem prawdziwego gradientu (stąd „stochastic" — losowy),
            ale jest milion razy szybszy do policzenia. W praktyce:
            zaszumiona ścieżka mimo wszystko prowadzi do dobrego rozwiązania,
            a często nawet pomaga uciec z płytkich lokalnych minimów. „Wagi
            chodzą małymi krokami w mniej-więcej dobrym kierunku".
          </p>
          <p>
            <strong>Adam</strong> — <em>Adaptive Moment Estimation</em>{" "}
            (Kingma &amp; Ba, 2014). Ulepszony SGD, który{" "}
            <strong>adaptuje krok osobno dla każdej wagi</strong>. Pomysł:
          </p>
          <ol>
            <li>Dla każdej wagi pamiętamy <em>średnią ruchomą gradientów</em> (kierunek dotychczasowych aktualizacji — momentum).</li>
            <li>Pamiętamy też <em>średnią ruchomą kwadratów gradientów</em> (jak duże były ostatnie aktualizacje).</li>
            <li>Krok dla danej wagi: kierunek z (1) podzielony przez pierwiastek z (2). Wagi, które otrzymują często duże gradienty, dostają mniejszy krok; te które rzadko się aktualizują — większy.</li>
          </ol>
          <MathBlock tex="m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t, \quad v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2" />
          <MathBlock tex="\theta_{t+1} = \theta_t - \alpha \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \varepsilon}" />
          <p>
            (z dodatkową korektą obciążenia <M tex="\hat{m}_t = m_t/(1-\beta_1^t)" />,{" "}
            <M tex="\hat{v}_t = v_t/(1-\beta_2^t)" />). Domyślne
            hiperparametry: <M tex="\beta_1 = 0{,}9" />,{" "}
            <M tex="\beta_2 = 0{,}999" />, <M tex="\alpha = 10^{-3}" />.
          </p>
          <p>
            <strong>Dlaczego Adam wyparł czysty SGD w deep learningu?</strong>
          </p>
          <ul>
            <li><strong>Mniej strojenia kroku</strong> — domyślne <M tex="\alpha = 10^{-3}" /> zwykle działa od razu, bez szukania.</li>
            <li><strong>Stabilniejszy</strong> — adaptacja kroku dla każdej wagi tłumi oscylacje.</li>
            <li><strong>Szybciej zbiega</strong> — szczególnie na początku treningu (momentum przyspiesza ruch w stałym kierunku).</li>
            <li><strong>Działa „od razu"</strong> dla różnych architektur (CNN, transformerów, MLP itd.).</li>
          </ul>
          <p>
            <strong>Kiedy SGD bywa lepszy?</strong> Dla bardzo dużych modeli i
            długich treningów <em>SGD z momentum</em> daje czasem lepszą
            generalizację (model „bardziej wygładzony", mniej overfitujący).
            Stąd np. ResNet'y w ImageNecie często trenuje się SGD-em, a
            transformerów (BERT, GPT) — Adamem (a właściwie Adam-W,
            wariantem z popraw lepszą regularyzacją).
          </p>
          <p>
            W naszej aplikacji (sekcja „Laboratorium" niżej) używamy{" "}
            <strong>Adama</strong> — dzięki temu trening MLP w przeglądarce
            jest stabilny i kończy się w kilkunastu sekundach bez ręcznego
            strojenia <M tex="\alpha" />.
          </p>
        </section>

        <StepPanel number={1} title="Naiwny MLP — najprostsza próba (i dlaczego nie wystarcza)">
          <p>
            <strong>Pomysł:</strong> wytrenuj MLP, który dla danej pozy{" "}
            <M tex="T" /> (6 liczb: pozycja + RPY) zwraca 6 kątów <M tex="q" />.
            Trenujesz na milionach par <M tex="(T, q)" /> wygenerowanych
            losowo przez FK.
          </p>
          <p>
            Brzmi sensownie — ale jest jeden zasadniczy problem.
          </p>

          <h3>Problem: jedna poza, kilka prawidłowych odpowiedzi</h3>
          <p>
            Pamiętasz z modułu 2, że dla Pumy ta sama poza może być
            osiągnięta na <strong>do 8 sposobów</strong> (shoulder L/R, elbow
            U/D, wrist flip)? W datasecie treningowym ta sama poza pojawia
            się więc kilka razy z <em>różnymi</em> kątami. A funkcja kosztu
            MSE każe sieci „minimalizuj średni kwadrat błędu" — więc sieć
            uczy się <strong>średniej</strong> wszystkich poprawnych odpowiedzi.
          </p>
          <p>
            Tylko że średnia ośmiu różnych prawidłowych konfiguracji{" "}
            <strong>nie jest</strong> żadną prawidłową konfiguracją. To jak
            byś zapytał ośmiu osób o najkrótszą drogę do biura — jedna mówi
            „przez most", druga „przez tunel" — ich „średnia" („zjedź do rzeki
            i zatrzymaj się w połowie") to nonsens.
          </p>
          <MultimodalFailureDiagram />
          <p>
            Czerwona kropka to predykcja MLP — <em>średnia</em> dwóch
            niebieskich „dzwonków" prawdziwych odpowiedzi. Średnia trafia
            dokładnie tam, gdzie <strong>żadna</strong> z odpowiedzi nie była.
            To nie jest błąd implementacji ani za małej sieci — to{" "}
            <strong>fundamentalna pułapka</strong> uśredniania.
          </p>

          <h3>Praktyczny ratunek: hybryda NN → DLS</h3>
          <p>
            Mimo wad, naiwny MLP ma jedną zaletę — daje dobry punkt startowy
            (warm start). Pomysł hybrydy:
          </p>
          <MathBlock tex="q_{\text{seed}} = f_\theta(T) \;\;\xrightarrow{\;\text{kilka iteracji DLS}\;}\;\; q^* \text{ (dokładne)}" />
          <p>
            Sieć daje przybliżenie (błąd ~5 cm), DLS dopina do precyzji
            maszynowej w 2–3 iteracjach. <strong>Sieć daje szybkość, klasyczny
            solver — dokładność.</strong> Tak właśnie wygląda większość
            produkcyjnych systemów IK z neural-warmem.
          </p>
          <p>
            Niżej — <em>laboratorium</em>. Trenujemy MLP od zera (bez
            zewnętrznych bibliotek ML, ~200 linii TypeScriptu) i porównujemy
            surową predykcję z hybrydą NN → DLS.
          </p>
        </StepPanel>

        <StepPanel number={2} title="MDN — uczymy sieć, że poprawnych odpowiedzi może być wiele">
          <p>
            <strong>Pomysł w jednym zdaniu:</strong> zamiast jednej liczby
            niech sieć zwraca <em>listę możliwych odpowiedzi z prawdopodobieństwami</em>.
          </p>
          <p>
            <strong>Analogia:</strong> wyobraź sobie prognozę pogody. Możliwe
            podejścia:
          </p>
          <ul>
            <li><strong>Prognoza punktowa (jak naiwny MLP):</strong> „jutro będzie 10°C". Jeśli model się myli — masz pecha.</li>
            <li><strong>Prognoza probabilistyczna (jak MDN):</strong> „jutro: 70% szans 8°C ± 2°, 30% szans 15°C ± 2°" (dwa możliwe scenariusze). Może się okazać bardzo użyteczne — wiesz na co się przygotować.</li>
          </ul>
          <p>
            <strong>Mixture Density Network</strong> (Bishop, 1994) to
            właśnie sieć, która zwraca prognozę probabilistyczną. Konkretnie
            — parametry kilku „dzwonków" (gaussianów):
          </p>
          <ul>
            <li><strong>Wagi</strong> <M tex="\alpha_k(T)" /> — jak prawdopodobny jest k-ty „garb"</li>
            <li><strong>Środki</strong> <M tex="\mu_k(T)" /> — gdzie ten garb leży</li>
            <li><strong>Szerokości</strong> <M tex="\Sigma_k(T)" /> — jak szeroki jest garb</li>
          </ul>
          <p>
            Suma wszystkich garbów daje rozkład prawdopodobieństwa{" "}
            <M tex="p(q\,|\,T)" /> — sieć mówi nie „<em>q to 1.5</em>", ale
            „<em>q to z 50% szansy 1.5, z 50% szansy −1.5</em>":
          </p>
          <MDNSuccessDiagram />
          <p>
            Po wytrenowaniu sieć z <strong>K = 8 komponentami</strong> dla Pumy
            naturalnie odkrywa 8 gałęzi rozwiązania — bo to jest matematycznie
            optymalna liczba „garbów" dla tych danych.
          </p>
          <p>
            <strong>Jak tego używać:</strong>
          </p>
          <ul>
            <li><strong>Najlepsze rozwiązanie</strong> — wybierz garb z największą wagą (<M tex="\alpha" />), weź jego środek (<M tex="\mu" />).</li>
            <li><strong>Próbkowanie</strong> — losuj garb z prawdopodobieństwem proporcjonalnym do <M tex="\alpha" />, potem losuj punkt z gaussa wokół <M tex="\mu" />. Daje różnorodne, ale poprawne odpowiedzi.</li>
            <li><strong>Ocena</strong> — dla danej kandydackiej wartości <M tex="q" /> sieć zwraca jej prawdopodobieństwo. Można porównywać hipotezy.</li>
          </ul>
          <p>
            <strong>Wady MDN:</strong> trening jest niestabilny (małe potknięcia
            inicjalizacji powodują, że wszystkie garby zlewają się w jeden);
            wybór K (ile garbów?) wymaga eksperymentów.
          </p>
        </StepPanel>

        <StepPanel number={3} title="Normalizing Flows / IKFlow — sieć która umie losować">
          <p>
            <strong>Pomysł w jednym zdaniu:</strong> nauczmy sieć przekształcać
            losowy szum w poprawne odpowiedzi.
          </p>
          <p>
            <strong>Analogia:</strong> kreatywny artysta dostaje plamy
            atramentu z butelki (czyli losowy szum), patrzy na nie i
            <em> rysuje</em> z nich konkretne obrazy. Każdy losowy układ
            plam → inny prawidłowy obraz. Im lepszy artysta, tym ciekawsze i
            bardziej różnorodne wyniki.
          </p>
          <p>
            <strong>IKFlow</strong> (Ames et al., 2022) jest takim artystą —
            siecią neuronową, która zamienia szum w poprawne kąty robota:
          </p>
          <NormalizingFlowDiagram />
          <p>
            Po lewej — chmurka punktów z prostego <strong>gaussowskiego szumu</strong>{" "}
            (każdy punkt to losowy 6-wymiarowy wektor z rozkładu normalnego).
            Po prawej — te same punkty po przejściu przez sieć IKFlow:
            wszystkie spadły do jednego z <strong>wyraźnych klastrów</strong>,
            każdy klaster odpowiada jednej gałęzi rozwiązania IK (shoulder R
            i shoulder L). Sieć „wie", którą gałąź ma trafić każdy konkretny
            punkt szumu — bo jest <em>warunkowa na pozie</em>{" "}
            <M tex="T" />.
          </p>
          <p>
            <strong>Praktyczne użycie:</strong>
          </p>
          <ol>
            <li>Wylosuj <M tex="z \sim \mathcal{N}(0, I)" /> — zwykły gaussowski wektor 6-wymiarowy.</li>
            <li>Podaj parę (<M tex="z" />, <M tex="T" />) do sieci.</li>
            <li>Sieć zwraca <M tex="q = g_\theta^{-1}(z; T)" /> — jedną z gałęzi rozwiązania.</li>
            <li>Powtórz z innym <M tex="z" /> — dostaniesz <strong>inną</strong> gałąź.</li>
          </ol>
          <p>
            Siła tego podejścia: jedna sieć, dowolnie wiele różnych poprawnych
            rozwiązań. Wyniki publikowane (KUKA, Baxter, Atlas):
            próbkowanie w pojedynczych ms, błąd pozycji rzędu mm.
          </p>

          <h3>Konkretny przykład — manipulator 2R</h3>
          <p>
            Weźmy najprostszego robota, na którym można zobaczyć IKFlow w
            akcji: <strong>planarne ramię z dwoma ogniwami obrotowymi</strong>{" "}
            (dwa segmenty o długości 1, sterowane kątami{" "}
            <M tex="q_1, q_2" />). Cel — czerwona kropka — możemy osiągnąć
            na <strong>dwa sposoby</strong>: <em>elbow up</em> (łokieć w górę)
            albo <em>elbow down</em> (łokieć w dół).
          </p>
          <p>
            Niżej: dwanaście niezależnych zapytań do (symulowanej) sieci
            IKFlow. Dla każdego losujemy 2-wymiarowy gaussowski szum, sieć
            przekształca go w parę kątów. Naciśnij{" "}
            <span className="font-mono">🎲 wylosuj</span> — zobaczysz, że
            część sampli daje rozwiązanie „elbow up" (zielone), część —
            „elbow down" (fioletowe). <strong>Wszystkie</strong> trafiają
            końcówką w czerwoną kropkę:
          </p>
          <IKFlow2RDemo />
          <p>
            To jest cała magia normalizing flow w jednym demie:{" "}
            <strong>jedna sieć, jedno wywołanie, ale za każdym razem inna
            poprawna gałąź</strong>. Z 8 gałęzi Pumy zrobiłoby się analogicznie
            8 klastrów; tu mamy 2 (bo robot 2R ma tylko dwa rozwiązania).
            Każde losowanie z gaussa to jeden „zaczerpnięty z kapelusza"
            kandydat.
          </p>
          <p>
            <strong>Praktyczne zastosowanie:</strong> w planowaniu ruchu robot
            sięga po przedmiot. Jeden klaster może być zablokowany kolizją z
            ścianą — dzięki IKFlow generujemy dziesięć kandydatów, sprawdzamy
            kolizje i wybieramy ten, który przejdzie. Algorytm nie musi
            „wiedzieć" o ścianie a priori — wystarczy że po prostu produkuje
            różnorodne rozwiązania.
          </p>

          <h3>Uczciwie — co upraszcza powyższe demo?</h3>
          <p>
            Mogłeś zauważyć, że w demie powyżej znak <M tex="z_1" /> bezpośrednio
            decyduje o gałęzi: <code>z[0] &gt; 0 ? &quot;up&quot; : &quot;down&quot;</code>.
            Wygląda to jak gdybym z góry „kazał" sieci wybrać konkretne
            rozwiązanie. <strong>Tak — w demie tak jest.</strong> Symuluję jedynie{" "}
            <em>efekt</em> już wytrenowanej sieci, bez całego treningu.
          </p>
          <p>
            <strong>Prawdziwa sieć IKFlow działa inaczej:</strong>
          </p>
          <ol>
            <li>
              <strong>Nikt jej z góry nie mówi</strong> „lewy obszar szumu
              prowadzi do elbow up, prawy do elbow down". Sieć ma{" "}
              <em>wyjść z tym sama</em>.
            </li>
            <li>
              <strong>Trening</strong>: sieć dostaje miliony par <M tex="(T, q)" /> z
              datasetu (przez FK z losowych konfiguracji robota). W każdym
              kroku optymalizator przesuwa wagi tak, żeby <strong>rozkład
              wyjść</strong> sieci dla danej pozy <M tex="T" /> pasował do
              rozkładu rzeczywistych <M tex="q" /> w danych. Mówiąc dokładniej:
              minimalizujemy <em>negatywny log-likelihood</em> obserwowanych{" "}
              <M tex="q" /> przy danym <M tex="T" />.
            </li>
            <li>
              <strong>Co z tego wynika geometrycznie</strong>: po treningu w
              przestrzeni szumu <M tex="\mathbb{R}^n" /> wyłaniają się{" "}
              <em>regiony</em>. Każdy region trafia (po przejściu przez sieć)
              do jednej z gałęzi rozwiązania. Granica między regionami jest{" "}
              <strong>gładka</strong> i — kluczowe — <strong>zależy od pozy</strong>{" "}
              <M tex="T" />. Ten sam punkt szumu <M tex="z = (0.3, -0.7)" />{" "}
              dla pozy <M tex="T_1" /> może trafić do elbow up, a dla pozy{" "}
              <M tex="T_2" /> — do elbow down.
            </li>
            <li>
              <strong>Coupling layers</strong> (warstwy odwracalne) to
              techniczny trick, dzięki któremu sieć jest <em>matematycznie
              odwracalna</em> i ma policzalny jakobian. Pozwala to wytrenować
              ją przez maximum likelihood (potrzebujemy <M tex="\log p(q|T)" />,
              co przy odwracalnym mapowaniu liczy się jawnie).
            </li>
            <li>
              <strong>Proporcje gałęzi</strong> również wynikają z treningu. W
              danych mamy ~50% przykładów z elbow up i ~50% z elbow down (dla
              pozycji w obszarze, gdzie istnieją obie). Sieć dopasowuje
              wielkość regionów w przestrzeni szumu tak, żeby częstość trafień
              odpowiadała częstości w danych.
            </li>
          </ol>
          <p>
            <strong>Inaczej mówiąc:</strong> nie programujemy podziału. Podział
            wyłania się jako efekt uboczny minimalizacji błędu na danych.
            Sieć „sama odkrywa", że czasem trzeba dwóch rozwiązań, czasem
            ośmiu — bo dane treningowe ją do tego zmuszają.
          </p>
          <p>
            <strong>Dlaczego nie zrobiłem prawdziwego IKFlow w demie?</strong>{" "}
            Wymagałby wytrenowania sieci z coupling layers (~kilkaset linii
            kodu + kilkanaście minut treningu na GPU + przygotowane dane).
            W naszym module pokazujemy <em>ideę</em> — efekt, który student
            powinien zrozumieć — bez angażowania pełnej infrastruktury ML.
            Naiwny MLP w sekcji „Laboratorium" niżej jest natomiast{" "}
            <strong>prawdziwy</strong> i trenujemy go od zera w przeglądarce.
          </p>
          <p>
            <strong>Magia matematyczna w środku</strong> — żeby sieć była{" "}
            <em>odwracalna</em> i żeby umiała przekształcać dowolny rozkład w
            inny, używa się specjalnych warstw (<em>coupling layers</em>) z
            obliczalnym wyznacznikiem jakobianu. Szczegóły są dla
            zaawansowanych — tu wystarczy intuicja: sieć uczy się gładkiego,
            odwracalnego mapowania <em>szum ↔ rozwiązania</em>.
          </p>
          <p>
            Implementacja IKFlow wymaga GPU i bibliotek typu <code>FrEIA</code>{" "}
            albo <code>nflows</code> — w naszej aplikacji pokazujemy ideę,
            nie pełny model. Literatura: <em>Ames, Limb &amp; Srinivasa,
            „IKFlow: Generating Diverse Inverse Kinematics Solutions", IROS 2022</em>.
          </p>
        </StepPanel>

        <StepPanel number={4} title="Diffusion models — odzyskiwanie odpowiedzi z szumu">
          <p>
            <strong>Pomysł w jednym zdaniu:</strong> zacznij od czystego szumu i
            stopniowo go „odszumiaj" w wiele małych kroków, aż wyłoni się
            prawidłowa odpowiedź.
          </p>
          <p>
            <strong>Analogia:</strong> wyobraź sobie zaszumione, prawie nieczytelne
            zdjęcie. Aplikacja w telefonie powoli usuwa ziarno — krok po kroku
            obraz staje się wyraźniejszy. Po 50 krokach widać twarz.{" "}
            <strong>Diffusion models</strong> robią to samo, tylko zamiast
            obrazu odzyskują kąty robota.
          </p>
          <p>
            Przesuń poniższy slider od 0 do 50. Zobaczysz, jak losowe punkty
            (szum) stopniowo przesuwają się ku swoim klastrom (rozwiązania
            IK):
          </p>
          <DiffusionAnimation />
          <p>
            Krok 0: czysty szum, kropki rozproszone wszędzie. Krok 50:
            kropki uformowały dwa wyraźne klastry — to są dwie gałęzie
            rozwiązania. Sieć diffusion, w każdym z 50 kroków, robi tylko
            <em> jedno</em>: zgaduje, jak <strong>trochę</strong> przesunąć każdy
            punkt, żeby było mniej szumu. Dziesiątki kolejnych takich małych
            kroków sumują się w pełny ruch z szumu do prawdziwej odpowiedzi.
          </p>

          <h3>Konkretny przykład — manipulator 2R z animacją</h3>
          <p>
            Trochę bardziej namacalna wersja — sześć egzemplarzy tego samego
            robota 2R (dwa ogniwa obrotowe). Każdy startuje z{" "}
            <strong>innego losowego ułożenia</strong> (czysty szum w kątach{" "}
            <M tex="q_1, q_2" />). Slider 0 → 50 to kroki dyfuzji. W każdym
            kroku model robi mały „krok odszumiania" — kąty zbliżają się do
            jednej z dwóch poprawnych konfiguracji.
          </p>
          <Diffusion2RDemo />
          <p>
            Przesuń slider od 0 do 50 i obserwuj. Krok 0: każdy robot leży
            inaczej, końcówki rozproszone losowo, kolory blade (model nie
            wie jeszcze, w którą stronę pójdzie). Mniej więcej przy kroku
            20–30 widać, że <strong>pewne roboty</strong> już idą w stronę
            elbow up (zielone), a inne — elbow down (fioletowe). Krok 50:
            wszystkie sześć trafiło końcówką w czerwoną kropkę.
          </p>
          <p>
            <strong>Kluczowa obserwacja:</strong> diffusion nie zna celu z
            góry — tylko przez wiele małych kroków „szlifuje" odpowiedź. To
            jest jak rzeźba odsłaniana z bryły kamienia: każde uderzenie dłutem
            usuwa odrobinę zbędnego materiału. Po dziesiątkach uderzeń wyłania
            się postać.
          </p>
          <p>
            Dla Pumy z 8 gałęziami wyglądałoby to identycznie, tylko z
            sześcioma kątami zamiast dwóch i ośmioma możliwymi „celami"
            zamiast dwóch. Czas inferencji: 50 forward passów × ~0.3 ms = 15
            ms na zapytanie — wolniejsze niż IKFlow, ale wciąż w czasie
            rzeczywistym.
          </p>
          <p>
            <strong>Plusy:</strong>
          </p>
          <ul>
            <li>Bardzo wyraziste — radzą sobie z niezwykle skomplikowanymi rozkładami (multi-modalność wszelkiego rodzaju).</li>
            <li>Stabilny trening — łatwiej niż MDN czy GAN-y.</li>
            <li>State-of-the-art w generatywnym modelowaniu obrazów (DALL·E 2, Stable Diffusion), wideo (Sora) i robotyce (planowanie ruchu).</li>
          </ul>
          <p>
            <strong>Minusy:</strong>
          </p>
          <ul>
            <li>Sampling jest <strong>iteracyjny</strong> — ~50 forward passów na jedną odpowiedź. Pojedyncze IK trwa kilkanaście milisekund (vs ~mikrosekund dla IKFlow).</li>
            <li>Dla zwykłego IK to zbyt drogie — IKFlow wystarcza.</li>
            <li>Diffusion „odgrywa swoje" w planowaniu trajektorii, gdzie generujemy całą sekwencję ruchów <M tex="q_{1:T}" /> naraz — wtedy iteracyjny sampling przestaje być wadą.</li>
          </ul>
          <p>
            Literatura: <em>Janner et al. „Planning with Diffusion", ICML 2022</em>;{" "}
            <em>Pearce et al. „Imitating Human Behaviour with Diffusion Models", ICLR 2023</em>.
          </p>
        </StepPanel>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Laboratorium — MLP od zera</h2>
          <p className="text-[var(--muted)]">
            Trenujemy najprostszą sieć MLP w czystym TypeScripcie — bez
            zewnętrznych bibliotek ML. Cała implementacja (~200 linii kodu) w{" "}
            <code>src/lib/ml/mlp.ts</code>: forward pass, backpropagation,
            optymalizator Adam. Po treningu oceniamy predykcję na bieżącej
            pozie <M tex="T^*" /> i porównujemy z wynikiem hybrydy NN → DLS.
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <Puma560Playground height={360} />
            <TargetPoseInput />
          </div>
          <MLPDemo />
        </section>

        <section className="prose-ik">
          <h2>Krótka ściągawka — która metoda do czego?</h2>
          <table>
            <thead>
              <tr>
                <th>Metoda</th>
                <th>Idea w jednym zdaniu</th>
                <th>Kiedy używać</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Naiwny MLP</strong></td>
                <td>Sieć zwraca jedną odpowiedź</td>
                <td>Gdy potrzebujesz tylko warm startu (potem dopinanie DLS-em)</td>
              </tr>
              <tr>
                <td><strong>MDN</strong></td>
                <td>Sieć zwraca rozkład gaussowski (kilka „garbów")</td>
                <td>Gdy chcesz znać wszystkie warianty + ich prawdopodobieństwa</td>
              </tr>
              <tr>
                <td><strong>IKFlow</strong></td>
                <td>Sieć przekształca szum w poprawne odpowiedzi</td>
                <td>Standard nowoczesnego learning-based IK; szybkie, multi-modalne</td>
              </tr>
              <tr>
                <td><strong>Diffusion</strong></td>
                <td>Stopniowe odszumianie szumu w odpowiedź</td>
                <td>Planowanie trajektorii; gdy IKFlow nie radzi sobie z trudnymi rozkładami</td>
              </tr>
            </tbody>
          </table>

          <h2>Praktyczne wnioski</h2>
          <ul>
            <li>
              <strong>Naiwny MLP sam w sobie</strong> jest edukacyjny, nie
              produkcyjny — błąd pozycji <M tex="\sim 10^{-2}" /> m po krótkim
              treningu. W praktyce nie używa się go samodzielnie.
            </li>
            <li>
              <strong>Hybryda NN → klasyczny solver</strong> — łączy szybkość
              wnioskowania sieci z dokładnością iteracji. Warm start często
              zmienia trudne przypadki DLS w trywialne.
            </li>
            <li>
              <strong>MDN / IKFlow</strong> — niezbędne, jeśli zależy nam na
              różnorodności rozwiązań (np. planowanie sięgania w ciasnych
              przestrzeniach, gdzie jedno rozwiązanie może być zablokowane
              kolizją).
            </li>
            <li>
              <strong>Trening</strong> — jakość sieci w IK silnie zależy od
              jakości datasetu. Losowe konfiguracje <M tex="q" /> dają pokrycie
              <em> konfiguracji</em>, ale nierównomierne pokrycie przestrzeni
              <M tex="SE(3)" />. Profesjonalne podejścia uzupełniają:
              próbkowanie warstwowe, importance sampling, augmentacja
              syntetyczna (trajektorie, kolizje).
            </li>
          </ul>

          <h2>Limitacja modułu — co byłoby w wersji produkcyjnej</h2>
          <p>
            Moduł pokazuje trenowalnego MLP w przeglądarce bez GPU. W realnej
            dydaktyce dodatkowo:
          </p>
          <ul>
            <li>Zbiór ewaluacyjny (holdout) z osobnych poz; mierzona success rate, nie tylko MSE.</li>
            <li>Porównanie z IKFlow jako golden baseline (mały wstępnie wytrenowany model w ONNX, uruchamiany przez ONNX Runtime Web).</li>
            <li>Trening architektur alternatywnych (transformer w wejściu poz, rezydualne bloki).</li>
          </ul>
        </section>
      </div>
    </>
  );
}
