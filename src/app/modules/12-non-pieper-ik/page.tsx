import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { PieperFormsComparison } from "@/components/non-pieper/pieper-forms-comparison";
import { Es5IkDerivation } from "@/components/non-pieper/es5-ik-derivation";
import { Es5IkPlayground } from "@/components/non-pieper/es5-ik-playground";
import { PythonStep } from "@/components/walkthrough/python-step";

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
            <em>celowo</em> — żeby IK miało zamknięte rozwiązanie i było obliczane
            w mikrosekundach zamiast milisekundach. Manipulatory bez Piepera
            stosuje się rzadko (głównie w eksperymentalnych systemach badawczych).
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
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 my-3 not-prose">
            <p className="font-semibold mb-3 text-sm">Parametry DH UR5 (modyfikowany Craig, [m, rad])</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--panel-border)] text-[var(--muted)]">
                    <th className="text-left py-2 px-3 font-semibold w-12">i</th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="\alpha_{i-1}" /></th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="a_{i-1}" /></th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="d_i" /></th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="\theta_i" /></th>
                    <th className="text-left py-2 px-3 font-semibold">uwagi</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums [&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
                  <tr><td className="py-1.5 px-3">1</td><td className="text-right px-3">0</td><td className="text-right px-3">0</td><td className="text-right px-3">0,089</td><td className="text-right px-3"><M tex="q_1" /></td><td className="px-3 text-xs text-[var(--muted)]">obrót podstawy</td></tr>
                  <tr><td className="py-1.5 px-3">2</td><td className="text-right px-3"><M tex="+\pi/2" /></td><td className="text-right px-3">0</td><td className="text-right px-3">0</td><td className="text-right px-3"><M tex="q_2" /></td><td className="px-3 text-xs text-[var(--muted)]">bark</td></tr>
                  <tr className="bg-purple-50/60 dark:bg-purple-950/20"><td className="py-1.5 px-3">3</td><td className="text-right px-3">0</td><td className="text-right px-3">−0,425</td><td className="text-right px-3">0</td><td className="text-right px-3"><M tex="q_3" /></td><td className="px-3 text-xs text-purple-700 dark:text-purple-300 font-semibold">forma B: q₂ ∥ q₃ ∥ q₄</td></tr>
                  <tr className="bg-purple-50/60 dark:bg-purple-950/20"><td className="py-1.5 px-3">4</td><td className="text-right px-3">0</td><td className="text-right px-3">−0,392</td><td className="text-right px-3">0,109</td><td className="text-right px-3"><M tex="q_4" /></td><td className="px-3 text-xs text-[var(--muted)]">łokieć</td></tr>
                  <tr className="bg-red-50/60 dark:bg-red-950/20"><td className="py-1.5 px-3">5</td><td className="text-right px-3"><M tex="+\pi/2" /></td><td className="text-right px-3">0</td><td className="text-right px-3">0,095</td><td className="text-right px-3"><M tex="q_5" /></td><td className="px-3 text-xs text-red-700 dark:text-red-300 font-semibold">d₅ ≠ 0 — forma A wykluczona</td></tr>
                  <tr><td className="py-1.5 px-3">6</td><td className="text-right px-3"><M tex="-\pi/2" /></td><td className="text-right px-3">0</td><td className="text-right px-3">0,082</td><td className="text-right px-3"><M tex="q_6" /></td><td className="px-3 text-xs text-[var(--muted)]">kołnierz</td></tr>
                </tbody>
              </table>
            </div>
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
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 my-3 not-prose">
            <p className="font-semibold mb-1 text-sm">Parametry DH ES5 (modyfikowany Craig, [m, rad])</p>
            <p className="text-xs text-[var(--muted)] mb-3 font-mono">
              źródło: <code>src/lib/robots/es5.ts</code>
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--panel-border)] text-[var(--muted)]">
                    <th className="text-left py-2 px-3 font-semibold w-12">i</th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="\alpha_{i-1}" /></th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="a_{i-1}" /></th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="d_i" /></th>
                    <th className="text-right py-2 px-3 font-semibold"><M tex="\theta_i" /></th>
                    <th className="text-left py-2 px-3 font-semibold">uwagi</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums [&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
                  <tr><td className="py-1.5 px-3">1</td><td className="text-right px-3">0</td><td className="text-right px-3">0</td><td className="text-right px-3">0</td><td className="text-right px-3"><M tex="q_1" /></td><td className="px-3 text-xs text-[var(--muted)]">obrót podstawy</td></tr>
                  <tr><td className="py-1.5 px-3">2</td><td className="text-right px-3"><M tex="+\pi/2" /></td><td className="text-right px-3">0</td><td className="text-right px-3">0</td><td className="text-right px-3"><M tex="q_2" /></td><td className="px-3 text-xs text-[var(--muted)]">bark</td></tr>
                  <tr className="bg-purple-50/60 dark:bg-purple-950/20"><td className="py-1.5 px-3">3</td><td className="text-right px-3">0</td><td className="text-right px-3">0,425</td><td className="text-right px-3">0</td><td className="text-right px-3"><M tex="q_3" /></td><td className="px-3 text-xs text-purple-700 dark:text-purple-300 font-semibold">forma B: q₂ ∥ q₃ ∥ q₄</td></tr>
                  <tr className="bg-purple-50/60 dark:bg-purple-950/20"><td className="py-1.5 px-3">4</td><td className="text-right px-3">0</td><td className="text-right px-3">0,395</td><td className="text-right px-3">0,1105</td><td className="text-right px-3"><M tex="q_4" /></td><td className="px-3 text-xs text-[var(--muted)]">łokieć z odsadzeniem d₄</td></tr>
                  <tr><td className="py-1.5 px-3">5</td><td className="text-right px-3"><M tex="-\pi/2" /></td><td className="text-right px-3">0</td><td className="text-right px-3">0,101</td><td className="text-right px-3"><M tex="q_5" /></td><td className="px-3 text-xs text-[var(--muted)]">kostka nadgarstka</td></tr>
                  <tr><td className="py-1.5 px-3">6</td><td className="text-right px-3"><M tex="+\pi/2" /></td><td className="text-right px-3">0</td><td className="text-right px-3">0,0765</td><td className="text-right px-3"><M tex="q_6" /></td><td className="px-3 text-xs text-[var(--muted)]">kołnierz końcówki</td></tr>
                </tbody>
              </table>
            </div>
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
          <h2>Kompletna funkcja Python — wszystkie kroki sklejone</h2>
          <p>
            Sześć snippetów Python z kroków 1–6 wyprowadzenia powyżej, połączone
            w jedną funkcję <code>solve_es5_ik(T_target)</code>. Zwraca listę do
            8 rozwiązań (krotki 6 kątów), zgodnie z gałęziami shoulder × elbow × wrist.
          </p>
          <PythonStep
            label="Python · pełna implementacja"
            caption="kopiuj-wklej do notatnika i uruchom (wymaga numpy + funkcji DH)"
            code={`import numpy as np

# Parametry DH ES5 (modified Craig) — z src/lib/robots/es5.ts:
A3 = 0.425    # ramię
A4 = 0.395    # przedramię
D4 = 0.1105   # odsadzenie przedramienia
D5 = 0.101    # kostka nadgarstka
D6 = 0.0765   # wystawienie końcówki
EPS = 1e-9

def solve_es5_ik(T_target, link_transform, inv_se3):
    """
    Analityczne IK dla ES5 (forma B Piepera) wg Załącznika A
    dysertacji [Gruszka 2024].

    link_transform(i, theta_i) — macierz 4×4 ⁱ⁻¹T_i z DH (Craig).
    inv_se3(T) — szybka odwrotność SE(3): R^T blok + -R^T·t.
    Obie funkcje musisz dostarczyć (kilka linijek każda).

    Zwraca: list[tuple[float, ...]] — do 8 krotek (q1..q6).
    """
    R = T_target[:3, :3]
    px, py = T_target[0, 3], T_target[1, 3]
    r11, r12, r13 = R[0]
    r21, r22, r23 = R[1]

    # === Krok 1: θ₁ (dwie gałęzie shoulder) ===
    p5x = px - D6 * r13
    p5y = py - D6 * r23
    p5xy = np.hypot(p5x, p5y)
    if p5xy < EPS:
        return []
    ratio = D4 / p5xy
    if abs(ratio) > 1:
        return []
    asin_val = np.arcsin(np.clip(ratio, -1, 1))
    alpha    = np.arctan2(p5y, p5x)
    theta1_candidates = [
        (alpha + asin_val,           "right"),
        (alpha + np.pi - asin_val,   "left"),
    ]

    solutions = []
    for theta1, shoulder in theta1_candidates:
        c1, s1 = np.cos(theta1), np.sin(theta1)

        # === Krok 2: θ₅ (dwie gałęzie wrist) ===
        cos5 = (px * s1 - py * c1 - D4) / D6
        if abs(cos5) > 1:
            continue
        base_t5 = np.arccos(np.clip(cos5, -1, 1))
        for wrist_sign in (+1, -1):
            theta5 = wrist_sign * base_t5
            c5, s5 = np.cos(theta5), np.sin(theta5)

            # === Krok 3: θ₆ — atan2(sin θ₆, cos θ₆) z komórek ⁶R₁ ===
            if abs(s5) < EPS:
                theta6 = 0.0
            else:
                sin6 = ( s1 * r12 - c1 * r22) / s5
                cos6 = (-s1 * r11 + c1 * r21) / s5
                theta6 = np.arctan2(sin6, cos6)

            # === T_1_4 numerycznie (cofamy się przez T_5_6, T_4_5) ===
            T01 = link_transform(0, theta1)
            T45 = link_transform(4, theta5)
            T56 = link_transform(5, theta6)
            T14 = inv_se3(T01) @ T_target @ inv_se3(T56) @ inv_se3(T45)
            p1x_4, _, p1z_4 = T14[:3, 3]

            # === Krok 4: θ₃ (dwie gałęzie elbow) ===
            a2, a3 = A3, A4
            p1n2 = p1x_4**2 + p1z_4**2
            cos3 = (p1n2 - a2**2 - a3**2) / (2 * a2 * a3)
            if abs(cos3) > 1:
                continue
            base_t3 = np.arccos(np.clip(cos3, -1, 1))
            for elbow_sign in (+1, -1):
                theta3 = elbow_sign * base_t3

                # === Krok 5: θ₂ (z układu liniowego K·c2 - M·s2 = p1x, ...) ===
                c3, s3 = np.cos(theta3), np.sin(theta3)
                K  = a2 + a3 * c3
                Mt = a3 * s3
                theta2 = np.arctan2(K * p1z_4 - Mt * p1x_4,
                                    K * p1x_4 + Mt * p1z_4)

                # === Krok 6: θ₄ (z elementu T_3_4) ===
                T12 = link_transform(1, theta2)
                T23 = link_transform(2, theta3)
                T03 = T01 @ T12 @ T23
                T34 = inv_se3(T03) @ T_target @ inv_se3(T56) @ inv_se3(T45)
                theta4 = np.arctan2(-T34[0, 1], T34[0, 0])

                solutions.append((theta1, theta2, theta3, theta4, theta5, theta6))

    return solutions`}
          />
          <p>
            <strong>Co warto zauważyć:</strong> kolejność wyprowadzania współrzędnych
            jest <em>algebraicznie wymuszona</em> — najpierw θ₁ z geometrii rzutu, potem
            θ₅ i θ₆ z analizy macierzy <M tex="{}^6T_1" />, dopiero na końcu θ₃, θ₂, θ₄
            z numerycznie wyliczonej <M tex="{}^4T_1" />. To <em>inna</em> kolejność niż
            klasyczna dekompozycja 3+3 Pumy z M1 — bo geometria ES5 (forma B) wymaga
            innego rozdzielenia.
          </p>
        </section>

        <section className="prose-ik">
          <h2>Referencyjna implementacja w TypeScript</h2>
          <p>
            Powyższy algorytm Python jest 1:1 przetłumaczony do TypeScriptu jako{" "}
            <code>src/lib/solvers/analytical-es5.ts</code> w aplikacji. Wersja TS jest
            używana w playgroundzie poniżej (interaktywne wyznaczanie 8 rozwiązań na
            żywo). Przechodzi smoke test FK→IK→FK na 5 konfiguracjach z błędem
            maszynowej precyzji (~10⁻¹⁵ rad).
          </p>
          <PythonStep
            label="TypeScript"
            caption="API solvera ES5 w aplikacji"
            code={`# Uruchom test:
npx tsx src/lib/solvers/__es5_smoke.ts

# Użycie:
import { solveEs5Analytical } from "@/lib/solvers/analytical-es5";
import { forwardKinematics } from "@/lib/robots/dh";
import { ES5 } from "@/lib/robots/es5";

const target = forwardKinematics(ES5, [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
const solutions = solveEs5Analytical(target);
// solutions: do 8 rozwiązań z gałęziami shoulder/elbow/wrist`}
          />
        </section>

        <section className="prose-ik">
          <h2>Interaktywny playground — ES5 + 8 rozwiązań IK</h2>
          <p>
            Playground ma dwa równoległe stany:
          </p>
          <ul>
            <li>
              <strong>q (kąty przegubów)</strong> — sterowane sliderami po
              prawej. Robot 3D pokazuje aktualną konfigurację.
            </li>
            <li>
              <strong>T* (poza docelowa)</strong> — wpisywana w panelu „Poza
              docelowa" jako pozycja (x, y, z) i orientacja RPY. Solver liczy
              IK z T*, pokazując wszystkie konfiguracje, którymi można trafić
              w tę pozę.
            </li>
          </ul>
          <p>
            Wskaźnik <em>TCP odbiega od T* o ... mm</em> mówi czy aktualne q
            faktycznie trafia w T*. Kliknięcie wiersza w tabeli rozwiązań ładuje
            wybraną gałąź do sliderów — robot ustawia się tam i wskaźnik staje się
            zielony.
          </p>
          <p>
            <strong>Eksperymenty do wypróbowania:</strong>
          </p>
          <ul>
            <li>
              Wpisz pozycję <code>z = 0.05</code> (TCP nisko nad podłożem) —
              większość rozwiązań prawdopodobnie odpadnie (poza zasięgiem
              ramienia w dół). Zobaczysz krótszą listę albo komunikat „brak
              rozwiązań".
            </li>
            <li>
              Kliknij <strong>← zrzut FK(q)</strong>, potem przesuń sliderem
              θ₅ blisko 0 i ponownie zrób zrzut — wokół tej pozy gałęzie wrist
              (flip/noflip) zaczynają się <em>zlewać</em>: ta sama orientacja
              osiągalna z różnymi θ₄ i θ₆. To <strong>singularność
              nadgarstka</strong>.
            </li>
            <li>
              Kliknij wiersz „shoulder=left" — robot „obraca się dookoła osi 1"
              w symetryczną konfigurację. Ten sam TCP, zupełnie inna postawa
              ramienia.
            </li>
            <li>
              Kliknij wiersz „elbow=down" — łokieć ląduje pod linią bark↔nadgarstek.
              W praktyce takie konfiguracje są rzadziej używane przemysłowo
              (mniej ergonomiczne, większe ryzyko kolizji z otoczeniem).
            </li>
          </ul>
          <Es5IkPlayground />
        </section>

        <section className="prose-ik">
          <h2>Co dalej</h2>
          <ul>
            <li>
              Solver ES5 (<code>analytical-es5.ts</code>) jest gotowy — może
              być teraz wpięty do{" "}
              <a href="/modules/6-benchmark" className="text-[var(--accent)] underline">M6 (Benchmark)</a>{" "}
              jako drugi analityk obok Pumy.
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
