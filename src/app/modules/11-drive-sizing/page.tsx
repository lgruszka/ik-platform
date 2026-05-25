import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { DesignPipelineFlowchart } from "@/components/drive-sizing/design-pipeline";
import { DriveSizingCalculator } from "@/components/drive-sizing/drive-sizing-calculator";
import { TnCurveChart } from "@/components/drive-sizing/tn-curve-chart";
import { MotorCatalogTable } from "@/components/drive-sizing/motor-catalog-table";
import { InertiaBandwidthCheck } from "@/components/drive-sizing/inertia-bandwidth-check";

export default function Module11() {
  return (
    <>
      <ModuleHeader slug="11-drive-sizing" />
      <div className="px-8 py-8 max-w-5xl space-y-8">
        <section className="prose-ik">
          <h2>O czym jest ten moduł</h2>
          <p>
            Moduły <a href="/modules/9-dynamics">M9 (dynamika odwrotna)</a> i{" "}
            <a href="/modules/10-energy">M10 (silnik DC i energia)</a> dały nam
            wszystkie liczby potrzebne by odpowiedzieć na praktyczne pytanie
            projektowe: <strong>jaki silnik+przekładnię kupić</strong> dla każdej
            osi naszego robota? Ten moduł zamyka tę pętlę — od wymagań
            wynikających z dynamiki, przez czteropozycyjną specyfikację
            konstrukcyjną, do konkretnego modelu z katalogu producenta.
          </p>
          <p>
            Dlaczego to ważne: dobór napędów jest jedną z <em>najczęściej źle
            wykonywanych</em> decyzji w projektowaniu robotów. Typowe błędy: dobór
            wyłącznie po momencie maksymalnym (a silnik przegrzewa się od ciągłego
            obciążenia), pomijanie inercji (regulator nie nadąża), wybór jednego
            silnika dla wszystkich osi (na nadgarstku za duży, na barku za mały).
            Wszystkie te pułapki da się uniknąć patrząc na <strong>cztery
            metryki naraz</strong> i porównując z obwiednią T-N silnika.
          </p>
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 my-4 text-sm">
            <p className="font-semibold mb-1">Co wynika z tego modułu</p>
            <p className="text-[var(--muted)] mb-0">
              Po przerobieniu tego modułu student potrafi: (1) wyznaczyć z trajektorii
              cztery metryki projektowe, (2) dobrać konkretny silnik z przekładnią
              z katalogu Maxon/Kollmorgen/Harmonic Drive zachowując odpowiedni
              margines bezpieczeństwa, (3) sprawdzić czy bezwładność zredukowana
              nie ogranicza pasma regulatora, (4) uzasadnić wybór w dokumentacji
              projektowej — czyli kompetencje, których pierwsza praca inżynierska
              po obronie zwykle wymaga w pierwszym tygodniu.
            </p>
          </div>
        </section>

        <StepPanel number={1} title="Pipeline projektowy — od trajektorii do katalogu">
          <p>
            Dobór napędu to <strong>iteracyjny proces 6-krokowy</strong>, w którym
            wynik nie jest pojedynczą liczbą, tylko zbiorem wymagań, które
            należy krzyżowo zweryfikować z katalogiem producenta. Schemat
            poniżej pokazuje cały flow z pętlą iteracyjną na końcu:
          </p>
          <DesignPipelineFlowchart />
          <p>
            Każdy z 6 kroków jest niezależną decyzją inżynierską: <em>krok 1</em>{" "}
            to wybór reprezentatywnej trajektorii (worst-case cyklu eksploatacyjnego —
            nie średni przypadek!). <em>Krok 2</em> to mechaniczna aplikacja
            Newton-Eulera z M9. <em>Krok 3</em> agreguje czasowy przebieg <M tex="\tau(t)" />{" "}
            do 4 niezależnych liczb. <em>Kroki 4–6</em> to praca z katalogiem
            producenta + weryfikacja końcowa. Iteracja: jeśli żaden model się
            nie mieści — wracamy do <em>kroku 1</em> i zmieniamy trajektorię
            (mniejsza prędkość, mniejszy payload) <em>albo</em> do projektu
            mechanicznego (lżejsze ogniwa, lepsza dystrybucja masy).
          </p>
        </StepPanel>

        <StepPanel number={2} title="4 metryki konstrukcyjne — przypomnienie z M9">
          <p>
            Tematykę wprowadziliśmy w <a href="/modules/9-dynamics#drive-sizing">module 9</a>;
            tu krótkie przypomnienie i kontekstualizacja dla katalogu.
            Z <M tex="\tau(t)" /> i <M tex="\dot q(t)" /> wyciągamy 4 niezależne
            wymagania:
          </p>
          <div className="overflow-x-auto">
            <table className="text-sm w-full my-3">
              <thead>
                <tr className="border-b border-[var(--panel-border)]">
                  <th className="text-left py-2 pr-3">Metryka</th>
                  <th className="text-left py-2 pr-3">Wzór</th>
                  <th className="text-left py-2">Karta katalogowa — kolumna</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
                <tr>
                  <td className="py-2 pr-3 font-semibold text-red-600 dark:text-red-400">τ_peak</td>
                  <td className="py-2 pr-3"><M tex="\max_t |\tau(t)|" /></td>
                  <td className="py-2"><em>Peak torque</em> / <em>Max momentary torque</em></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-orange-600 dark:text-orange-400">τ_rms</td>
                  <td className="py-2 pr-3"><M tex="\sqrt{\tfrac1T\int_0^T\tau^2 dt}" /></td>
                  <td className="py-2"><em>Continuous torque</em> / <em>Nennmoment</em></td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-sky-600 dark:text-sky-400">q̇_peak</td>
                  <td className="py-2 pr-3"><M tex="\max_t |\dot q(t)|" /></td>
                  <td className="py-2"><em>Max output speed</em> (po przekładni)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-purple-600 dark:text-purple-400">P_peak</td>
                  <td className="py-2 pr-3"><M tex="\max_t |\tau \dot q|" /></td>
                  <td className="py-2"><em>Peak power</em> / drivera + zasilacza</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>Margines bezpieczeństwa.</strong> Wymagania z modelu zawsze
            mnożymy przez współczynnik <M tex="k \in [1.3, 2.0]" /> — bo:
            (a) parametry inercji z CAD mają błąd 10–30%, (b) tarcie i straty
            energetyczne dochodzą z M10, (c) trajektoria w rzeczywistości
            może być agresywniejsza niż zaplanowana (zaburzenia, kolizje),
            (d) starzenie silnika obniża jego osiągi z czasem (~10% po 5 latach).
            W tym module używamy <M tex="k = 1.5" /> jako rozsądny default.
          </p>
        </StepPanel>

        <StepPanel number={3} title="Kalkulator doboru — wybierz silnik i sprawdź marginesy">
          <p>
            Główny widget tego modułu: wybierz scenariusz (trajektorię), payload,
            konkretny napęd ES5 do oszacowania, oraz proponowany model z
            katalogu — system pokaże 4 niezależne walidacje i zsumuje werdykt:
          </p>
          <DriveSizingCalculator />
        </StepPanel>

        <StepPanel number={4} title="Krzywa T-N — jak trajektoria wpasowuje się w obwiednię silnika">
          <p>
            Wizualizacja <em>par</em> <M tex="(\dot q(t), |\tau(t)|)" />
            naniesionych jako punkty na krzywej moment-prędkość silnika.
            Każdy silnik ma dwa „obszary bezpieczeństwa": zielony{" "}
            <em>continuous</em> (dopuszczalna praca ciągła) i pomarańczowy{" "}
            <em>peak</em> (dopuszczalne tylko krótkotrwale, sekundy):
          </p>
          <TnCurveChart />
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 my-3 not-prose text-sm">
            <p className="font-semibold mb-1">Pułapka: punkt po punkcie OK, ale całość nie</p>
            <p className="text-[var(--foreground)] mb-0">
              Nawet jeśli każdy punkt mieści się w obwiedni, należy sprawdzić ile
              czasu spędza on w obszarze peak. Termiczna stała czasowa BLDC to
              typowo <strong>30–120 sekund</strong> — przekroczenie wartości
              ciągłej przez 1s jest OK, ale przez 60s spowoduje przegrzanie nawet
              gdy punkt jest „we środku" peak region. Dlatego <M tex="\tau_\text{rms}" />{" "}
              jest tu kluczowe — sumuje to po całej trajektorii.
            </p>
          </div>
        </StepPanel>

        <StepPanel number={5} title="Cross-reference do realnych katalogów">
          <p>
            Konkretne modele z 3 producentów silników (Maxon, Kollmorgen, Allied
            Motion) sparowane z przekładniami harmonicznymi Harmonic Drive.
            Wartości z publicznych kart katalogowych. Kolumna „pasuje do τ_i"
            jest automatycznie wyliczana dla scenariusza pick-and-place
            z payloadem 2 kg i marginesem 1.5×:
          </p>
          <MotorCatalogTable />
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm">
            <p className="font-semibold mb-2">Praktyczne reguły cobotowe (5–15 kg payload)</p>
            <ul className="list-disc pl-5 space-y-1 text-[var(--foreground)] mb-0">
              <li><strong>Osie 1+2 (baza, bark)</strong> — klasa L, ~85–110 Nm continuous, ~230–320 Nm peak. Dominują grawitacją + bezwładnością całego ramienia.</li>
              <li><strong>Osie 3+4 (łokieć, przedramię)</strong> — klasa M, ~28–32 Nm continuous, ~70–95 Nm peak.</li>
              <li><strong>Osie 5+6 (nadgarstek, kołnierz)</strong> — klasa S, ~6–11 Nm continuous, ~17–33 Nm peak. Tu liczy się też niska masa zespołu — dorzucona masa rekursywnie zwiększa wymagania osi pod nimi.</li>
              <li><strong>Typowy budżet napędów dla cobota 5kg:</strong> 2× klasa L (~14 000 €) + 2× klasa M (~7000 €) + 2× klasa S (~4 000 €) = ~25 000 € za sam zespół napędowy. Dlaczego coboty są drogie.</li>
            </ul>
          </div>
        </StepPanel>

        <StepPanel number={6} title="Sanity check: bezwładność zredukowana i pasmo regulatora">
          <p>
            Dobór samego momentu i prędkości to nie wszystko. Trzeba jeszcze
            sprawdzić, że bezwładność zredukowana do wału silnika nie ogranicza
            osiągalnego pasma regulatora pozycyjnego. Reguła kciuka:
          </p>
          <MathBlock tex="J_{\text{red}} = J_{\text{rotor}} + \frac{J_{\text{load}}}{n^2}, \qquad \omega_{bw} \approx \sqrt{\frac{K_p}{J_{\text{red}}}}" />
          <p>
            Przekładnia o przełożeniu <M tex="n" /> <strong>kwadratowo redukuje</strong>{" "}
            bezwładność widzianą z silnika. Stąd istnieje optymalne{" "}
            <M tex="n_\text{opt} = \sqrt{J_\text{load} / J_\text{rotor}}" />{" "}
            (impedance matching), przy którym pasmo regulatora jest największe.
            Praktycznie: typowe przekładnie harmoniczne 50–160 są w okolicach
            tego optimum dla manipulatorów cobotowych.
          </p>
          <InertiaBandwidthCheck />
        </StepPanel>

        <section className="prose-ik">
          <h2>Checklist projektowy — przed kupnem napędu</h2>
          <p>Praktyczna lista kontrolna, którą warto przejść przed złożeniem zamówienia:</p>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 not-prose text-sm">
            <ol className="list-decimal pl-5 space-y-2 text-[var(--foreground)]">
              <li>
                <strong>Trajektoria worst-case zdefiniowana?</strong> — nie średni,
                tylko najbardziej obciążający przypadek. Z payloadem górnego limitu,
                ekstremalnym zasięgiem, maks. prędkością. Najlepiej kilka takich
                trajektorii, każda obciąża inną oś krytycznie.
              </li>
              <li>
                <strong>Wykonano NE i wyciągnięto 4 metryki per napęd?</strong> —
                τ_peak, τ_rms, q̇_peak, P_peak. Sprawdzono dla każdej z worst-case
                trajektorii. Weź MAKSIMUM po wszystkich scenariuszach.
              </li>
              <li>
                <strong>Margines 1.5× zachowany?</strong> — capability silnika /
                requirement ≥ 1.5 dla wszystkich 4 metryk. Mniej = ryzyko (zmiany
                parametrów, starzenie, błąd modelu inercji).
              </li>
              <li>
                <strong>T-N curve — wszystkie punkty pracy w obwiedni?</strong> —
                ważne gdy P_peak pojawia się w momencie gdzie ω jest duża. Niektóre
                silniki mają „nawias" obwiedni — dla wysokich ω moment max maleje.
              </li>
              <li>
                <strong>J_red sprawdzone?</strong> — pasmo regulatora ≥ 20 Hz
                (typowy minimum dla robotyki). Jeśli niskie — rozważ większą
                przekładnię albo silnik z mniejszym J_rotor.
              </li>
              <li>
                <strong>Termika sprawdzona dla cyklu?</strong> — τ_rms z kroku 2
                powinno być &lt; τ_cont z karty. Jeśli planowane są długie cykle
                bez przerw — dodaj dodatkową rezerwę termiczną (×1.2).
              </li>
              <li>
                <strong>Energia cyklu i zasilanie?</strong> — czy zasilacz / bateria
                wytrzymają chwilowe P_peak we wszystkich napędach jednocześnie
                (worst case wszystkie razem)? Czy mamy odpowiedni rezystor hamujący
                dla regeneracji?
              </li>
              <li>
                <strong>Masa zespołu i wpływ na sąsiednie osie?</strong> — dorzucona
                masa silnika na osi 5 zwiększa wymagania dla osi 4. Iteracja
                wsteczna: nowy wybór napędu → nowe inercje → nowe NE → nowe wymagania
                dla wcześniejszych osi.
              </li>
            </ol>
          </div>
        </section>

        <section className="prose-ik">
          <h2>Co dalej</h2>
          <p>
            Wszystkie powyższe wartości policzyliśmy <em>idealizując</em> silnik
            jako generator momentu. W rzeczywistości silnik ma swoją własną
            dynamikę elektromagnetyczną (stała czasowa indukcyjności), straty
            (Joule + magnesowanie + tarcie wewnętrzne), a przekładnia harmoniczna
            ma sprawność zależną od obciążenia. Tym wszystkim zajmuje się{" "}
            <a href="/modules/10-energy">moduł 10</a> — który dodaje do τ ostatnią
            warstwę: <strong>prąd, moc elektryczną, energię cyklu</strong>.
            Razem M9+M10+M11 dają pełen pipeline od kinematyki przez dynamikę po
            decyzję zakupową — czyli to, czego od inżyniera robotyki wymaga
            pierwsza praca po obronie dyplomu.
          </p>
        </section>
      </div>
    </>
  );
}
