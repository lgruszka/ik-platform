import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M } from "@/components/ui/math";
import { BenchmarkRunner } from "@/components/benchmark/benchmark-runner";

export default function Module6() {
  return (
    <>
      <ModuleHeader slug="6-benchmark" />
      <div className="px-8 py-8 max-w-5xl space-y-8">

        <section className="prose-ik">
          <h2>Jak tu mierzymy?</h2>
          <p>
            Każdy solver otrzymuje <strong>ten sam zbiór testowy</strong>:{" "}
            <M tex="N" /> losowych (ale deterministycznych — ziarno RNG jawne)
            konfiguracji <M tex="q_\text{true}" /> w ograniczeniach przegubowych,
            po czym FK generuje odpowiadające pozy <M tex="T^*" />. Jako seed
            dla solverów iteracyjnych podajemy{" "}
            <M tex="q_\text{seed} = q_\text{true} + \boldsymbol{\delta}" /> (drobny
            szum) — to realistyczna sytuacja w przemyśle: planer daje
            konfigurację <em>w przybliżeniu</em>, a solver dopina do celu.
          </p>
          <p>
            Mierzone wartości:
          </p>
          <ul>
            <li><strong>Success rate</strong> — odsetek przypadków, dla których solver zbiega w tolerancji 1 mm / 0,57° (TOL_LIN = 10⁻³ m, TOL_ANG = 10⁻² rad).</li>
            <li><strong>Czas</strong> — średnia, mediana, 95. percentyl (wskazuje ogon powolnych przypadków).</li>
            <li><strong>Liczba iteracji</strong> (tylko dla iteracyjnych).</li>
            <li><strong>Residua końcowe</strong> — ‖Δp‖ i ΔR (median).</li>
          </ul>
          <p>
            Wykres nie liczy iteracji na osi x, bo metody mają różne definicje
            iteracji (Nelder-Mead liczy ewaluacje simpleksa, DLS — kroki LM).
            Czas wallclock jest lepszym wspólnym mianownikiem.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Uruchom benchmark</h2>
          <BenchmarkRunner />
        </section>

        <section className="prose-ik">
          <h2>Typowe wnioski</h2>
          <ul>
            <li>
              <strong>Solver analityczny</strong> wygrywa bezdyskusyjnie dla
              Pumy: 100% success, &lt; 0,05 ms na przypadek, residuum na
              poziomie precyzji <M tex="10^{-15}" />. To punkt odniesienia dla
              każdej innej metody — jeśli druga jest gorsza, ma być za to{" "}
              <em>bardziej elastyczna</em> (pracuje dla dowolnego robota).
            </li>
            <li>
              <strong>DLS</strong> bije pseudoinwersję w stabilności, jest
              zaledwie o ~30% wolniejszy i ma znacznie lepszy tail (p95).
              To praktyczny standard.
            </li>
            <li>
              <strong>Jacobian Transpose</strong> eksponuje swoją słabą zbieżność
              — często wpada w 2000 iter bez trafienia tolerancji. Pokazujemy
              go jako pedagogiczne minimum, nie jako zalecaną metodę.
            </li>
            <li>
              <strong>Nelder-Mead</strong> jest odporny i dość szybki (kilka ms),
              ale jego mediana residuum jest zwykle o 1–2 rzędy wielkości gorsza
              niż DLS — kosztem elastyczności na niegładkie cele.
            </li>
            <li>
              <strong>Gradient descent</strong> — najgorszy z iteracyjnych; bez
              drugiego rzędu (BFGS, L-BFGS) nie skaluje się dla IK. Pokazujemy
              jako edukacyjne zestawienie.
            </li>
          </ul>

          <h2>Na co uważać przy własnych benchmarkach</h2>
          <ul>
            <li>
              <strong>Obciążenie JIT</strong> — pierwsze uruchomienie w V8
              kompiluje i optymalizuje hot paths; daj solverowi „warm-up".
            </li>
            <li>
              <strong>Sprawiedliwy seed</strong> — <em>wszystkie</em> solvery
              muszą startować z tego samego seeda. Inaczej porównanie nie ma
              sensu (analityczny nie używa seeda, reszta tak).
            </li>
            <li>
              <strong>Cross-branch convergence</strong> — solver iteracyjny może
              zbiec do innej gałęzi niż <M tex="q_\text{true}" />, osiągając
              tę samą pozę. W naszym teście sukcesem jest zgodność pozy, nie
              zgodność w przestrzeni konfiguracji.
            </li>
            <li>
              <strong>Distribution shift</strong> — benchmark z losowych{" "}
              <M tex="q" /> daje „łatwe" pozy (w środku zbioru osiągalnego).
              Aby znaleźć trudne przypadki, trzeba próbkować z okolic
              singularności lub granicy osiągalności; inaczej benchmark
              przeceni solvery.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
