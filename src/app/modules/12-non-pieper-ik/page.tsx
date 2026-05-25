import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { PieperFormsComparison } from "@/components/non-pieper/pieper-forms-comparison";
import { Es5IkDerivation } from "@/components/non-pieper/es5-ik-derivation";

export default function ModuleNonPieperIk() {
  return (
    <>
      <ModuleHeader slug="12-non-pieper-ik" />
      <div className="px-8 py-8 max-w-5xl space-y-8">

        <section className="prose-ik">
          <h2>O czym jest ten moduł</h2>
          <p>
            Moduł 1 pokazał piękne, „klasyczne" wyprowadzenie IK dla{" "}
            <strong>PUMA 560</strong> — manipulator z trzema osiami nadgarstka
            schodzącymi w jednym punkcie (forma A warunku Piepera). To pozwoliło
            na dekompozycję 3+3: najpierw pozycja, potem orientacja. Pięć stron
            algebry, jeden czysty wynik.
          </p>
          <p>
            <strong>Większość współczesnych cobotów nie spełnia jednak formy A.</strong>{" "}
            UR5, UR10, Franka Panda, KUKA iiwa — wszystkie one mają geometrie
            zaprojektowane pod inne cele (smukłość, lekkość, równa dystrybucja
            mas), które łamią klasyczną dekompozycję. Czy to znaczy że nie można
            ich rozwiązać analitycznie? Nie — można, ale trzeba zmienić podejście.
          </p>
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 my-4 text-sm">
            <p className="font-semibold mb-1">Co wynika z tego modułu</p>
            <p className="text-[var(--muted)] mb-0">
              Po przerobieniu modułu student potrafi: (1) rozpoznać formę
              warunku Piepera na podstawie geometrii DH, (2) wyprowadzić IK dla
              manipulatora UR5 (forma B, metoda Hawkins/Kufieta), (3) wyprowadzić
              IK dla ES5 z dysertacji Gruszki, (4) rozumie różnicę między
              manipulatorami 6-DOF a redundantnym 7-DOF (Franka Panda) i wie
              dlaczego ten ostatni wymaga zupełnie innego podejścia.
            </p>
          </div>
        </section>

        <StepPanel number={1} title="Dwie formy warunku Piepera + przypadek brzegowy">
          <p>
            Donald Pieper w 1968 roku pokazał, że istnieje rozwiązanie zamknięte
            IK dla manipulatora 6-DOF jeśli spełniony jest jeden z dwóch
            warunków geometrycznych:
          </p>
          <ul>
            <li><strong>Forma A</strong> — trzy kolejne osie obrotu przecinają się w jednym punkcie.</li>
            <li><strong>Forma B</strong> — trzy kolejne osie obrotu są wzajemnie równoległe.</li>
          </ul>
          <p>
            W obu przypadkach 6-wymiarowy problem rozpada się na dwa
            niezależne 3-wymiarowe (pozycja + orientacja w jakimś rozumieniu),
            a wyniki są wzorami zamkniętymi z funkcjami trygonometrycznymi.
            <strong>Jeśli żaden warunek nie zachodzi</strong> — IK <em>nadal</em>{" "}
            może być rozwiązalna analitycznie, ale wymaga zaawansowanych
            metod algebraicznych (Raghavan–Roth, redukcja do równania
            16. stopnia w jednej zmiennej).
          </p>

          <PieperFormsComparison />

          <p>
            <strong>Praktyczna konsekwencja:</strong> projektanci robotów zwykle
            wybierają geometrię spełniającą jedną z form Piepera{" "}
            <em>celowo</em> — żeby IK miało zamknięte rozwiązanie i biegało w µs
            zamiast ms. Manipulatorów bez Piepera używa się rzadko (głównie
            w eksperymentalnych systemach badawczych).
          </p>
        </StepPanel>

        <StepPanel number={2} title="UR5/UR10/UR16 — dlaczego forma A nie działa">
          <p>
            Manipulatory <strong>Universal Robots</strong> (UR3, UR5, UR10, UR16)
            mają geometrię zaprojektowaną pod cele <em>współpracy z człowiekiem</em>:
            smukłe, bez ostrych krawędzi, równa dystrybucja masy. Cecha
            kinematyczna: kolejne osie q₂, q₃, q₄ są <strong>wzajemnie równoległe</strong>{" "}
            (oś pozioma, w jednym kierunku), a osie nadgarstka są{" "}
            <em>przesunięte</em> względem siebie o niezerowy{" "}
            <M tex="d_5" /> — co oznacza że <em>nie schodzą w jednym punkcie</em>.
          </p>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm font-mono">
            <p className="font-semibold mb-2 font-sans">Parametry DH UR5 (modyfikowany Craig)</p>
            <pre className="text-xs leading-relaxed mb-0">{`i  | α_{i-1}  | a_{i-1}  | d_i     | θ_i
---|----------|----------|---------|------
1  |    0     |    0     | 0.089   | q₁
2  |  +π/2    |    0     |   0     | q₂
3  |    0     | -0.425   |   0     | q₃    ← q2 ∥ q3 ∥ q4 (forma B)
4  |    0     | -0.392   | 0.109   | q₄
5  |  +π/2    |    0     | 0.095   | q₅    ← d_5 ≠ 0 → forma A NIE
6  |  -π/2    |    0     | 0.082   | q₆`}</pre>
          </div>
          <p>
            <strong>Wniosek:</strong> dekompozycja 3+3 z M1 nie zadziała — nie
            istnieje „środek nadgarstka" jako wspólny punkt 3 ostatnich osi.
            Ale spełniona jest forma B (q₂ ∥ q₃ ∥ q₄), więc da się rozpisać
            rozwiązanie zamknięte — tylko innym algorytmem.
          </p>
          <p>
            <strong>Metoda Hawkins/Kufieta (2013/2014):</strong> kolejność
            wyprowadzania to <M tex="q_1 \to q_5,q_6 \to q_2,q_3,q_4" />.
            W skrócie: z geometrii „cylindra zakazanego" wokół podstawy{" "}
            wyznacza się q₁ przez przekształcenia atan2 z d_5 jako stałym
            offsetem. Mając q₁, można wyizolować q₅ i q₆ z elementów macierzy
            <M tex="{}^6R_1" />. Mając konfigurację kiści, wracamy do
            podproblemu 3R-planarnego w pionowej płaszczyźnie po q₁ — i z
            twierdzenia cosinusów (jak w M1) wyznaczamy q₂, q₃, q₄.
          </p>
          <p>
            <strong>Liczba rozwiązań:</strong> <em>8</em> — tak samo jak Pumy.
            Dwa branche shoulder × dwa elbow × dwa wrist. Pomimo zupełnie innej
            algebry, struktura rozwiązań pozostaje taka sama dla każdego
            manipulatora spełniającego jakąkolwiek formę Piepera.
          </p>
          <details className="rounded border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-2 my-3 not-prose">
            <summary className="cursor-pointer font-semibold text-sm py-1">
              ▸ Źródła i implementacje referencyjne UR5 IK
            </summary>
            <div className="prose-ik max-w-none mt-3 text-sm">
              <ul>
                <li>
                  <strong>Hawkins, K. (2013).</strong> „Analytic inverse kinematics
                  for the Universal Robots UR-5/UR-10 arms." Technical Report,
                  Georgia Institute of Technology — pierwszy formalny artykuł,
                  pełne wyprowadzenie wszystkich 8 gałęzi.
                </li>
                <li>
                  <strong>Kufieta, K. (2014).</strong> „Force estimation in
                  robotic manipulators: modeling, simulation and experiments."
                  MSc Thesis, NTNU — alternatywne wyprowadzenie z czytelniejszą
                  notacją, używane w wielu open-source implementacjach.
                </li>
                <li>
                  <strong>Implementacje:</strong> <code>ur_kinematics</code>{" "}
                  w ROS, <code>ur_rtde</code> w Pythonie, <code>ikfast</code>{" "}
                  (autogenerowany z URDF), C++ w <code>ur_robot_driver</code>.
                </li>
              </ul>
              <p>
                W aplikacji <em>nie implementujemy</em> pełnej IK UR5 — to
                wykraczałoby poza zakres modułu i wymagało osobnego modelu URDF.
                Skupiamy się tu na ES5 (mamy go już w M9–M11), dla którego{" "}
                <em>mamy gotowe wyprowadzenie</em> z dysertacji [Gruszka 2024,
                Załącznik A].
              </p>
            </div>
          </details>
        </StepPanel>

        <StepPanel number={3} title="ES5 (EasyRobots) — geometria i pełne wyprowadzenie z dysertacji">
          <p>
            <strong>ES5</strong> to manipulator firmy EasyRobots, dla którego{" "}
            <a href="/modules/9-dynamics" className="text-[var(--accent)] underline">M9 (dynamika)</a>{" "}
            i <a href="/modules/10-energy" className="text-[var(--accent)] underline">M10 (silnik)</a>{" "}
            korzystają z parametrów inercji. Tu domykamy pętlę — pokazujemy
            jego <em>kinematyczne</em> rozwiązanie IK. Geometrycznie ES5 jest
            podobny do UR (forma B — równoległość q₂, q₃, q₄), ale ma inne
            wymiary i konwencję DH.
          </p>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm font-mono">
            <p className="font-semibold mb-2 font-sans">Parametry DH ES5 (modyfikowany Craig, src/lib/robots/es5.ts)</p>
            <pre className="text-xs leading-relaxed mb-0">{`i  | α_{i-1}  | a_{i-1}  | d_i      | θ_i
---|----------|----------|----------|------
1  |    0     |    0     |   0      | q₁
2  |  +π/2    |    0     |   0      | q₂
3  |    0     | 0.425    |   0      | q₃    ← q2 ∥ q3 ∥ q4 (forma B)
4  |    0     | 0.395    | 0.1105   | q₄
5  |  -π/2    |    0     | 0.101    | q₅
6  |  +π/2    |    0     | 0.0765   | q₆`}</pre>
          </div>
          <p>
            <strong>Kolejność wyprowadzania współrzędnych</strong> w dysertacji:
            θ₁ → θ₅ → θ₆ → θ₃ → θ₂ → θ₄. Ta sekwencja nie jest oczywista —
            jest <em>algebraicznie wymuszona</em> faktem, że pewne równania
            trygonometryczne dają się rozwiązać tylko gdy znane są inne
            współrzędne. To kontrastuje z M1 (Puma), gdzie kolejność q₁ → q₂,₃ →
            q₄,₅,₆ wynikała wprost z dekompozycji formy A.
          </p>
          <p>
            Poniżej pełne wyprowadzenie 6 współrzędnych zgodnie z Załącznikiem A
            dysertacji. Każdy krok zawiera referencję do oryginalnego numeru
            równania w pracy (eq. A.x).
          </p>

          <div className="not-prose">
            <Es5IkDerivation />
          </div>
        </StepPanel>

        <StepPanel number={4} title="Porównanie 3 robotów obok siebie">
          <div className="overflow-x-auto">
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b border-[var(--panel-border)]">
                  <th className="text-left py-2 pr-3">Cecha</th>
                  <th className="text-left py-2 pr-3">PUMA 560 (M1)</th>
                  <th className="text-left py-2 pr-3">UR5 (Hawkins/Kufieta)</th>
                  <th className="text-left py-2">ES5 (Gruszka 2024)</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40 [&>tr]:align-baseline">
                <tr>
                  <td className="py-2 pr-3 font-semibold">Forma Piepera</td>
                  <td className="py-2 pr-3">A (osie 4,5,6 schodzą)</td>
                  <td className="py-2 pr-3">B (osie 2,3,4 równoległe)</td>
                  <td className="py-2">B (osie 2,3,4 równoległe)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold">DOF</td>
                  <td className="py-2 pr-3">6</td>
                  <td className="py-2 pr-3">6</td>
                  <td className="py-2">6</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold">Liczba rozwiązań</td>
                  <td className="py-2 pr-3">8</td>
                  <td className="py-2 pr-3">8</td>
                  <td className="py-2">8</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold">Kolejność wyprowadz.</td>
                  <td className="py-2 pr-3 font-mono text-xs">q₁ → q₂,q₃ → q₄,q₅,q₆</td>
                  <td className="py-2 pr-3 font-mono text-xs">q₁ → q₅,q₆ → q₂,q₃,q₄</td>
                  <td className="py-2 font-mono text-xs">q₁ → q₅ → q₆ → q₃ → q₂ → q₄</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold">Środek nadgarstka</td>
                  <td className="py-2 pr-3">TAK — w punkcie przecięcia osi 4,5,6</td>
                  <td className="py-2 pr-3">NIE — osie nie schodzą (d_5 ≠ 0)</td>
                  <td className="py-2">NIE — osie nie schodzą</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold">Singularności</td>
                  <td className="py-2 pr-3">oś 1, łokieć wew./zew., nadgarstek</td>
                  <td className="py-2 pr-3">cylinder zakazany, łokieć, nadgarstek</td>
                  <td className="py-2">analogiczne do UR (θ₅=0 → wrist)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold">Typowe zastosowanie</td>
                  <td className="py-2 pr-3">przemysł motoryzacyjny, edukacja</td>
                  <td className="py-2 pr-3">cobot, lekkie zadania, lead-through</td>
                  <td className="py-2">cobot/przemysł, dydaktyka dysertacji</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4">
            <strong>Wniosek dydaktyczny:</strong> mimo zupełnie różnych geometrii
            i algorytmów wyprowadzania, <em>liczba rozwiązań</em> (8) i ogólna
            <em> struktura wyboru</em> (shoulder × elbow × wrist) są
            uniwersalne dla każdego manipulatora 6-DOF spełniającego warunek
            Piepera. To głęboka prawda: forma rozwiązania zależy od geometrii,
            ale <em>liczba</em> i <em>typ</em> branch'y — od struktury problemu IK.
          </p>
        </StepPanel>

        <StepPanel number={5} title="Bonus: Franka Panda — 7 DOF, redundancja i null-space">
          <p>
            <strong>Franka Emika Panda</strong> łamie wszystkie założenia, na
            których opierał się ten moduł — bo ma <em>siedem</em> stopni swobody
            zamiast sześciu. Dla zadania SE(3) (6-DOF) oznacza to{" "}
            <strong>nadmiarowość 1 DOF</strong>: dla każdej osiągalnej pozy
            końcówki istnieje <em>cała ciągła rodzina</em> konfiguracji
            (parametryzowana jednym dodatkowym kątem — zwykle nazywanym{" "}
            <em>kątem łokcia</em> albo swivel angle).
          </p>
          <p>
            Konsekwencje:
          </p>
          <ul>
            <li>
              <strong>Zamknięta IK</strong> dla Franki <em>istnieje</em>, ale
              parametryczna — funkcja{" "}
              <M tex="\theta_2(\psi), \theta_4(\psi), \theta_6(\psi)" /> jednego
              wolnego parametru ψ ∈ ℝ.
            </li>
            <li>
              W praktyce do sterowania w pełnym 7-DOF używa się <strong>metod
              jakobianowych z projekcją w null-space</strong> — temat{" "}
              <a href="/modules/3-jacobian" className="text-[var(--accent)] underline">M3</a>{" "}
              (Jakobian Transpose, DLS) i częściowo{" "}
              <a href="/modules/7-singularities" className="text-[var(--accent)] underline">M7</a>{" "}
              (analiza singularności). Pseudoinwersja jakobianu daje minimalne
              <M tex="\dot q" />, a null-space pozwala dodatkowo „celować" w
              ukryte cele (np. unikać przeszkód, optymalizować manipulability).
            </li>
            <li>
              <strong>Zalety nadmiarowości:</strong> Panda omijająca przeszkody
              między bazą a celem; możliwość zachowania ergonomicznej
              konfiguracji łokcia podczas zmiany pozy końcówki; więcej
              bezpieczeństwa w pobliżu człowieka.
            </li>
          </ul>
          <p>
            <strong>Pełne wyprowadzenie 7-DOF IK</strong> wykracza poza ten
            moduł — wymaga osobnego materiału z parametryzacją kąta łokcia,
            obsługą singularności łokcia (gdy oś 4 jest prawie wyprostowana) i
            integracją z null-space optymalizacją. Sugestia: prześledź
            <em> P. Beeson & B. Ames (2015)</em> „TRAC-IK" — niereferencyjna
            ale praktycznie stosowana biblioteka działająca na Franka, UR i
            Pumie.
          </p>
        </StepPanel>

        <section className="prose-ik">
          <h2>Co dalej</h2>
          <ul>
            <li>
              Wyprowadzenia z tego modułu mogą być przepisane do{" "}
              <code>src/lib/solvers/es5-analytical.ts</code> (analogicznie do
              <code> puma560-analytical.ts</code> z M1) jako referencyjna
              implementacja IK ES5 — byłby to drugi solver analityczny w platformie.
            </li>
            <li>
              <a href="/modules/3-jacobian" className="text-[var(--accent)] underline">M3 (Jakobianowe)</a>{" "}
              — metody iteracyjne <em>nie wymagają</em> spełnienia warunku Piepera,
              działają dla dowolnej geometrii (Franka, UR, custom). To uniwersalne
              rozwiązanie dla przypadków, w których wyprowadzenie analityczne jest
              zbyt skomplikowane.
            </li>
            <li>
              <a href="/modules/6-benchmark" className="text-[var(--accent)] underline">M6 (Benchmark)</a>{" "}
              — porównanie analityka vs iteracja na konkretnych przypadkach
              testowych. Analityk wygrywa w prędkości (µs vs ms), iteracja w
              uniwersalności.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
