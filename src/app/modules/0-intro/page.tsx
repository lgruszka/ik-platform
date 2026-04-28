import { ModuleHeader } from "@/components/ui/module-header";
import { Puma560Playground } from "@/components/robot/puma560-playground";
import { MathBlock, Math } from "@/components/ui/math";
import { CommonsImage } from "@/components/walkthrough/commons-image";

export default function Module0() {
  return (
    <>
      <ModuleHeader slug="0-intro" />
      <div className="px-8 py-8 max-w-5xl space-y-10">
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
                <td>Pieper, Paul, PoE / Paden-Kahan</td>
                <td>Dokładne, szybkie (µs), wszystkie rozwiązania</td>
                <td>Nie każdy robot spełnia warunek Piepera</td>
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
