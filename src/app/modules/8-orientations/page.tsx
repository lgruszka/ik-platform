import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { OrientationExplorer } from "@/components/orientations/orientation-explorer";
import { GimbalLockDiagram } from "@/components/orientations/gimbal-lock-diagram";
import { EulerConventionsDiagram } from "@/components/orientations/euler-conventions-diagram";
import { CommonsImage } from "@/components/walkthrough/commons-image";

export default function Module8() {
  return (
    <>
      <ModuleHeader slug="8-orientations" />
      <div className="px-8 py-8 max-w-5xl space-y-10">

        <section className="prose-ik">
          <h2>Po co tyle reprezentacji?</h2>
          <p>
            Pozycja w 3D to wektor — trzy liczby, koniec. Z orientacją jest
            inaczej: jedna i ta sama orientacja może być zapisana co najmniej
            na <strong>pięć różnych sposobów</strong>, każdy z innymi zaletami
            i wadami. Brak „uniwersalnego" zapisu, który byłby najlepszy do
            wszystkiego — używamy różnych w różnych sytuacjach:
          </p>
          <ul>
            <li><strong>Macierz rotacji</strong> — bezpośrednio mnożymy w obliczeniach geometrycznych (FK, transformacje punktów).</li>
            <li><strong>Kąty Eulera (RPY)</strong> — wpisuje człowiek w panel sterowania, łatwe do interpretacji wzrokowej.</li>
            <li><strong>Axis-angle / wektor rotacji</strong> — wzrokowo intuicyjne („obróć o 90° wokół osi pionowej"), używane np. w OpenCV.</li>
            <li><strong>Kwaterniony</strong> — interpolacja, składanie wielu rotacji, brak singularności — standard w grafice i niskopoziomowym sterowaniu.</li>
          </ul>
          <p>
            Każda z tych reprezentacji opisuje element grupy <M tex="SO(3)" /> —
            zbioru obrotów w 3D. Sama grupa to obiekt 3-wymiarowy (3 stopnie
            swobody), ale różne sposoby jej sparametryzowania używają różnej
            liczby liczb (3, 4 lub 9) z różnymi ograniczeniami.
          </p>
          <p>
            <strong>Cel tego modułu:</strong> zrozumieć każdą z reprezentacji
            na poziomie intuicyjnym i obliczeniowym, znać pułapki (gimbal
            lock!), umieć sprawnie konwertować między nimi i wybrać właściwą
            do zadania.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Interaktywny eksplorator</h2>
          <p className="text-[var(--muted)]">
            Trzy slidery RPY definiują tę samą orientację w 3D. Po prawej
            zobacz ją zapisaną w pięciu reprezentacjach jednocześnie.
            Manipuluj suwakami i obserwuj, które liczby się zmieniają i jak
            (kwaterniony chodzą gładko zawsze; kąty Eulera mają nieciągłości
            przy pitch = ±90°; macierz zawsze ortogonalna).
          </p>
          <OrientationExplorer />
        </section>

        <StepPanel number={1} title="Macierz rotacji R ∈ SO(3) — fundament">
          <p>
            Najbardziej bezpośrednia reprezentacja: macierz <M tex="3 \times 3" />,
            której kolumny to obrazy bazowych wektorów osi po rotacji:
          </p>
          <MathBlock tex="R = \begin{bmatrix} R\hat{\mathbf{x}} & R\hat{\mathbf{y}} & R\hat{\mathbf{z}} \end{bmatrix}" />
          <p>
            <strong>Cechy:</strong> 9 liczb, ale z <strong>6 ograniczeniami</strong>:
          </p>
          <ul>
            <li><strong>Ortonormalność kolumn</strong> — każda kolumna jest wektorem jednostkowym (3 ograniczenia).</li>
            <li><strong>Wzajemna ortogonalność</strong> — każda para kolumn jest prostopadła (3 ograniczenia).</li>
            <li>Razem: 9 − 6 = <strong>3 stopnie swobody</strong> — tyle, ile potrzeba.</li>
            <li><strong>det(R) = +1</strong> — wykluczamy odbicia (te miałyby det = −1).</li>
          </ul>
          <p>Algebraicznie: <M tex="R^\top R = I" /> oraz <M tex="\det R = +1" />. Inwersja jest banalnie tania:</p>
          <MathBlock tex="R^{-1} = R^{\top}" />
          <p>
            <strong>Zalety:</strong> kompozycja rotacji = zwykłe mnożenie
            macierzowe (<M tex="R_{12} = R_1 \cdot R_2" />). Transformacja
            wektora — zwykłe <M tex="\mathbf{v}' = R\mathbf{v}" />. Forma używana w 99%
            wzorów kinematyki (FK, jakobian, równania DH).
          </p>
          <p>
            <strong>Wady:</strong>
          </p>
          <ul>
            <li>Redundantna (9 liczb dla 3 DOF) — po długich ciągach mnożeń narastają błędy zmiennoprzecinkowe i macierz przestaje być ściśle ortogonalna. Trzeba okresowo <em>reortonormalizować</em> (np. SVD lub Gram-Schmidt).</li>
            <li>Niewygodna do interpolacji („średnia" dwóch macierzy nie jest macierzą rotacji).</li>
            <li>Mało intuicyjna dla człowieka — patrząc na 9 liczb trudno powiedzieć, jaki to obrót.</li>
          </ul>
        </StepPanel>

        <StepPanel number={2} title="Kąty Eulera (RPY) — minimum, ale z gimbal lock">
          <p>
            Reprezentujemy rotację jako <strong>kompozycję trzech obrotów
            wokół osi</strong>. Najczęściej używane w robotyce: <strong>roll,
            pitch, yaw</strong> (przechylenie, pochylenie, odchylenie) —
            kolejność osi <em>ZYX intrinsic</em>:
          </p>
          <MathBlock tex="R = R_z(\text{yaw}) \cdot R_y(\text{pitch}) \cdot R_x(\text{roll})" />
          <p>
            Słownie: najpierw obracamy wokół osi X (roll), potem wokół nowej
            osi Y (pitch), na końcu wokół najnowszej osi Z (yaw). Jeśli czytasz
            macierze od prawej do lewej — to jest właśnie ta kolejność.
          </p>
          <p>
            <strong>Zalety:</strong> tylko 3 liczby (minimalna parametryzacja).
            Łatwo wpisać w panel, łatwo zinterpretować geometrycznie.
            Standardowy sposób komunikacji człowiek-robot.
          </p>
          <p>
            <strong>Wady — patologie:</strong>
          </p>
          <ul>
            <li>
              <strong>Gimbal lock</strong> — przy pitch = ±90° tracimy stopień
              swobody. Roll i yaw stają się nierozróżnialne (zmiana jednego
              daje to samo co zmiana drugiego). To <em>nie jest</em> błąd
              implementacji — to nieusuwalna konsekwencja parametryzacji.
            </li>
            <li>
              <strong>Niejednoznaczność</strong> — ta sama orientacja może
              być zapisana wieloma trójkami liczb (np. (0°, 90°, 30°) ≡ (30°, 90°, 0°)).
            </li>
            <li>
              <strong>Nieciągłość interpolacji</strong> — interpolacja liniowa
              kątów daje paskudne efekty wizualne (skoki przy ±180°).
            </li>
            <li>
              <strong>Plątanina konwencji</strong> — patrz niżej.
            </li>
          </ul>
          <h3>Konwencje kątów Eulera</h3>
          <p>
            „Kąty Eulera" to nie jeden zapis — to cała rodzina. Różnią się
            kolejnością osi (XYZ, ZYX, ZYZ, ZXZ, …) i tym, czy obroty są{" "}
            <em>intrinsic</em> (wokół osi obracanego ciała) czy{" "}
            <em>extrinsic</em> (wokół osi nieruchomego świata):
          </p>
          <EulerConventionsDiagram />
          <p>
            <strong>Praktyczna porada:</strong> <em>zawsze</em> dokumentuj, którą
            konwencję używasz. „RPY" w robotyce zwykle oznacza ZYX intrinsic
            (ROS, MoveIt, OpenRAVE), ale w lotnictwie i grafice 3D bywa różnie.
            Konwersja źle dopasowanych konwencji to klasyczne źródło bugów
            w integracji z czujnikami i bibliotekami zewnętrznymi.
          </p>
        </StepPanel>

        <StepPanel number={3} title="Gimbal lock — ilustracja na żywo">
          <p>
            Każda rotacja w 3 wymiarach to złożenie obrotów wokół trzech osi.
            Wyobraź sobie żyroskop z trzema obręczami — każda umożliwia obrót
            wokół innej osi, połączone w łańcuch. <strong>Gimbal lock</strong>{" "}
            zachodzi, gdy dwie z tych osi się <em>pokrywają</em>:
          </p>
          <GimbalLockDiagram />
          <p>
            Gimbal lock w fizycznym żyroskopie utrudnia pracę pilotom (znany
            problem w Apollo 11), a w robotyce destabilizuje regulatory
            posługujące się kątami Eulera w okolicach pitch ≈ ±90°.{" "}
            <strong>Rozwiązanie:</strong> używać kwaternionów lub macierzy rotacji
            jako reprezentacji wewnętrznej (kąty Eulera tylko do wejścia/wyjścia
            interfejsu użytkownika).
          </p>
        </StepPanel>

        <StepPanel number={4} title="Axis-angle (oś-kąt) i wektor rotacji">
          <p>
            <strong>Twierdzenie Eulera o obrotach:</strong> każdy obrót w 3D
            można opisać jako <strong>jeden obrót o pewien kąt θ wokół jednej
            osi k̂</strong>. To jest fakt geometryczny — stosuje się również do
            złożenia 100 wcześniejszych obrotów.
          </p>
          <p>
            <strong>Kierunek rotacji</strong> wokół osi określamy regułą prawej
            ręki: jeśli kciuk wskazuje wzdłuż osi k̂, palce wskazują kierunek
            obrotu dla θ &gt; 0. Ta sama konwencja definiuje orientację układu
            współrzędnych prawoskrętnego (X×Y = Z):
          </p>
          <CommonsImage
            src="/images/orientations/right-hand-rule.svg"
            alt="Reguła prawej ręki dla kartezjańskich osi i obrotów"
            caption="Reguła prawej ręki — orientacja osi prawoskrętnego układu kartezjańskiego oraz kierunek obrotu wokół osi (kciuk = oś, palce = kierunek dodatniego obrotu)."
            author="User:Acdx, cmglee"
            license="CC BY-SA 4.0"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Right_hand_rule_Cartesian_axes.svg"
            licenseUrl="https://creativecommons.org/licenses/by-sa/4.0/"
            height={260}
          />
          <MathBlock tex="(\hat{\mathbf{k}},\,\theta), \quad \|\hat{\mathbf{k}}\| = 1, \quad \theta \in [0, \pi]" />
          <p>
            <strong>Wzór Rodriguesa</strong> (axis-angle → macierz):
          </p>
          <MathBlock tex="R = I + \sin\theta\,[\hat{\mathbf{k}}]_\times + (1-\cos\theta)\,[\hat{\mathbf{k}}]_\times^{\,2}" />
          <p>
            gdzie <M tex="[\hat{\mathbf{k}}]_\times" /> to{" "}
            <em>macierz antysymetryczna</em> z osi k̂:
          </p>
          <MathBlock tex="[\hat{\mathbf{k}}]_\times = \begin{bmatrix} 0 & -k_z & k_y \\ k_z & 0 & -k_x \\ -k_y & k_x & 0 \end{bmatrix}" />
          <h3>Wektor rotacji — zapis kompaktowy</h3>
          <p>
            Połącz oś i kąt w jeden wektor 3-wymiarowy:
          </p>
          <MathBlock tex="\mathbf{r} = \theta\,\hat{\mathbf{k}} \in \mathbb{R}^3" />
          <p>
            Długość wektora = kąt obrotu, kierunek = oś. To jest{" "}
            <strong>logarytm SO(3)</strong> w sensie algebr Liego — używamy go
            jako twist error w solverach iteracyjnych (moduł 3) oraz jako
            standard w OpenCV (<code>cv::Rodrigues</code>) i ROS.
          </p>
          <p>
            <strong>Zalety:</strong> 3 liczby, gładkie odwzorowanie w okolicy
            zera (identyczność). Idealne do reprezentacji <em>małych</em>{" "}
            rotacji (np. w iteracjach IK lub korekcjach dryfu IMU).
          </p>
          <p>
            <strong>Wady:</strong> nieciągłe przy θ → 0 (oś staje się
            nieokreślona — choć produkt θ·k̂ pozostaje gładki) i przy θ → π (dwie
            antypodalne osie dają tę samą rotację).
          </p>
        </StepPanel>

        <StepPanel number={5} title="Kwaterniony jednostkowe — standard nowoczesnej robotyki">
          <p>
            Najsubtelniejsza, ale najbardziej praktyczna reprezentacja.
            Kwaternion to czwórka liczb:
          </p>
          <MathBlock tex="q = (w, x, y, z) = w + x\mathrm{i} + y\mathrm{j} + z\mathrm{k}" />
          <p>
            z mnożeniem zdefiniowanym przez Hamiltona (1843). Dla kwaternionów{" "}
            <strong>jednostkowych</strong> (<M tex="\|q\| = 1" />) istnieje piękna
            tożsamość — każdy obrót w 3D zapisuje się jako:
          </p>
          <MathBlock tex="q = \left(\cos\frac{\theta}{2},\; \hat{k}_x \sin\frac{\theta}{2},\; \hat{k}_y \sin\frac{\theta}{2},\; \hat{k}_z \sin\frac{\theta}{2}\right)" />
          <p>
            (<M tex="\theta" />, <M tex="\hat{\mathbf{k}}" /> jak w
            axis-angle). Cztery liczby z jednym ograniczeniem (norma = 1) →{" "}
            <strong>3 stopnie swobody</strong>, tyle ile trzeba.
          </p>
          <p>
            <strong>Kompozycja rotacji</strong> = mnożenie kwaternionów (po
            regułach Hamiltona):
          </p>
          <MathBlock tex="q_{12} = q_1 \cdot q_2 \quad\text{(najpierw } q_2\text{, potem } q_1\text{)}" />
          <p>
            <strong>Inwersja</strong> = sprzężenie (zmień znak części urojonej):
          </p>
          <MathBlock tex="q^{-1} = (w,\; -x,\; -y,\; -z) \quad\text{(dla } \|q\|=1\text{)}" />
          <h3>Zalety kwaternionów</h3>
          <ul>
            <li><strong>Brak singularności</strong> — gimbal lock nie istnieje. Gładkie odwzorowanie do <M tex="SO(3)" /> wszędzie.</li>
            <li><strong>Tania kompozycja</strong> — 16 mnożeń vs 27 dla macierzy 3×3.</li>
            <li><strong>Numerycznie stabilne</strong> — mała utrata jednostkowości łatwo naprawiana przez normalizację (1 dzielenie).</li>
            <li><strong>Naturalna interpolacja</strong> — SLERP („sferyczna interpolacja") daje gładkie obroty z stałą prędkością kątową.</li>
            <li><strong>Mała pamięć</strong> — 4 floats vs 9 dla macierzy.</li>
          </ul>
          <h3>Wady kwaternionów</h3>
          <ul>
            <li><strong>Mniej intuicyjne</strong> — patrząc na (0.7, 0.0, 0.0, 0.7) trudno powiedzieć od razu, jaki to obrót.</li>
            <li><strong>Pokrycie podwójne</strong> — kwaterniony <M tex="q" /> i <M tex="-q" /> reprezentują tę samą rotację. Trzeba o tym pamiętać przy porównaniach i interpolacji (SLERP wewnętrznie sprawdza to przez iloczyn skalarny).</li>
            <li><strong>Wymaga normalizacji</strong> po długich rachunkach (1 sqrt + 4 dzielenia, tańsze niż reortonormalizacja macierzy).</li>
          </ul>
          <h3>SLERP — interpolacja, którą zawsze chciałeś</h3>
          <p>
            Sferyczna interpolacja liniowa (Spherical Linear Interpolation,
            Shoemake 1985) — gładkie przejście między dwoma orientacjami{" "}
            <M tex="q_1" /> i <M tex="q_2" />:
          </p>
          <MathBlock tex="\text{slerp}(q_1, q_2, t) = \frac{\sin((1-t)\Omega)}{\sin\Omega}\,q_1 + \frac{\sin(t\Omega)}{\sin\Omega}\,q_2" />
          <p>
            gdzie <M tex="\Omega" /> = kąt między <M tex="q_1" /> i{" "}
            <M tex="q_2" /> w 4D. Wynik: stała prędkość kątowa od początku
            do końca, krótszą stroną sfery 4D. Spróbuj zinterpolować dwie
            orientacje suwakami w eksploratorze powyżej — kwaterniony dają
            zawsze ciągłą interpolację, natomiast kąty Eulera tracą ciągłość
            przy ±180°.
          </p>
        </StepPanel>

        <section className="prose-ik">
          <h2>Kiedy czego używać — praktyczna ściąga</h2>
          <table>
            <thead>
              <tr>
                <th>Sytuacja</th>
                <th>Najlepsza reprezentacja</th>
                <th>Dlaczego</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>FK, transformacje punktów, jakobian</td>
                <td><strong>Macierz</strong></td>
                <td>Bezpośrednie mnożenie macierzy z wektorami</td>
              </tr>
              <tr>
                <td>Wejście/wyjście z user interface</td>
                <td><strong>Kąty Eulera (RPY)</strong></td>
                <td>Człowiek rozumie „przekręć o 30°"</td>
              </tr>
              <tr>
                <td>Twist error w solverach iteracyjnych</td>
                <td><strong>Wektor rotacji</strong> (log SO(3))</td>
                <td>3 liczby, gładkie w okolicach 0, dodawanie ma sens</td>
              </tr>
              <tr>
                <td>Interpolacja trajektorii</td>
                <td><strong>Kwaternion</strong> (SLERP)</td>
                <td>Gładkie, stała prędkość kątowa, brak singularności</td>
              </tr>
              <tr>
                <td>Składanie wielu rotacji w łańcuchu</td>
                <td><strong>Kwaternion</strong></td>
                <td>Tańsze i numerycznie stabilniejsze niż macierze</td>
              </tr>
              <tr>
                <td>Komunikacja z OpenCV / ROS / niskopoziomowe sterowanie</td>
                <td><strong>Wektor rotacji</strong> lub <strong>kwaternion</strong></td>
                <td>Standardy bibliotek</td>
              </tr>
              <tr>
                <td>Prezentacja / wizualizacja / GUI</td>
                <td><strong>Kąty Eulera</strong> (intuicyjnie) lub <strong>axis-angle</strong></td>
                <td>Czytelne dla człowieka</td>
              </tr>
              <tr>
                <td>Małe korekcje (np. dryf IMU)</td>
                <td><strong>Wektor rotacji</strong></td>
                <td>Dodawanie ma sens dla małych <M tex="\theta" />, brak nieciągłości</td>
              </tr>
            </tbody>
          </table>

          <h2>Dwie najczęstsze reguły praktyczne</h2>
          <ol>
            <li>
              <strong>Wewnątrz silnika obliczeniowego</strong> używaj
              <em>jednej</em> reprezentacji konsekwentnie: zwykle macierzy
              (FK, jakobian) lub kwaternionów (interpolacja, łańcuchy
              transformacji). Nie konwertuj tam-i-z-powrotem niepotrzebnie.
            </li>
            <li>
              <strong>Konwertuj na granicach systemu</strong> — gdy dane
              wchodzą lub wychodzą (UI, czujniki, biblioteki zewnętrzne) —
              i dokumentuj konwencję. Każda zmiana konwencji to potencjalny bug.
            </li>
          </ol>

          <h2>Dla zaawansowanych: związek z algebrami Liego</h2>
          <p>
            Wszystkie cztery „minimalne" reprezentacje (Eulera, axis-angle,
            wektor rotacji, kwaternion) to różne sposoby parametryzowania
            rozmaitości <M tex="SO(3)" />. Wektor rotacji ma szczególne
            znaczenie — jest{" "}
            <strong>wykładniczą mapą algebry Liego</strong>:
          </p>
          <MathBlock tex="R = \exp([\mathbf{r}]_\times), \quad \mathbf{r} = \log(R)^{\vee}" />
          <p>
            Tu <M tex="\exp" /> i <M tex="\log" /> to macierzowe wykładnicze
            i logarytm. Wzór Rodriguesa to jest po prostu rozwinięcie szeregu
            Taylora dla exp na macierzach antysymetrycznych. Ten związek
            pozwala uogólniać metody numeryczne (np. „średnia" rotacji =
            średnia ich logów + powrót do SO(3) przez exp). Temat dla osobnego
            wykładu — w robotyce wystarczy wiedzieć, że istnieje i że
            biblioteki typu <code>scipy.spatial.transform</code> czy{" "}
            <code>Sophus</code> (C++) udostępniają te operacje gotowe.
          </p>

          <h2>Co dalej</h2>
          <p>
            Po tym module powinno być znacznie jaśniejsze, dlaczego w module
            3 (jakobianowych) używamy logarytmu SO(3) jako twist error, a w
            module 1 (analitycznym) — bezpośrednio elementów macierzy R.
            Każda decyzja o reprezentacji ma swoje uzasadnienie. Praktyczna
            wskazówka na koniec: jeśli pracujesz nad kontrolerem robota,
            silnikiem 3D albo systemem AR/VR — zacznij od zaimplementowania
            klasy <code>Rotation</code> ze wszystkimi pięcioma reprezentacjami
            (jak <code>scipy.spatial.transform.Rotation</code> albo{" "}
            <code>three.js Quaternion</code>) i konsekwentnie używaj tylko
            jednej wewnętrznej, konwertując na granicy.
          </p>
        </section>
      </div>
    </>
  );
}
