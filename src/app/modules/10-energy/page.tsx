import { ModuleHeader } from "@/components/ui/module-header";
import { Math as M, MathBlock } from "@/components/ui/math";
import { StepPanel } from "@/components/walkthrough/step-panel";
import { MotorSchematic } from "@/components/dynamics/motor-schematic";
import { EfficiencyChart } from "@/components/dynamics/efficiency-chart";
import { PowerEnergyChart } from "@/components/dynamics/power-energy-chart";
import { CheatSheetM10 } from "@/components/dynamics/cheat-sheet-m10";

export default function Module10() {
  return (
    <>
      <ModuleHeader slug="10-energy" />
      <div className="px-8 py-8 max-w-5xl space-y-8">

        <section className="prose-ik">
          <h2>O czym jest ten moduł</h2>
          <p>
            W <strong>module 9</strong> wyznaczyliśmy wektor momentów napędowych{" "}
            <M tex="\boldsymbol\tau = (\tau_1, \dots, \tau_6)" /> dla zadanej
            trajektorii. To moment <em>mechaniczny</em> — siła obrotowa, którą
            silnik <em>musi</em> wytworzyć w przegubie. Tu kontynuujemy łańcuch
            transformacji: od momentu mechanicznego, przez przekładnię harmoniczną,
            do silnika DC, do mocy chwilowej, do <strong>energii pobranej w cyklu
            transportowym</strong> (eq. 6.23 [Gruszka, dysertacja 2024]).
          </p>
          <p>
            Łańcuch wygląda tak:
          </p>
          <MathBlock tex="\tau_i \;\xrightarrow{/(η_r\,n)}\; \tau_{m,i} \;\xrightarrow{/k_T}\; i_i \;\xrightarrow{R_t i + k_e \omega_m}\; u_i \;\xrightarrow{u\cdot i}\; P_i \;\xrightarrow{\int dt}\; E" />
          <p>
            Każdy z tych kroków wprowadza <em>straty energetyczne</em> — w
            przekładni (η_r &lt; 1), w uzwojeniu (i²·R), w polu magnetycznym
            (zaniedbywane). Energia pobrana z baterii to suma:
          </p>
          <ul>
            <li>
              <strong>Mechaniczna praca</strong> przeciw grawitacji i bezwładności (zwykle 30–60% całości).
            </li>
            <li>
              <strong>Straty termiczne</strong> w uzwojeniu (i²·R) — proporcjonalne do kwadratu prądu.
            </li>
            <li>
              <strong>Straty w przekładni</strong> — tarcie suche i wiskotyczne, zależne od η_r(ω, τ).
            </li>
          </ul>
          <p>
            Ten model umożliwia <strong>off-line optymalizację</strong> trajektorii pod
            kątem zużycia energii — kluczowa metryka w przemyśle, gdzie robot
            wykonuje dziesiątki tysięcy cykli dziennie. Optymalizacja jest
            tematem rozdz. 7–8 dysertacji [Gruszka 2024].
          </p>
        </section>

        <StepPanel number={1} title="Przekładnia harmoniczna i jej sprawność">
          <p>
            Manipulatory używają <strong>przekładni harmonicznych</strong>{" "}
            (Harmonic Drive) — zwartych, lekkich, o wysokim ratio (50:1 ÷ 200:1).
            Konstrukcja: trzy elementy mechaniczne — sztywne <em>circular spline</em> (zewnętrze),
            elastyczne <em>flexspline</em> (wewnętrze), i <em>wave generator</em> deformujący flexspline
            do owalu — produkują efektywną redukcję prędkości przez „chodzące" zazębienie.
          </p>
          <p>
            Z punktu widzenia modelu energetycznego ważne są dwie wartości:
          </p>
          <MathBlock tex="\omega_{m,i} = n_i \cdot \dot\theta_i \qquad\text{(silnik kręci się } n\times\text{ szybciej niż przegub)}" />
          <MathBlock tex="\tau_{m,i} = \frac{\tau_i}{\eta_{r,i} \cdot n_i} \qquad\text{(eq. 6.19)}" />
          <p>
            Sprawność <M tex="\eta_r" /> nie jest stała — zależy od <em>zarówno</em>{" "}
            prędkości obrotowej wału wejściowego silnika, jak i obciążenia momentu.
            W dysertacji aproksymowano ją wielomianem 5. stopnia z 4 krzywymi
            referencyjnymi (Tab. 6.4):
          </p>
          <EfficiencyChart />
          <p>
            <strong>Co warto zauważyć:</strong> przy małych obciążeniach (10–20%
            nominalnego) sprawność spada do 25–40% — bo straty stałe (tarcie wirnika,
            prąd magnesujący) dominują nad pożyteczną mocą. Dla optymalnej energetycznie
            pracy chcemy obciążenia ~60–80% nominalnego — tu η najwyższe.
          </p>
        </StepPanel>

        <StepPanel number={2} title="Model elektromechaniczny silnika DC (eq. 6.21–6.22)">
          <p>
            Silnik prądu stałego z magnesami trwałymi jest w pełni opisany dwoma
            równaniami: <strong>moment proporcjonalny do prądu</strong> oraz{" "}
            <strong>napięcie według prawa Kirchhoffa</strong>:
          </p>
          <MathBlock tex="\tau_{m,i} = k_{T,i} \cdot i_i" />
          <MathBlock tex="u_i = R_{t,i} \cdot i_i + L_i\,\frac{di_i}{dt} + k_{e,i} \cdot \omega_{m,i}" />
          <p>
            Pierwsze równanie pochodzi z prawa Ampera (siła Lorentza działająca na
            uzwojenie tworznika w polu magnetycznym). Drugie to bilans napięć w
            obwodzie wirnika: spadek napięcia na rezystancji uzwojenia +
            indukcyjny + siła elektromotoryczna (EMF) wirnika obracającego się w
            polu magnesów.
          </p>
          <p>
            W modelu uproszczonym (quasi-statyczny) pomijamy{" "}
            <M tex="L\,di/dt" /> — dla manipulatorów składowa indukcyjna stanowi
            zwykle &lt;5% napięcia, bo stała czasowa elektryczna L/R ~ 1 ms vs
            mechaniczna 10–100 ms. Pełen model dynamiczny silnika dodawałby
            jeden stan (prąd) w równaniach ruchu.
          </p>
          <p>
            <strong>Pobaw się sliderami</strong> — manipuluj parametrami i obserwuj jak
            zmienia się prąd, moment na wale i moc chwilowa:
          </p>
          <MotorSchematic />
        </StepPanel>

        <StepPanel number={3} title="Moc chwilowa i jej składowe">
          <p>
            Moc pobierana przez silnik z baterii to po prostu{" "}
            <M tex="P_i = u_i \cdot i_i" />. Ten iloczyn można rozłożyć na trzy
            fizyczne składowe (podstawiając{" "}
            <M tex="u_i" /> z eq. 6.22 i pomijając L·di/dt):
          </p>
          <MathBlock tex="P_i = u_i\,i_i = (R_t i_i + k_e \omega_m)\,i_i = \underbrace{R_t i_i^2}_{\text{straty termiczne}} + \underbrace{k_e \omega_m i_i}_{\text{moc mechaniczna}}" />
          <p>
            Stosując <M tex="\tau_m = k_T i" /> i <M tex="k_e \approx k_T" />{" "}
            (równość w SI), drugi człon <M tex="k_e \omega_m i = \tau_m \omega_m" /> to{" "}
            <strong>moc mechaniczna na wale silnika</strong>. Pierwszy człon —
            kwadratowo zależny od prądu — to <strong>straty cieplne</strong> w uzwojeniu.
          </p>
          <p>
            Wniosek pedagogiczny: dla danej wymaganej mocy mechanicznej
            (<M tex="\tau \cdot \dot\theta" />), straty termiczne rosną
            <em> kwadratowo</em> z prądem. Dlatego silniki dimensiowane „na zapas"
            często mają większe <M tex="k_T" /> i niższy potrzebny prąd —
            zamiast tej samej mocy mechanicznej, ale ciepło spada o czynnik k_T².
          </p>
        </StepPanel>

        <StepPanel number={4} title="Energia cyklu transportowego (eq. 6.23)">
          <p>
            Energia całkowita pobrana w okresie <M tex="[0, t_r]" /> przez wszystkie
            6 napędów to suma całek mocy chwilowej:
          </p>
          <MathBlock tex="\boxed{\;E = \sum_{i=1}^{6} \int_0^{t_r} u_i(t) \cdot i_i(t) \, dt\;}" />
          <p>
            W implementacji numerycznej: zbieramy <M tex="(u_i, i_i)" /> w dyskretnych
            punktach czasu (dt = 10–20 ms), liczymy moc <M tex="P_i = u_i \cdot i_i" />,
            i sumujemy trapezoidalną całkę. To bardzo proste — koszt obliczeniowy
            zdominowany jest przez forward+backward sweep Newton-Eulera (M9), nie
            przez sam model silnika.
          </p>
          <p>
            <strong>Eksperyment optymalizacyjny</strong> — ten sam ruch (q₂ od 0 do π/3
            i z powrotem) dla 4 różnych czasów trwania trajektorii:
          </p>
          <PowerEnergyChart />
          <p>
            <strong>Niemonotoniczność</strong> energii w funkcji czasu — bardzo ważna
            obserwacja. Zbyt szybko: rosnące <M tex="\tau_{\text{dyn}}" /> ~ kwadratowo
            z prędkością → wysokie <M tex="i^2 R" /> → ogromne straty cieplne. Zbyt wolno:
            dłuższe trzymanie pod grawitacją → liniowy wzrost energii statycznej.
            Optimum jest <em>gdzieś pośrodku</em> — wyznaczanie tego optimum to
            klasyczny problem optymalizacji jednokryterialnej.
          </p>
        </StepPanel>

        <StepPanel number={5} title="Ograniczenia modelu i co jeszcze warto wiedzieć">
          <p>
            Model z eq. 6.21–6.23 jest <em>najprostszą sensowną</em> reprezentacją
            energii manipulatora — wystarczająco dokładny dla optymalizacji
            off-line, ale ma pewne ograniczenia, które warto znać:
          </p>
          <ul>
            <li>
              <strong>Brak rekuperacji</strong> — bierzemy <M tex="|P|" /> bo zakładamy,
              że bateria/zasilacz nie odbierają mocy zwrotnej. W praktyce wiele kontrolerów
              robotów ma rezystory hamujące, które zamieniają ujemną moc na ciepło —
              z punktu widzenia poboru z sieci wynik ten sam (energia "zniknęła" w cieple).
            </li>
            <li>
              <strong>Stałe parametry silnika</strong> — <M tex="k_T, k_e" /> traktujemy
              jako niezmienne. W rzeczywistości zależą od temperatury (uzwojenie się
              rozszerza, opór rośnie ~0.4%/°C dla miedzi), pola magnetycznego (saturacja
              przy wysokich prądach), i geometrii (wibracje, luzy).
            </li>
            <li>
              <strong>Brak modelu inercji wirnika silnika</strong> — pomijamy inercję
              samego wirnika dodaną do dynamiki przegubu. Dla dużych ratio przekładni
              (101:1) odbiera się jako <M tex="J_{\text{rotor}} \cdot n^2 \approx 10000 \cdot J" />,
              co dla typowego silnika BLDC daje 10–50 g·cm² = 10⁻⁴ kg·m² — dla nadgarstka
              5–10% rzeczywistej inercji ogniwa (odsuwa próg q̈ przy którym moment dynamiczny
              dominuje). Można to dodać do <M tex="I_{Ci}" /> w module 9.
            </li>
            <li>
              <strong>Brak strat w sterowniku</strong> — falownik PWM ma sprawność
              ~95%, którą tu przyjmujemy 100%. Dla precyzyjnych pomiarów dorzucić
              współczynnik η_inv globalnie.
            </li>
          </ul>
          <p>
            Mimo tych uproszczeń model dał w dysertacji <strong>weryfikację
            eksperymentalną</strong> z błędem ~5–10% względem rzeczywistego
            poboru energii (rozdz. 9 dysertacji), co jest świetnym wynikiem dla
            modelu analitycznego bez pomiarów temperaturowych ani identyfikacji
            online.
          </p>
        </StepPanel>

        <section className="prose-ik">
          <h2>Ściąga formuł</h2>
          <p>
            Wszystkie kluczowe równania łańcucha τ → P → E zebrane razem.
          </p>
          <CheatSheetM10 />
        </section>

        <section className="prose-ik">
          <h2>Co dalej</h2>
          <p>
            Mając model energii jako funkcję trajektorii <M tex="\boldsymbol q(t)" />,
            naturalnie rodzi się pytanie: <em>jak zaplanować trajektorię tak, żeby
            E było minimalne</em>? To problem <strong>optymalizacji</strong> — ze
            zmiennymi decyzyjnymi w przestrzeni krzywych q(t), z ograniczeniami
            (limity przegubów, kolizje, czas wykonania, ograniczenia τ_max silnika),
            i funkcją celu <M tex="\min \int u\cdot i \, dt" />.
          </p>
          <p>
            Rozdz. 7–8 dysertacji [Gruszka 2024] pokazują takie sformułowanie z{" "}
            <em>blendingiem wielomianowym n-tego rzędu</em> jako parametryzacją
            trajektorii i optymalizacją wielokryterialną (czas + energia + koszt
            ekonomiczny). Wykraczamy tu poza zakres aplikacji edukacyjnej —
            zainteresowani odsyłani do pracy źródłowej.
          </p>
        </section>
      </div>
    </>
  );
}
