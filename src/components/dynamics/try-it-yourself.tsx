import type { ReactNode } from "react";

type ExperimentProps = {
  title: string;
  setup: ReactNode;
  expected: ReactNode;
  whyItMatters: ReactNode;
};

function Experiment({ title, setup, expected, whyItMatters }: ExperimentProps) {
  return (
    <details className="rounded border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 px-4 py-2 my-3 not-prose group">
      <summary className="cursor-pointer font-semibold text-sm py-1 text-purple-700 dark:text-purple-300 list-none flex items-center gap-2">
        <span className="inline-block w-5 text-center">▸</span>
        <span className="inline-block px-1.5 py-0.5 rounded bg-purple-500 text-white text-[10px] uppercase tracking-wide">
          spróbuj sam
        </span>
        {title}
      </summary>
      <div className="prose-ik max-w-none mt-3 pl-7 text-sm space-y-2">
        <p><strong>Ustaw w playgroundzie:</strong> {setup}</p>
        <p><strong>Co powinieneś zaobserwować:</strong> {expected}</p>
        <p className="text-[var(--muted)]">{whyItMatters}</p>
      </div>
    </details>
  );
}

/**
 * Trzy zadania samodzielne dla studenta. Wszystkie do wykonania w playgroundzie
 * ES5 z modułu 9 (manipulacja sliderami q, q̇, q̈, obserwacja TorqueDisplay
 * i TorqueDecompositionChart). Każde uczy konkretnego aspektu dynamiki.
 */
export function TryItYourself() {
  return (
    <section className="prose-ik">
      <h3>Spróbuj sam — trzy eksperymenty w playgroundzie</h3>
      <p>
        Każdy eksperyment poniżej to konkretne polecenie do wykonania w sekcji
        „Laboratorium" wyżej. Rozwiń, ustaw odpowiednie wartości i porównaj
        swoje obserwacje z opisem.
      </p>

      <Experiment
        title="Eksperyment 1 — jak rośnie wkład dynamiki względem statyki"
        setup={
          <>
            Wróć do playgroundu. Ustaw <em>q</em> w pozycji „ramię w bok poziomo"
            (q₂ ≈ 90°, reszta 0). Suwakiem <strong>skala q̇</strong> pod wykresem
            słupkowym przesuwaj od 0× do 5×.
          </>
        }
        expected={
          <>
            Przy 0× widzisz samą statykę — czerwone słupki τ_grawit dominują, τ₂
            największy (ramię w polu grawitacji). Powyżej 2× niebieskie słupki
            (τ_dynam) rosną kwadratowo i przy 3–4× przewyższają statykę dla τ₁
            i τ₃. τ₂ pozostaje dominowany przez grawitację, bo dla typowej
            konfiguracji ramienia siła grawitacji jest stała, a wkład dynamiki
            zależy od q̇².
          </>
        }
        whyItMatters={
          <>
            <strong>Dlaczego to ważne:</strong> w przemysłowych sterownikach
            często stosuje się tzw. gravity compensation — feedforward
            kompensujący tylko grawitację. Działa dobrze dla ruchów wolnych
            (q̇ &lt; 1 rad/s), zawodzi dla agresywnych (q̇ &gt; 3 rad/s) gdzie
            potrzebny jest pełen model Newton-Eulera, jak w kroku 7
            (computed-torque).
          </>
        }
      />

      <Experiment
        title="Eksperyment 2 — efekt żyroskopowy bez przegubowych przyspieszeń"
        setup={
          <>
            W playgroundzie ustaw <em>q</em> = home, wszystkie q̈ na 0.
            Podnieś tylko q̇₁ do 5 rad/s. Obserwuj τ₃, τ₄, τ₅ w TorqueDisplay.
            Zwiększaj stopniowo q̇₂ od 0 do 3 rad/s.
          </>
        }
        expected={
          <>
            Mimo że żaden przegub nie ma przyspieszenia, momenty napędowe
            τ₃, τ₄, τ₅ rosną nieproporcjonalnie do q̇₂. To{" "}
            <strong>człon żyroskopowy</strong> <em>ω×(I·ω)</em> z eq. (6.15) —
            górne ogniwa „czują" obrót podstawy (q̇₁) skomponowany z obrotem
            własnym (q̇₂) jako moment prostopadły do obu osi.
          </>
        }
        whyItMatters={
          <>
            <strong>Dlaczego to ważne:</strong> przy projektowaniu nadgarstków
            cobotów (np. końcówek z szybkimi obrotami narzędzia) efekty
            żyroskopowe są dominującym źródłem nieliniowości. Pomijanie ich
            w sterowniku daje błąd śledzenia rosnący kwadratowo z q̇.
          </>
        }
      />

      <Experiment
        title="Eksperyment 3 — wyłącz grawitację (matematycznie)"
        setup={
          <>
            Nie da się wyłączyć grawitacji w UI, ale można symulować jej brak:
            ustaw <em>q</em> tak, że robot leży poziomo na boku (q₂ = 0, q₃ = 0 —
            ramię „płasko"). Ustaw q̇₁ = 1 rad/s, q̈₁ = 0. Czytaj τ_dynam
            (niebieska kolumna w TorqueDisplay).
          </>
        }
        expected={
          <>
            τ_dynam pokazuje czysty wkład bezwładności+Coriolisa,
            odseparowany od grawitacji. Powinien być rzędu kilku Nm — duża
            część to człony odśrodkowe ω×(ω×p), proporcjonalne do{" "}
            <M_const tex="\dot q_1^2" />. Sprawdź: zwiększ q̇₁ do 2 rad/s i
            zobacz że τ_dynam wzrasta ~4× (kwadrat od skalarnego skalowania
            prędkości).
          </>
        }
        whyItMatters={
          <>
            <strong>Dlaczego to ważne:</strong> w robotach kosmicznych (np.
            ramię ISS) brak grawitacji oznacza że <em>cała</em> dynamika to
            człony bezwładnościowe — projektowanie sterowników wymaga
            innego strojenia niż dla robotów naziemnych.
          </>
        }
      />
    </section>
  );
}

// Mini wrapper na M (Math) — żeby nie importować całego komponentu
// dla pojedynczego użycia w expected. (Inaczej musielibyśmy zmienić
// na "use client".)
function M_const({ tex }: { tex: string }) {
  return <code className="text-xs">{tex}</code>;
}
