import { Math as M, MathBlock } from "@/components/ui/math";

/**
 * Pełne ręczne wyprowadzenie dynamiki Newton-Euler dla 2R planarnego manipulatora.
 *
 * Model: dwa jednorodne pręty (masa m_i, długość L_i) połączone przegubami
 * obrotowymi w pionowej płaszczyźnie. Wszystkie obroty wokół osi z (poziomej,
 * prostopadłej do płaszczyzny ruchu). Grawitacja w kierunku -y.
 *
 * Cel: pokazać studentowi WSZYSTKIE iloczyny wektorowe rozpisane krok po
 * kroku — zanim spojrzy na pełne 6-DOF ES5 z `<NumericalExampleM9 />`.
 * Po przerobieniu tego przykładu wszystkie wzory w krokach 2–5 stają się
 * zrozumiałe „bo widziałem to dla małego przypadku".
 *
 * Konwencja w tym przykładzie: grawitacja DODANA JAWNIE jako siła -m·g·ŷ
 * w środku masy (NIE sztuczka Craig'a) — żeby student widział grawitację
 * w jednym konkretnym miejscu, nie rozsianą po a_i. Algorytmicznie równoważne.
 */
export function TwoLinkPlanarWorkedExample() {
  return (
    <div className="space-y-6">
      <section className="prose-ik">
        <h3>Wzorzec ręczny — 2R planarny manipulator</h3>
        <p>
          Zanim zaufamy pełnemu algorytmowi 6-DOF dla ES5, przeliczmy całość
          „na piechotę" dla najmniejszego nietrywialnego przypadku:{" "}
          <strong>dwa ogniwa, obroty w jednej płaszczyźnie, oś z prostopadła
          do tej płaszczyzny</strong>. To klasyczny model z każdego podręcznika
          robotyki (Spong, Murray–Li–Sastry, Siciliano) i daje się rozpisać
          ręcznie w ~15 wzorach.
        </p>
      </section>

      <TwoRPlanarDiagram />

      <section className="prose-ik">
        <h4>Parametry modelu</h4>
        <ul>
          <li>Ogniwo <em>i</em> ∈ {"{1, 2}"}: jednorodny pręt o masie <M tex="m_i" /> i długości <M tex="L_i" />.</li>
          <li>Środek masy <M tex="\mathbf{p}_{Ci} = \tfrac{L_i}{2}\,\hat{x}_i" /> (połowa długości w lokalnym układzie ogniwa).</li>
          <li>
            Tensor bezwładności wokół osi z przez środek masy:{" "}
            <M tex="I_C = \tfrac{1}{12}\,m_i\,L_i^2" /> (pozostałe składowe nie wpłyną na ruch w płaszczyźnie xy).
          </li>
          <li>Konfiguracja: <M tex="q_1, q_2" /> — kąty obrotu obu przegubów. Prędkości i przyspieszenia: <M tex="\dot q_1, \dot q_2, \ddot q_1, \ddot q_2" />.</li>
          <li>Grawitacja: <M tex="\mathbf{g} = -g\,\hat{y}" /> z <M tex="g = 9{,}81\,\mathrm{m/s^2}" /> (kierunek -y).</li>
        </ul>
        <p>
          <strong>Uproszczenia notacyjne:</strong> wszystkie wektory wyrażam w bazie
          globalnej (jedna płaszczyzna xy → 2 składowe wystarczą; trzecia, z,
          będzie zerowa dla translacji i pełna dla rotacji). Pomijam lewe górne
          indeksy — w 2D z jednym wspólnym układem nie są potrzebne.
        </p>
        <p>
          Oznaczenia skrótowe: <M tex="c_i \equiv \cos q_i" />,{" "}
          <M tex="s_i \equiv \sin q_i" />, <M tex="c_{12} \equiv \cos(q_1+q_2)" />,{" "}
          <M tex="s_{12} \equiv \sin(q_1+q_2)" />.
        </p>
      </section>

      <ForwardSweepDerivation />
      <BackwardSweepDerivation />
      <SanityCheckSection />
    </div>
  );
}

/* --------------------------- Diagram ----------------------------- */

function TwoRPlanarDiagram() {
  const W = 540, H = 320;
  // Pose dla rysunku: q1 = 30°, q2 = 50°
  const q1 = Math.PI / 6;
  const q2 = (50 * Math.PI) / 180;
  const L1 = 140, L2 = 110;
  const base = { x: 90, y: 240 };
  const j2 = { x: base.x + L1 * Math.cos(-q1), y: base.y + L1 * Math.sin(-q1) };
  const tip = { x: j2.x + L2 * Math.cos(-(q1 + q2)), y: j2.y + L2 * Math.sin(-(q1 + q2)) };
  const c1 = { x: (base.x + j2.x) / 2, y: (base.y + j2.y) / 2 };
  const c2 = { x: (j2.x + tip.x) / 2, y: (j2.y + tip.y) / 2 };
  // arc dla q1
  const r = (n: number) => Math.round(n * 100) / 100;
  return (
    <div className="not-prose my-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-white">
        {/* osie */}
        <line x1={20} y1={base.y} x2={W - 20} y2={base.y} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
        <line x1={base.x} y1={20} x2={base.x} y2={H - 20} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
        <text x={W - 22} y={base.y - 6} textAnchor="end" fontSize={10} fontFamily="monospace" fill="#64748b">x</text>
        <text x={base.x + 8} y={26} fontSize={10} fontFamily="monospace" fill="#64748b">y</text>

        {/* grawitacja */}
        <line x1={W - 50} y1={30} x2={W - 50} y2={100} stroke="#f59e0b" strokeWidth={2}
              markerEnd="url(#twol-arr-g)" />
        <text x={W - 40} y={70} fontSize={12} fontFamily="monospace" fontWeight={600} fill="#f59e0b">g</text>

        <defs>
          <marker id="twol-arr-g" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* ogniwa */}
        <line x1={r(base.x)} y1={r(base.y)} x2={r(j2.x)} y2={r(j2.y)} stroke="#0ea5e9" strokeWidth={6} />
        <line x1={r(j2.x)} y1={r(j2.y)} x2={r(tip.x)} y2={r(tip.y)} stroke="#10b981" strokeWidth={6} />

        {/* środki mas */}
        <circle cx={r(c1.x)} cy={r(c1.y)} r={5} fill="#0ea5e9" />
        <text x={r(c1.x) + 8} y={r(c1.y) - 6} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#0ea5e9">C₁ (m₁, I₁)</text>
        <circle cx={r(c2.x)} cy={r(c2.y)} r={5} fill="#10b981" />
        <text x={r(c2.x) + 8} y={r(c2.y) - 6} fontSize={11} fontFamily="monospace" fontWeight={600} fill="#10b981">C₂ (m₂, I₂)</text>

        {/* przeguby */}
        <circle cx={base.x} cy={base.y} r={9} fill="#fff" stroke="#0f172a" strokeWidth={2} />
        <circle cx={base.x} cy={base.y} r={3} fill="#0f172a" />
        <text x={base.x - 12} y={base.y + 22} textAnchor="end" fontSize={12} fontFamily="monospace" fontWeight={700} fill="#0f172a">q₁</text>

        <circle cx={r(j2.x)} cy={r(j2.y)} r={9} fill="#fff" stroke="#0f172a" strokeWidth={2} />
        <circle cx={r(j2.x)} cy={r(j2.y)} r={3} fill="#0f172a" />
        <text x={r(j2.x) - 12} y={r(j2.y) - 12} textAnchor="end" fontSize={12} fontFamily="monospace" fontWeight={700} fill="#0f172a">q₂</text>

        {/* końcówka */}
        <circle cx={r(tip.x)} cy={r(tip.y)} r={4} fill="#ef4444" />
        <text x={r(tip.x) + 8} y={r(tip.y) + 4} fontSize={11} fontFamily="monospace" fill="#ef4444">TCP</text>

        {/* opisy długości */}
        <text x={r((base.x + j2.x) / 2)} y={r((base.y + j2.y) / 2) + 18} fontSize={11} fontFamily="monospace" fill="#0ea5e9" fontWeight={600}>L₁</text>
        <text x={r((j2.x + tip.x) / 2)} y={r((j2.y + tip.y) / 2) + 18} fontSize={11} fontFamily="monospace" fill="#10b981" fontWeight={600}>L₂</text>
      </svg>
      <p className="text-xs text-[var(--muted)] mt-2">
        2R planarny manipulator w polu grawitacji. Oś z układu globalnego jest
        prostopadła do płaszczyzny rysunku (z czytelnika ku obserwatorowi).
        Oba przeguby obrotowe — q₁ wokół osi z bazy, q₂ wokół osi z na końcu
        ogniwa 1. Środki mas C₁, C₂ w połowie długości każdego pręta.
      </p>
    </div>
  );
}

/* ----------------------- Forward sweep --------------------------- */

function ForwardSweepDerivation() {
  return (
    <section className="prose-ik space-y-3">
      <h4>Rekurencja w przód · kinematyka</h4>
      <p>
        Krok po kroku propaguję od bazy do końcówki. Każde równanie poniżej
        jest specjalizacją <M tex="(6.6)–(6.9)" /> do 2D, w której wszystkie
        ω i ε są kolinearne z osią z, więc iloczyny wektorowe upraszczają się
        do skalarnego mnożenia z obrotem 90°.
      </p>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm">
        <p className="font-semibold mb-2">Ogniwo 1 (od bazy)</p>
        <p className="mb-2">
          Z bazy: <M tex="\boldsymbol\omega_0 = \mathbf{0}, \boldsymbol\varepsilon_0 = \mathbf{0}, \mathbf{a}_0 = \mathbf{0}" />.
          Tylko obrót q₁ wokół osi z:
        </p>
        <MathBlock tex="\boldsymbol\omega_1 = \dot q_1\,\hat z, \qquad \boldsymbol\varepsilon_1 = \ddot q_1\,\hat z" />
        <p className="mt-2 mb-2">
          Przyspieszenie środka masy C₁ (w odległości L₁/2 od osi q₁ wzdłuż
          ogniwa, czyli wektor <M tex="\mathbf{r}_{C1} = \tfrac{L_1}{2}(c_1, s_1, 0)" />):
        </p>
        <MathBlock tex="\mathbf{a}_{C1} = \boldsymbol\varepsilon_1\times\mathbf{r}_{C1} + \boldsymbol\omega_1\times(\boldsymbol\omega_1\times\mathbf{r}_{C1})" />
        <p className="mt-2">Po rozpisaniu (ω₁ wzdłuż ẑ, mnożenie wektorowe obraca w płaszczyźnie xy o 90°):</p>
        <MathBlock tex="\mathbf{a}_{C1} = \tfrac{L_1}{2}\bigl(-\ddot q_1\,s_1 - \dot q_1^2\,c_1,\; \ddot q_1\,c_1 - \dot q_1^2\,s_1,\; 0\bigr)" />
        <p className="text-xs text-[var(--muted)] mt-2 mb-0">
          Pierwszy człon (z <M tex="\ddot q_1" />) — przyspieszenie tangencjalne.
          Drugi (z <M tex="\dot q_1^2" />) — przyspieszenie dośrodkowe, zawsze
          skierowane do osi obrotu. Klasyczna dekompozycja ruchu po okręgu.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm">
        <p className="font-semibold mb-2">Ogniwo 2 (po propagacji przez przegub q₂)</p>
        <p className="mb-2">
          Pozycja przegubu q₂ względem bazy:{" "}
          <M tex="\mathbf{p}_2 = L_1(c_1, s_1, 0)" />. Najpierw przyspieszenie
          tego pinu (z wzoru identycznego do <M tex="\mathbf{a}_{C1}" /> tylko
          z pełnym L₁ zamiast L₁/2):
        </p>
        <MathBlock tex="\mathbf{a}_2 = L_1\bigl(-\ddot q_1\,s_1 - \dot q_1^2\,c_1,\; \ddot q_1\,c_1 - \dot q_1^2\,s_1,\; 0\bigr)" />
        <p className="mt-2 mb-2">
          Prędkość i przyspieszenie kątowe ogniwa 2 — wszystkie wzdłuż ẑ więc
          po prostu się dodają (iloczyn wektorowy <M tex="\boldsymbol\omega_1\times\dot q_2\hat z = 0" />):
        </p>
        <MathBlock tex="\boldsymbol\omega_2 = (\dot q_1 + \dot q_2)\,\hat z, \qquad \boldsymbol\varepsilon_2 = (\ddot q_1 + \ddot q_2)\,\hat z" />
        <p className="mt-2 mb-2">
          Wektor od pinu q₂ do C₂:{" "}
          <M tex="\mathbf{r}_{C2,\text{loc}} = \tfrac{L_2}{2}(c_{12}, s_{12}, 0)" />.
          Przyspieszenie C₂ = przyspieszenie pinu q₂ + tangencjalne + dośrodkowe:
        </p>
        <MathBlock tex="\mathbf{a}_{C2} = \mathbf{a}_2 + \boldsymbol\varepsilon_2\times\mathbf{r}_{C2,\text{loc}} + \boldsymbol\omega_2\times(\boldsymbol\omega_2\times\mathbf{r}_{C2,\text{loc}})" />
        <MathBlock tex="\mathbf{a}_{C2} = \mathbf{a}_2 + \tfrac{L_2}{2}\bigl(-(\ddot q_1+\ddot q_2)s_{12} - (\dot q_1+\dot q_2)^2 c_{12},\;\; (\ddot q_1+\ddot q_2)c_{12} - (\dot q_1+\dot q_2)^2 s_{12},\; 0\bigr)" />
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm">
        <p className="font-semibold mb-2">Siły i momenty bezwładności (Newton + Euler)</p>
        <p className="mb-2">Z równania Newtona (dla każdego ogniwa osobno):</p>
        <MathBlock tex="\mathbf{F}_{C1} = m_1\,\mathbf{a}_{C1}, \qquad \mathbf{F}_{C2} = m_2\,\mathbf{a}_{C2}" />
        <p className="mt-2 mb-2">
          Z równania Eulera — wszystkie ω i ε są wzdłuż ẑ, więc{" "}
          <M tex="\boldsymbol\omega\times(I\boldsymbol\omega) = 0" /> (równoległe wektory).
          Zostaje tylko człon <M tex="I\boldsymbol\varepsilon" />:
        </p>
        <MathBlock tex="\mathbf{N}_{C1} = I_{C1}\,\ddot q_1\,\hat z = \tfrac{1}{12}m_1 L_1^2\,\ddot q_1\,\hat z" />
        <MathBlock tex="\mathbf{N}_{C2} = I_{C2}\,(\ddot q_1 + \ddot q_2)\,\hat z = \tfrac{1}{12}m_2 L_2^2\,(\ddot q_1 + \ddot q_2)\,\hat z" />
        <p className="text-xs text-[var(--muted)] mt-2 mb-0">
          <strong>To dokładnie tu znikł „moment żyroskopowy"</strong> z kroku 4 ogólnego algorytmu —
          dla obrotu wokół osi własnej (głównej) tensora bezwładności człon
          <M tex="\boldsymbol\omega\times I\boldsymbol\omega" /> = 0. Dlatego
          przykład 2R nie pokazuje żyroskopu (potrzeba do tego 3D z osiami nieortogonalnymi).
        </p>
      </div>
    </section>
  );
}

/* ----------------------- Backward sweep -------------------------- */

function BackwardSweepDerivation() {
  return (
    <section className="prose-ik space-y-3">
      <h4>Rekurencja w tył · siły reakcji i momenty napędowe</h4>
      <p>
        Zaczynamy od końcówki (gdzie nie ma obciążenia) i bilansujemy siły
        ogniwo po ogniwie. Grawitację uwzględniamy jawnie jako siłę{" "}
        <M tex="\mathbf{F}_{gi} = -m_i\,g\,\hat y" /> w środku masy każdego ogniwa.
        W głównym algorytmie jest ona zaszyta w <M tex="\mathbf{a}_C" /> przez
        sztuczkę Craig'a — tutaj rozdzielamy dla czytelności.
      </p>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm">
        <p className="font-semibold mb-2">Ogniwo 2 (od końcówki)</p>
        <p className="mb-2">Inicjalizacja za końcówką: <M tex="\mathbf{f}_3 = \mathbf{0},\ \mathbf{n}_3 = \mathbf{0}" />.</p>
        <p className="mb-2">Bilans sił:</p>
        <MathBlock tex="\mathbf{f}_2 = \mathbf{f}_3 + \mathbf{F}_{C2} - \mathbf{F}_{g2} = m_2\mathbf{a}_{C2} + m_2 g\,\hat y" />
        <p className="mt-2 mb-2">
          Bilans momentów wokół pinu q₂ (czyli początku ogniwa 2): moment
          bezwładności + moment od <M tex="\mathbf{F}_{C2}" /> na ramieniu{" "}
          <M tex="\mathbf{r}_{C2,\text{loc}}" /> + moment od grawitacji:
        </p>
        <MathBlock tex="\mathbf{n}_2 = \mathbf{N}_{C2} + \mathbf{r}_{C2,\text{loc}}\times(m_2\mathbf{a}_{C2}) + \mathbf{r}_{C2,\text{loc}}\times(m_2 g\,\hat y)" />
        <p className="mt-2 mb-2">
          Moment napędowy w przegubie q₂ to składowa z wektora momentu
          (oś przegubu = ẑ):
        </p>
        <MathBlock tex="\boxed{\;\tau_2 = (\mathbf{n}_2)_z\;}" />
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] px-4 py-3 my-3 not-prose text-sm">
        <p className="font-semibold mb-2">Ogniwo 1</p>
        <p className="mb-2">Bilans sił (dodajemy <M tex="\mathbf{f}_2" /> propagowane od ogniwa 2):</p>
        <MathBlock tex="\mathbf{f}_1 = \mathbf{f}_2 + \mathbf{F}_{C1} - \mathbf{F}_{g1} = \mathbf{f}_2 + m_1\mathbf{a}_{C1} + m_1 g\,\hat y" />
        <p className="mt-2 mb-2">
          Bilans momentów wokół pinu q₁ — cztery składowe (zgodne z Craig 6.50):
        </p>
        <MathBlock tex="\mathbf{n}_1 = \mathbf{N}_{C1} + \mathbf{n}_2 + \mathbf{r}_{C1}\times m_1\mathbf{a}_{C1} + \mathbf{p}_2\times\mathbf{f}_2 + \mathbf{r}_{C1}\times m_1 g\,\hat y" />
        <p className="text-xs text-[var(--muted)] mt-2 mb-2">
          Człon <M tex="\mathbf{p}_2\times\mathbf{f}_2" /> to moment, jakim
          ogniwo 2 „ciągnie" za pin q₂ — propaguje się na ramieniu długości <M tex="L_1" />.
        </p>
        <MathBlock tex="\boxed{\;\tau_1 = (\mathbf{n}_1)_z\;}" />
      </div>
    </section>
  );
}

/* ----------------------- Sanity check ---------------------------- */

function SanityCheckSection() {
  return (
    <section className="prose-ik">
      <h4>Sanity check — statyka z gradientu energii potencjalnej</h4>
      <p>
        Dla <M tex="\dot q_1 = \dot q_2 = 0" /> i <M tex="\ddot q_1 = \ddot q_2 = 0" />{" "}
        wszystkie <M tex="\mathbf{a}_C" /> redukują się do zera, więc{" "}
        <M tex="\mathbf{F}_{Ci} = 0" /> i <M tex="\mathbf{N}_{Ci} = 0" />.
        Zostają tylko grawitacyjne wkłady w <M tex="\mathbf{n}_i" />. Można je
        wyliczyć drugim, niezależnym sposobem — z gradientu energii potencjalnej:
      </p>
      <MathBlock tex="V(q) = m_1 g\,h_{C1}(q) + m_2 g\,h_{C2}(q)" />
      <p>gdzie wysokości środków mas (z y w górę):</p>
      <MathBlock tex="h_{C1} = \tfrac{L_1}{2}\sin q_1, \qquad h_{C2} = L_1\sin q_1 + \tfrac{L_2}{2}\sin(q_1+q_2)" />
      <p>Gradient:</p>
      <MathBlock tex="\tau_1^{\text{grav}} = \frac{\partial V}{\partial q_1} = \bigl(\tfrac{m_1}{2} + m_2\bigr)g L_1\cos q_1 + \tfrac{m_2}{2}g L_2\cos(q_1+q_2)" />
      <MathBlock tex="\tau_2^{\text{grav}} = \frac{\partial V}{\partial q_2} = \tfrac{m_2}{2}g L_2\cos(q_1+q_2)" />
      <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 my-3 not-prose">
        <p className="text-sm font-semibold mb-1">Dwa niezależne wyprowadzenia — wynik musi się zgadzać</p>
        <p className="text-sm text-[var(--foreground)] mb-0">
          Powyższe <M tex="\tau_i^{\text{grav}}" /> z gradientu energii muszą być{" "}
          <em>identyczne</em> z <M tex="(\mathbf{n}_i)_z" /> z Newton-Eulera
          podstawionym <M tex="\dot q = \ddot q = \mathbf{0}" />. Jeśli się
          zgadzają — masz pewność, że algorytm działa. Jeśli nie zgadzają się —
          szukaj błędu w mnożeniu macierzą rotacji albo w znaku iloczynu wektorowego.
          To <strong>najlepszy test jednostkowy</strong> dla implementacji NE.
        </p>
      </div>
      <p>
        Dla pełnej dynamiki (q̇, q̈ ≠ 0) podobny test można zrobić przez
        bilans mocy: <M tex="\sum_i \tau_i \dot q_i = \dot T + \dot V" /> gdzie
        T to energia kinetyczna. Implementujemy go w panelu „Sanity check"
        pod playgroundem (planowane w kolejnej iteracji modułu).
      </p>
    </section>
  );
}
