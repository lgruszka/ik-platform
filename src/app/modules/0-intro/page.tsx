import { ModuleHeader } from "@/components/ui/module-header";
import { Puma560Playground } from "@/components/robot/puma560-playground";
import { MathBlock, Math } from "@/components/ui/math";
import { CommonsImage } from "@/components/walkthrough/commons-image";

export default function Module0() {
  return (
    <>
      <ModuleHeader slug="0-intro" />
      <div className="px-8 py-8 max-w-5xl space-y-10">

        {/* === SEKCJA 1: PO CO IK? — motywacja zanim wchodzimy w matematykę === */}
        <section className="prose-ik">
          <h2>Po co właściwie potrzebujemy odwrotnej kinematyki?</h2>
          <p>
            Wyobraź sobie, że pokazujesz palcem punkt w przestrzeni i mówisz
            robotowi: „chwyć to". Człowiek robi to bez myślenia — mózg
            automatycznie znajduje konfigurację ramienia, dłoni i palców. Robot
            potrzebuje <strong>tłumacza</strong> między „gdzie ma być końcówka" a
            „jakie kąty muszą przyjąć przeguby" — i tym tłumaczem jest właśnie
            algorytm kinematyki odwrotnej (IK).
          </p>
          <p>
            Bez IK żadna z poniższych aplikacji nie działa:
          </p>
          <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
            <UseCase
              icon="⚙️"
              title="Programowanie ścieżki przemysłowej"
              body={`Spawanie karoserii, lakierowanie, montaż PCB. Inżynier projektuje ścieżkę w przestrzeni 3D (CAD); IK przelicza ją na sekwencję konfiguracji przegubów. Bez tego programowanie byłoby ręczne — przegub po przegubie.`}
            />
            <UseCase
              icon="✋"
              title="Lead-through teaching"
              body={`Operator prowadzi rękę cobota (np. UR, Franka) do pozycji, naciska „zapisz”. Robot zapamiętuje nie tylko pozę końcówki, ale całą konfigurację — IK jest niezbędne by odtworzyć ruch z innej startowej pozycji.`}
            />
            <UseCase
              icon="🥽"
              title="Teleoperacja / VR"
              body={`Chirurg porusza joystickiem; robot da Vinci w ciele pacjenta podąża. Rękawica VR steruje awatarem. Każdy ruch dłoni → pose w SE(3) → IK robota → kąty silników. Latencja musi być < 20 ms.`}
            />
            <UseCase
              icon="📦"
              title="Pick-and-place z wizją"
              body={`Kamera wykrywa pozycję paczki na taśmie → IK liczy konfigurację → robot chwyta. Kluczowe w logistyce (Amazon, DHL) i sortowniach żywności. Wymaga IK uruchamianego setki razy na sekundę.`}
            />
            <UseCase
              icon="🎮"
              title="Animacja postaci w grach"
              body={`Postać podnosi przedmiot, otwiera drzwi, opiera rękę o ścianę. Inverse Kinematics w silnikach gier (Unreal, Unity) ustawia ramię, żeby dłoń trafiła w cel — bez ręcznej animacji każdego klatki.`}
            />
            <UseCase
              icon="🦾"
              title="Robotyka kosmiczna i podwodna"
              body={`Ramię na Międzynarodowej Stacji Kosmicznej (Canadarm2) albo na ROV-ie. Operator widzi tylko widok z kamery; klika punkt w przestrzeni; IK przekształca to na ruch przegubów w stanie nieważkości / pod wodą.`}
            />
          </div>
          <p>
            Każda z tych aplikacji ma własne wymagania: szybkość (gry, VR),
            niezawodność (medycyna), powtarzalność (przemysł). Stąd różne
            metody IK — i stąd ten moduł. <em>Nie ma jednego algorytmu „najlepszego" —
            jest algorytm najlepszy do Twojego problemu.</em>
          </p>
        </section>

        {/* === SEKCJA 2: CZYM JEST PUMA 560 — historia + dlaczego dydaktyczna === */}
        <section className="prose-ik">
          <h2>Czym jest PUMA 560 i dlaczego cały kurs jej używa?</h2>
          <p>
            Wszystkie moduły 0–7 pracują na jednym konkretnym robocie:{" "}
            <strong>PUMA 560</strong>. Wybór nie jest przypadkowy — to{" "}
            <em>klasyczny</em> manipulator, którego każdy podręcznik robotyki
            używa jako modelu referencyjnego. Krótko, dlaczego:
          </p>

          <CommonsImage
            src="/images/ik/puma-spherical-wrist.jpg"
            alt="PUMA 560 — robot przemysłowy o sześciu stopniach swobody, klasyczny obiekt badawczy w robotyce"
            caption="PUMA 560 w laboratorium NASA Ames Research Center (1990). Charakterystyczny kształt antropomorficzny: ramię, łokieć, sferyczny nadgarstek — geometria odpowiadająca ludzkiej ręce, dzięki czemu wzory IK dają się wyprowadzić ręcznie."
            author="NASA / Dominic Hart"
            license="Public Domain"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Puma_Robotic_Arm_-_GPN-2000-001817.jpg"
            height={380}
          />

          <h3>Krótka historia</h3>
          <ul>
            <li>
              <strong>1969</strong> — Victor Scheinman buduje na Uniwersytecie Stanforda
              „Stanford Arm" (poprzednik PUMA), pierwszy elektryczny manipulator komputerowo
              sterowany przeznaczony do prac montażowych.
            </li>
            <li>
              <strong>1978</strong> — firma Unimation (założona przez Josepha Engelbergera,
              „ojca robotyki") wprowadza komercyjnie <em>PUMA</em> —{" "}
              <em>Programmable Universal Machine for Assembly</em>. Główny klient: General Motors,
              z myślą o linii montażowej.
            </li>
            <li>
              <strong>Lata 80.–90.</strong> — dominacja na liniach motoryzacyjnych w USA i Europie.
              Setki tysięcy sztuk w produkcji.
            </li>
            <li>
              <strong>Dzisiaj</strong> — wycofana z produkcji nowych jednostek, ale pozostaje{" "}
              <strong>kanonicznym przykładem dydaktycznym</strong> w każdym podręczniku robotyki
              (Craig, Spong, Siciliano, Murray–Li–Sastry). Niemal każda praca o IK manipulatora
              6-DOF pokazuje wyniki na Pumie.
            </li>
          </ul>

          <h3>Dlaczego idealna jako przykład dydaktyczny</h3>
          <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
            <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm">
              <p className="font-semibold mb-1">🎯 Spełnia formę A warunku Piepera</p>
              <p className="text-[var(--muted)] mb-0">
                Osie trzech ostatnich przegubów przecinają się w jednym punkcie (środek
                nadgarstka). Dzięki temu IK rozpada się na dwa łatwiejsze podproblemy 3-DOF:
                pozycja i orientacja. <em>Da się wyprowadzić ręcznie</em> w jeden wykład.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm">
              <p className="font-semibold mb-1">🧬 Geometria antropomorficzna</p>
              <p className="text-[var(--muted)] mb-0">
                Bark (q₁ — obrót talii, q₂ — podniesienie), łokieć (q₃), nadgarstek sferyczny
                (q₄ q₅ q₆) — odwzorowuje strukturę ludzkiego ramienia. Intuicje geometryczne
                z własnego ciała przekładają się 1:1 na konfiguracje robota.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm">
              <p className="font-semibold mb-1">📐 8 rozwiązań na każdą pozę</p>
              <p className="text-[var(--muted)] mb-0">
                shoulder L/R × elbow up/down × wrist flip/no-flip. Idealna ilustracja
                <em> wielokrotności rozwiązań IK</em> — fundamentalnej trudności, której
                nie da się obejść w żadnym manipulatorze 6-DOF.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm">
              <p className="font-semibold mb-1">⚠️ Wszystkie pułapki na małym przykładzie</p>
              <p className="text-[var(--muted)] mb-0">
                Singularności (oś 1 nad bazą, gimbal lock w nadgarstku), problemy wyboru
                gałęzi rozwiązania, ograniczenia zasięgu. Wszystko widać dla 6 osi — łatwiej
                niż na 7-DOF France czy redundantnych ramionach kosmicznych.
              </p>
            </div>
          </div>

          <p>
            <strong>Co robimy w innych modułach:</strong> M9–M11 (dynamika, silnik DC, dobór
            napędów) korzystają z robota <a href="/modules/9-dynamics">ES5 z dysertacji
            [Gruszka 2024]</a> — ma inną geometrię (forma B Piepera, równoległe osie q₂q₃q₄),
            ale algorytmy dynamiki działają identycznie. Pokazujemy więc <em>dwa</em> przykłady
            obok siebie.
          </p>
        </section>

        {/* === SEKCJA 3: MAPA MODUŁÓW — jak korzystać dla różnych odbiorców === */}
        <section className="prose-ik">
          <h2>Jak korzystać z tej aplikacji — mapa modułów</h2>
          <p>
            Aplikacja zawiera 11 modułów, ale nie wszystkie są równie ważne dla każdego.
            Poniżej trzy ścieżki dla różnych odbiorców — wybierz tę, która pasuje do
            Twoich celów:
          </p>

          <div className="not-prose space-y-3 my-4">
            <PathCard
              role="🎓 Student ZBR / podstawowy kurs robotyki"
              goal="Zrozumieć IK od podstaw, umieć rozwiązać dla manipulatora 6-DOF, znać klasyfikację metod"
              path={[
                { slug: "0-intro", num: "0", title: "Wprowadzenie (jesteś tutaj)" },
                { slug: "1-analytical-walkthrough", num: "1", title: "Wyprowadzenie analityczne Pumy" },
                { slug: "2-analytical-playground", num: "2", title: "Playground 8 rozwiązań" },
                { slug: "8-orientations", num: "8", title: "Reprezentacje orientacji (Eulera, kwaterniony)" },
                { slug: "7-singularities", num: "7", title: "Singularności — co się psuje i dlaczego" },
              ]}
              time="≈3-4 godziny lektury liniowej"
            />
            <PathCard
              role="🔬 Doktorant / researcher IK numerycznej"
              goal="Porównać metody iteracyjne, optymalizacyjne i uczone na wspólnym benchmarku"
              path={[
                { slug: "3-jacobian", num: "3", title: "Metody Jakobianowe (Transpose, DLS, SDLS)" },
                { slug: "4-optimization", num: "4", title: "Metody optymalizacyjne (Nelder-Mead, SQP)" },
                { slug: "5-neural", num: "5", title: "Sieci neuronowe (MLP, MDN, IKFlow)" },
                { slug: "6-benchmark", num: "6", title: "Wspólny benchmark dla wszystkich solverów" },
                { slug: "7-singularities", num: "7", title: "Analiza singularności (det J, manipulability)" },
              ]}
              time="≈5-6 godzin · materiał na seminarium grupy badawczej"
            />
            <PathCard
              role="🛠️ Inżynier projektowy / R&D producenta robotów"
              goal="Od kinematyki do decyzji zakupowej — wybór silników i przekładni"
              path={[
                { slug: "9-dynamics", num: "9", title: "Dynamika odwrotna (Newton-Euler) — wyliczenie τ" },
                { slug: "10-energy", num: "10", title: "Silnik DC i energia napędów" },
                { slug: "11-drive-sizing", num: "11", title: "Dobór napędów — pipeline projektowy" },
              ]}
              time="≈2-3 godziny · pakiet decyzji projektowych"
            />
          </div>

          <p>
            <strong>Wszystkie moduły działają jako referencja</strong> — wracaj do nich
            wybiórczo gdy potrzebujesz konkretnego wzoru, wyprowadzenia albo przykładu liczbowego.
            Każdy moduł zawiera <em>ściągę formuł</em> na końcu i co najmniej jeden{" "}
            <em>wzorzec liczbowy</em>, który możesz sprawdzić we własnej implementacji.
          </p>
        </section>

        {/* === REZSZTA: dotychczasowa treść matematyczna === */}
        <section className="prose-ik">
          <h2>Od kinematyki prostej do odwrotnej</h2>
          <p>
            Manipulator o <em>n</em> stopniach swobody opisuje odwzorowanie{" "}
            <Math tex="f: Q \to SE(3)" />, gdzie{" "}
            <Math tex="Q \subset \mathbb{R}^n" /> to przestrzeń konfiguracji
            (wektory wartości przegubów), a <Math tex="SE(3)" /> — grupa
            transformacji sztywnych 3D opisujących pozę efektora. Kinematyka
            prosta (FK) oblicza{" "}
            <Math tex="T_0^{n} = f(q_1,\dots,q_n)" /> bezpośrednio z iloczynu
            macierzy transformacji kolejnych ogniw:
          </p>
          <MathBlock tex="T_0^{n}(q) \;=\; {}^{0}\!T_1(q_1) \cdot {}^{1}\!T_2(q_2) \cdot \dots \cdot {}^{n-1}\!T_n(q_n)." />
          <p>
            Problem odwrotny (IK) polega na wyznaczeniu{" "}
            <Math tex="q \in Q" /> takiego, że{" "}
            <Math tex="f(q) = T^*" />, gdzie <Math tex="T^*" /> to zadana poza.
            Jest on zasadniczo trudniejszy: nieliniowy, wielokrotnie
            zdegenerowany, a często nieposiadający rozwiązania analitycznego.
            Poniższy diagram zestawia obie kierunki rozumowania:
          </p>
          <CommonsImage
            src="/images/ik/fk-vs-ik.png"
            alt="Kinematyka prosta vs odwrotna — porównanie kierunku obliczeń"
            caption="Kinematyka prosta (FK): kąty przegubów → poza efektora. Kinematyka odwrotna (IK): poza efektora → kąty. FK zawsze ma jednoznaczne rozwiązanie; IK często nie."
            author="Haendy-freak"
            license="CC BY-SA 4.0"
            sourceUrl="https://commons.wikimedia.org/wiki/File:FWDvsINV_Kinematics_HighResTransp.png"
            licenseUrl="https://creativecommons.org/licenses/by-sa/4.0/"
            height={300}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Manipulacja interaktywna — Puma560</h2>
          <p className="text-[var(--muted)]">
            Poniższy panel renderuje robota Puma560 z jego tabelą parametrów DH
            (modified / Craig). Suwaki po prawej sterują wartościami przegubów{" "}
            <Math tex="q_1, \dots, q_6" />. Triady pokazują układy współrzędnych
            każdego ogniwa — to te same układy współrzędnych, na których opiera się każdy z
            solverów IK w kolejnych modułach.
          </p>
          <Puma560Playground />
        </section>

        <section className="prose-ik">
          <h2>Nie tylko Puma — różne typy manipulatorów</h2>
          <p>
            Większość modułów koncentruje się na klasycznym manipulatorze{" "}
            <strong>przegubowym</strong> (anthropomorphic, articulated) —
            sześć przegubów obrotowych w łańcuchu szeregowym (typowy układ
            Puma560, Fanuc R-2000, ABB IRB). Ale w przemyśle istnieje cała
            rodzina innych konstrukcji, każda z własną charakterystyką i
            podejściem do IK:
          </p>
          <ul>
            <li><strong>SCARA</strong> (Selective Compliance Articulated Robot Arm) — cztery osie, dwa pierwsze obroty w płaszczyźnie poziomej, jeden ruch wzdłuż Z, jedna rotacja narzędzia. Idealny do montażu PCB i przenoszenia.</li>
            <li><strong>Delta</strong> — równoległy, trzy ramiona połączone u góry, ruch translacyjny TCP. Bardzo szybki (pick-and-place), ale małą przestrzeń roboczą.</li>
            <li><strong>Kartezjański (gantry)</strong> — trzy osie translacyjne, prostokątna przestrzeń robocza. IK trywialne (każda oś niezależna), ale duże gabaryty.</li>
            <li><strong>Cylindryczny / sferyczny</strong> — historyczne układy, ograniczone zastosowania.</li>
          </ul>
          <CommonsImage
            src="/images/ik/scara-manipulator.svg"
            alt="Schemat manipulatora SCARA"
            caption="Manipulator SCARA — 4 osie, 2 obrotowe w płaszczyźnie XY, jedna translacyjna w Z, jedna obrotowa narzędzia. IK ma znacznie prostsze wzory niż Puma."
            author="EBatlleP"
            license="CC BY-SA 4.0"
            sourceUrl="https://commons.wikimedia.org/wiki/File:SCARA_manipulator_representation.svg"
            licenseUrl="https://creativecommons.org/licenses/by-sa/4.0/"
            height={300}
          />
          <p>
            Każdy z tych typów ma <em>specyficzne</em> wzory IK — często
            znacznie prostsze niż dla Pumy. Metody iteracyjne (Jakobianowe,
            optymalizacyjne) z modułów 3–4 są <strong>uniwersalne</strong> —
            działają niezależnie od typu konstrukcji.
          </p>
        </section>

        <section className="prose-ik">
          <h2>Kluczowe trudności IK</h2>
          <ol>
            <li>
              <strong>Wielokrotność rozwiązań.</strong> Dla typowego
              przemysłowego manipulatora 6-DOF (Puma, Fanuc, ABB) istnieje do{" "}
              <strong>ośmiu</strong> konfiguracji osiągających tę samą pozę —
              <em> shoulder L/R</em>, <em>elbow up/down</em>, <em>wrist flip</em>.
              Solver musi wybrać jedną, np. najbliższą bieżącej konfiguracji.
            </li>
            <li>
              <strong>Osiągalność.</strong> Zbiór poz osiągalnych jest ograniczony
              (workspace) — zadanie poza nim nie ma rozwiązania.
            </li>
            <li>
              <strong>Singularności.</strong> W punktach, w których jakobian
              traci rząd (np. przy{" "}
              <Math tex="q_5 = 0" /> w nadgarstku sferycznym), solver numeryczny
              rozbiega się albo traci stabilność; rozwiązanie zamknięte w tym
              miejscu jest ciągłe, ale kierunek ruchu nadgarstka staje się
              niejednoznaczny.
            </li>
            <li>
              <strong>Ograniczenia przegubowe i kolizje.</strong> Matematyczne
              rozwiązanie może być fizycznie nierealizowalne.
            </li>
          </ol>
        </section>

        <section className="prose-ik">
          <h2>Klasyfikacja metod IK</h2>
          <table>
            <thead>
              <tr>
                <th>Kategoria</th>
                <th>Reprezentanci</th>
                <th>Zalety</th>
                <th>Wady</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Analityczne (zamknięte)</td>
                <td>Pieper, Paul, PoE / Paden-Kahan, Raghavan-Roth</td>
                <td>Dokładne, szybkie (µs), wszystkie rozwiązania</td>
                <td>Wymagają ręcznego wyprowadzenia dla każdej rodziny robotów; trudniejsze geometrie wymagają zaawansowanych metod (rezultanty, równanie 16. stopnia)</td>
              </tr>
              <tr>
                <td>Jakobianowe (iteracyjne)</td>
                <td>Transpose, Pseudoinverse, DLS, SDLS</td>
                <td>Dowolny robot, płynne trajektorie</td>
                <td>Singularności, rozbieżność, lokalne minima</td>
              </tr>
              <tr>
                <td>Optymalizacyjne</td>
                <td>Nelder–Mead, SQP, CMA-ES</td>
                <td>Dowolne cele i ograniczenia</td>
                <td>Wolne, wrażliwe na parametry</td>
              </tr>
              <tr>
                <td>Uczące się</td>
                <td>MLP, MDN, IKFlow, diffusion</td>
                <td>Wielomodalne, uczą się niejawnej struktury</td>
                <td>Koszt treningu, ekstrapolacja, niepewność</td>
              </tr>
              <tr>
                <td>Hybrydowe</td>
                <td>NN→DLS warm-start, learned Jacobian</td>
                <td>Najczęściej najlepszy kompromis w praktyce</td>
                <td>Złożoność implementacji</td>
              </tr>
            </tbody>
          </table>
          <p>
            W kolejnych modułach każda z tych rodzin jest omówiona osobno — z
            wyprowadzeniem, implementacją referencyjną i porównaniem na tym
            samym zbiorze testowych poz.
          </p>
        </section>
      </div>
    </>
  );
}

/* ───────────────────────── pomocnicze komponenty ───────────────────────── */

function UseCase({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <p className="font-semibold mb-1 flex items-center gap-2">
        <span className="text-xl" aria-hidden>{icon}</span>
        <span>{title}</span>
      </p>
      <p className="text-sm text-[var(--muted)] mb-0">{body}</p>
    </div>
  );
}

type PathStep = { slug: string; num: string; title: string };

function PathCard({
  role, goal, path, time,
}: { role: string; goal: string; path: PathStep[]; time: string }) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      <p className="font-semibold mb-1">{role}</p>
      <p className="text-sm text-[var(--muted)] mb-3">{goal}</p>
      <ol className="space-y-1 list-none pl-0 mb-3">
        {path.map((s, i) => (
          <li key={s.slug} className="flex items-baseline gap-2 text-sm">
            <span className="font-mono text-[var(--muted)] tabular-nums w-6">{i + 1}.</span>
            <span className="font-mono text-[var(--muted)] text-xs px-1.5 py-0.5 rounded bg-[var(--code-bg)] mr-1">
              M{s.num}
            </span>
            <a href={`/modules/${s.slug}`} className="text-[var(--accent)] underline hover:no-underline">
              {s.title}
            </a>
          </li>
        ))}
      </ol>
      <p className="text-xs text-[var(--muted)] italic mb-0">{time}</p>
    </div>
  );
}
