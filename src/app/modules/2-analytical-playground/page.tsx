import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { TargetPoseInput } from "@/components/walkthrough/target-pose-input";
import { BranchSelector } from "@/components/playground/branch-selector";
import { AllBranchesViewer } from "@/components/playground/all-branches-viewer";
import { ResidualsTable } from "@/components/playground/residuals-table";
import { TrajectoryDemo } from "@/components/playground/trajectory-demo";
import { Puma560Playground } from "@/components/robot/puma560-playground";

export default function Module2() {
  return (
    <>
      <ModuleHeader slug="2-analytical-playground" />
      <div className="px-8 py-8 max-w-5xl space-y-10">

        <section className="prose-ik">
          <h2>Cel modułu</h2>
          <p>
            Moduł 1 wyprowadzał rozwiązanie zamknięte punkt po punkcie. Tu
            celem jest <em>operacyjne zapanowanie</em> nad zbiorem rozwiązań:
            zobaczyć jednocześnie, jak kombinacje znaków gałęzi{" "}
            <M tex="(\mathrm{shoulder}, \mathrm{elbow}, \mathrm{wrist}) \in \{\pm\}^3" />{" "}
            manifestują się jako osiem różnych poz ramienia osiągających tę
            samą pozę efektora — i przekonać się, co się dzieje, gdy robot
            ślizga się po trajektorii między konfiguracjami, w których część
            gałęzi znika.
          </p>
          <h3>Przypomnienie: struktura mnogości rozwiązań</h3>
          <ul>
            <li>
              <strong>shoulder ∈ {'{'}right, left{'}'}:</strong> znak{" "}
              <M tex="\rho = \pm\sqrt{p_x^2 + p_y^2 - d_3^2}" />. Odpowiada
              wyborowi, czy bark „patrzy" w kierunku celu, czy odwraca się o{" "}
              <M tex="\approx 180°" />.
            </li>
            <li>
              <strong>elbow ∈ {'{'}up, down{'}'}:</strong> znak{" "}
              <M tex="\pm\sqrt{L^2 - K^2}" /> w prawie cosinusów. Łokieć
              zgięty „w górę" (zwyczajowo) lub „w dół".
            </li>
            <li>
              <strong>wrist ∈ {'{'}noflip, flip{'}'}:</strong> znak{" "}
              <M tex="\sin q_5" />. Odpowiada obrotowi nadgarstka o <M tex="\pi" />.
            </li>
          </ul>
          <p>
            Dla niektórych par (shoulder, elbow) dyskryminant łokcia <M tex="L^2 - K^2" /> bywa ujemny — cel jest poza osiągalnością tej kombinacji, a w zbiorze znajduje się mniej niż 8 rozwiązań.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Wszystkie gałęzie jednocześnie</h2>
          <p className="text-[var(--muted)]">
            Sterownik po lewej generuje pozę docelową (<em>zrzut z kontrolera</em> kopiuje bieżące <M tex="T_0^{6}" /> robota sterowanego ręcznie). Poniżej 8 rozwiązań pokazanych jednocześnie — każde innym kolorem, zgodnie z legendą w selektorze gałęzi. Punkt czerwony = wspólny cel TCP.
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <Puma560Playground height={380} />
            <div className="space-y-4">
              <TargetPoseInput />
              <BranchSelector />
            </div>
          </div>
          <AllBranchesViewer />
          <ResidualsTable />
          <p className="text-xs text-[var(--muted)]">
            Kolumny ‖Δp‖ i ΔR to residuum walidacyjne: norma różnicy pozycji [m] oraz kąt obrotu między <M tex="R_{FK}(q)" /> a <M tex="R^*" /> [rad]. Dla rozwiązania analitycznego wartości są rzędu <M tex="10^{-14}" /> — błąd precyzji zmiennoprzecinkowej, nie metody.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Ciągłość rozwiązań przy ruchu po trajektorii</h2>
          <p className="text-[var(--muted)]">
            Każda gałąź definiuje ciągłą funkcję{" "}
            <M tex="q_{\text{branch}}: \mathrm{dom} \to Q" />, ale jej dziedzina — fragment przestrzeni kartezjańskiej, w którym gałąź zachowuje sens — jest ograniczona. Na granicy dziedziny{" "}
            <M tex="L^2 - K^2 \to 0" />, dwa rozwiązania łokcia zlewają się w jedno, a prędkość przegubowa{" "}
            <M tex="\dot q" /> dąży do nieskończoności (singularność barku/łokcia). Na trajektorii widać to jako „zatrzymanie" niektórych gałęzi i pojawienie się innych.
          </p>
          <TrajectoryDemo/>
        </section>

        <section className="prose-ik">
          <h2>Zasada selekcji rozwiązania w praktyce</h2>
          <p>
            Gdy solver zwraca zbiór rozwiązań, sterownik robota musi wybrać
            <em>jedno</em>. Klasyczna heurystyka — minimalizacja przemieszczenia
            przegubowego względem bieżącej konfiguracji:
          </p>
          <MathBlock tex="q^* = \arg\min_{q \in \mathcal{S}(T^*)} \; \sum_{i=1}^{6} w_i \cdot \mathrm{wrap}_\pi(q_i - q_i^{\text{curr}})^2" />
          <p>
            gdzie <M tex="\mathcal{S}(T^*)" /> to zbiór 8 (lub mniej)
            rozwiązań, a <M tex="w_i" /> — wagi per przegub (często{" "}
            <M tex="w_i = 1" />, ale można penalizować duże obroty bazy).
          </p>
          <p>
            Funkcja <M tex="\mathrm{wrap}_\pi" /> to <strong>zawinięcie kąta
            do przedziału</strong> <M tex="(-\pi, \pi]" />. Formalnie:
          </p>
          <MathBlock tex="\mathrm{wrap}_\pi(x) \;=\; x - 2\pi\,\left\lfloor \tfrac{x + \pi}{2\pi} \right\rfloor" />
          <p>
            Dlaczego jej używamy? Kąty <M tex="q" /> i <M tex="q + 2\pi" /> to
            <em>ten sam</em> fizyczny obrót przegubu, ale bez zawinięcia ich
            różnica wynosiłaby <M tex="2\pi" /> i przykłamała minimalizację.
            Np. zwykła różnica <M tex="(170^\circ) - (-170^\circ) = 340^\circ" />,
            ale rzeczywisty „najkrótszy ruch" między tymi położeniami to
            <M tex="20^\circ" /> — i dopiero po zawinięciu do{" "}
            <M tex="(-\pi, \pi]" /> dostajemy poprawną wartość.
          </p>
          <p>Kryteria dodatkowe selekcji rozwiązania:</p>
          <ul>
            <li>Ograniczenia przegubowe — odrzuć rozwiązania spoza dopuszczalnego zakresu.</li>
            <li>Kolizje z otoczeniem (checker zewnętrzny).</li>
            <li>Odległość od singularności — maksymalizuj{" "}
              <M tex="|\det J|" /> lub miarę Yoshikawy <M tex="w = \sqrt{\det(J J^\top)}" />.</li>
            <li>Płynność trajektorii — kara za zmianę gałęzi między kolejnymi punktami trajektorii.</li>
          </ul>
          <p>
            Żadne z tych kryteriów nie jest częścią właściwego IK — to
            post-processing, który przenosimy na poziom planowania ruchu.
          </p>

          <h2>Synteza</h2>
          <p>
            Kluczowa obserwacja tego modułu: <strong>rozwiązanie zamknięte
            jest dokładne, ale wielokrotne</strong>. Sterownik, który ślepo
            bierze pierwsze rozwiązanie z listy — lub wybiera je przez
            porównanie z aktualnymi <M tex="q" /> bez zawijania kątów do{" "}
            <M tex="(-\pi, \pi]" /> — wygeneruje skokowe, nieciągłe
            trajektorie. W modułach 3–4 zobaczymy, jak solvery iteracyjne
            (Jakobianowe, optymalizacyjne) z zasady generują jedną, ciągłą
            gałąź — kosztem dokładności i odporności na singularności.
          </p>
        </section>
      </div>
    </>
  );
}
