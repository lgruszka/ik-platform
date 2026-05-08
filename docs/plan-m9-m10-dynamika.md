# Plan modułów M9 + M10 — Kinematyka różniczkowa i dynamika robota

**Status:** plan zaakceptowany w głównych założeniach (sesja z 2026-05-08), implementacja jeszcze nie rozpoczęta.

**Źródło merytoryczne:** rozdz. 6 (model analityczny), rozdz. 6.2 (dynamika), rozdz. 6.2.1 (zadanie odwrotne dynamiki), rozdz. 6.3.3 (parametry dynamiczne), Tab. 6.1–6.4, Rys. 6.1–6.4, Załącznik B (wyprowadzenia skalarne) z dysertacji *„Nowe podejście do generowania trajektorii robota sześcioosiowego"* — Łukasz Gruszka, 2024.

> **Konwencja cytowania w aplikacji**: `[dysertacja, eq. (6.X)]` lub `[dysertacja, zał. B, eq. (B.Y)]`. Plik PDF nie jest publiczny — żadnych linków, tylko numeracja równań.

---

## 1. Decyzje strategiczne

| Punkt | Decyzja | Uzasadnienie |
|---|---|---|
| **Robot referencyjny** | ES5 (EasyRobots) | Zgodność z dysertacją; pełen komplet parametrów (DH, masy, środki masy, silniki); osie q₂q₃q₄ równoległe → przykład formy B Piepera; pierwszy robot inny niż Puma na platformie. |
| **Numer modułów** | M9 (siły/momenty) + M10 (silnik/energia) | Zaakceptowane przez użytkownika. Naturalny podział: rozdział 6.2 + 6.2.1 → M9; końcówka 6.2 + Tab. 6.3 + 6.4 + Rys. 6.4 → M10. |
| **Algorytm** | Newton-Euler rekurencyjny | Zgodnie z dysertacją (str. 44: „prostsza postać równań w postaci jawnej"). Lagrange — odłożone na później. |
| **Implementacja** | TS w przeglądarce + Pyodide | Tak jak M1 — przełącznik runtime, porównanie residuów. |
| **Tensory I_Ci** | OTWARTE — patrz §10 | W zał. B są symbolicznie, brak tabeli z liczbami. Trzy opcje: dostarczone z CAD, z osobnej tabeli w pracy (do sprawdzenia), oszacowanie cylindryczne. |
| **Konwencja DH** | Modified (Craig) | Tak jak w pracy i całej platformie. |

---

## 2. Mapa wzorów z dysertacji do implementacji

Numery równań w dysertacji → kontekst w aplikacji:

### Forward sweep (od bazy do efektora)
| Eq. | Treść | Gdzie w M9 |
|---|---|---|
| (6.6) | ⁱ⁺¹ω_{i+1} = ⁱ⁺¹R_i · ⁱω_i + θ̇_{i+1}·Z_{i+1} | Krok 2 |
| (6.7) | ⁱ⁺¹ε_{i+1} = ⁱ⁺¹R_i·ⁱε_i + ⁱ⁺¹R_i·ⁱω_i × θ̇_{i+1}Z + θ̈Z | Krok 3 |
| (6.8) | ⁱ⁺¹v_{i+1} = ⁱ⁺¹R_i · [ⁱv_i + ⁱω_i × ⁱp_i] | Krok 2 |
| (6.9) | ⁱ⁺¹a_{i+1} = ⁱ⁺¹R_i · [ⁱε_i × ⁱp_i + ⁱω_i × (ⁱω_i × ⁱp_i) + ⁱa_i] | Krok 3 |
| (6.11) | ⁱv_Ci = ⁱv_i + ⁱω_i × ⁱp_Ci | Krok 3 |
| (6.12) | ⁱa_Ci = ⁱε_i × ⁱp_Ci + ⁱω_i × (ⁱω_i × ⁱp_Ci) + ⁱa_i | Krok 3 |

### Tensor bezwładności i siły d'Alemberta
| Eq. | Treść | Gdzie |
|---|---|---|
| (6.13) | I_C = [[I_xx, -I_xy, -I_xz], [-I_xy, I_yy, -I_yz], [-I_xz, -I_yz, I_zz]] | M9 krok 4 |
| (6.14) | ⁱF_Ci = m_i · ⁱa_Ci | M9 krok 4 |
| (6.15) | ⁱM_Ci = I_Ci · ⁱε_i + ⁱω_i × I_Ci · ⁱω_i | M9 krok 4 |

### Backward sweep (od efektora do bazy)
| Eq. | Treść | Gdzie |
|---|---|---|
| (6.16) | ⁱF_gi = m_i · ⁱR_0 · [0, 0, g]ᵀ | M9 krok 5 |
| (6.17) | ⁱF_i = ⁱR_{i+1} · ⁱ⁺¹F_{i+1} + ⁱF_Ci - ⁱF_gi | M9 krok 5 |
| (6.18) | ⁱτ_i = ⁱM_Ci + ⁱR_{i+1}·ⁱ⁺¹τ_{i+1} + ⁱp_Ci × (ⁱF_gi + ⁱF_Ci) - ⁱp_i × ⁱR_{i+1}·ⁱ⁺¹F_{i+1} | M9 krok 5 |

### Silnik DC + przekładnia + energia
| Eq. | Treść | Gdzie |
|---|---|---|
| (6.19) | τ_mi = τ_i / (η_ri · n_i) | M10 krok 1 |
| (6.20) | η_ri = f(ω_mi, τ_i) | M10 krok 2 |
| (6.21) | τ_mi = k_Ti · i_i | M10 krok 3 |
| (6.22) | u_i = R_ti·i_i + L_i · di_i/dt + k_ei · ω_mi | M10 krok 3 |
| (6.23) | E = Σ_i ∫₀^tr u_i(t)·i_i(t) dt | M10 krok 4 |
| (6.37) | f(x) = Σ a_k · x^k (sprawność jako wielomian 5. stopnia) | M10 krok 2 |

### Załącznik B — wzory skalarne
Każde z równań (6.6)–(6.18) jest w zał. B rozpisane na komponenty skalarne dla każdego z 6 ogniw ES5 (B.1–B.63+). Te skalarne wersje są **świetnym materiałem testowym** — można porównać linijka po linijce wynik kodu TS z wartościami obliczonymi „ręcznie" wg formuł z dysertacji. Część komponentów wstawimy do `<NumericalExample />` jako referencję.

---

## 3. Robot ES5 — parametry z dysertacji

### Tab. 6.1 (DH parameters)
| i | a_{i-1} [m] | α_{i-1} [°] | d_i [m] | θ_i |
|---|---|---|---|---|
| 1 | 0,0 | 0 | 0,0 | θ₁ |
| 2 | 0,0 | 90 | 0,0 | θ₂ |
| 3 | 0,425 | 0 | 0,0 | θ₃ |
| 4 | 0,395 | 0 | 0,1105 | θ₄ |
| 5 | 0,0 | 90 | 0,101 | θ₅ |
| 6 | 0,0 | 90 | 0,0765 | θ₆ |

**Obserwacja:** α₂ = 0, α₃ = 0 → osie q₂, q₃, q₄ równoległe. To **forma B warunku Piepera**, jak UR5 — element pedagogiczny do podkreślenia.

### Tab. 6.2 (parametry mechaniczne — m_i, ⁱ⁺¹p_i, ⁱp_Ci)
| i | m_i [kg] | ⁱ⁺¹p_i [m] | ⁱp_Ci [m] |
|---|---|---|---|
| 1 | 3,931 | (0,0; 0,0; 0,0) | (0,0; -0,008; -0,031) |
| 2 | 10,442 | (0,425; 0; 0,0) | (0,207; 0,0; 0,124) |
| 3 | 2,846 | (0,395; 0; 0,1105) | (0,228; 0,0; 0,018) |
| 4 | 1,37 | (0,0; 0,101; 0,0) | (0,0; -0,010; -0,005) |
| 5 | 1,3 | (0,0; -0,0765; 0,0) | (0,0; -0,010; -0,005) |
| 6 | 0,365 | (0,0; 0,0; 0,0) | (0,0; 0,0; -0,012) |

### Tab. 6.3 (silniki + przekładnie harmoniczne)
| Przegub | k_T [Nm/A] | k_e [V/rad/s] | R_t [Ω] | L [mH] | n |
|---|---|---|---|---|---|
| 1 | 0,1418 | 0,12 | 0,7 | 0,9 | 101:1 |
| 2 | 0,1418 | 0,12 | 0,7 | 0,9 | 121:1 |
| 3 | 0,1418 | 0,12 | 0,7 | 0,9 | 101:1 |
| 4 | 0,1636 | 0,08 | 3,5 | 3,4 | 101:1 |
| 5 | 0,1636 | 0,08 | 3,5 | 3,4 | 101:1 |
| 6 | 0,1636 | 0,08 | 3,5 | 3,4 | 101:1 |

### Tab. 6.4 (współczynniki wielomianu η_r aproksymowanego stopnia 5)
Trzy grupy przegubów × 4 prędkości × 6 współczynników (a₀..a₅). Pełna tablica do przepisania bezpośrednio z PDF do pliku `src/lib/dynamics/efficiency-coefficients.ts`.

---

## 4. Moduł M9 — struktura szczegółowa

**URL:** `/modules/9-dynamics`
**Tytuł:** „Dynamika odwrotna — siły i momenty napędowe (Newton-Euler)"
**Poprzedni:** M8 (orientacje), **Następny:** M10 (silnik i energia)

### Sekcja wstępna „O czym jest ten moduł"
- Cytat dysertacji (rozdz. 6 wstęp): trzy zadania — kinematyka, dynamika, energia. Tutaj realizujemy zadanie #2.
- Zadanie odwrotne (q, q̇, q̈ → τ) vs proste (τ → q̈) — wybór zadania odwrotnego (cytat z motywacji str. 39: „rozwiązanie zadania odwrotnego pozwala na wyznaczenie dynamicznych sił i momentów").
- Newton-Euler vs Lagrange: rekurencyjny vs zwarty, jawny vs implicit (M*q̈ + C*q̇ + g = τ). NE bardziej dogodny implementacyjnie — cytat str. 44.
- Robot referencyjny: ES5, parametry z Tab. 6.1 i 6.2.
- Wprowadzenie nowej własności: ES5 ma osie q₂q₃q₄ równoległe → forma B Piepera (link do M1 i feedback_pieper_terminology).

### Sekcja „Laboratorium" (interaktywne)
- 3D model ES5 (`Es5Playground`) z 6 sliderami θ_i + ekran wyświetlający aktualne masy w kg, środek masy każdego ogniwa, tensor bezwładności (jeśli mamy liczby).
- Profil trajektorii: predefiniowane scenariusze (przegub 2 0→π/2 w 1s; pełen ruch wszystkich osi; podnieś-przemieść-odłóż) — wybór z dropdown-em.
- Wykres τ_i(t) renderowany na żywo dla wybranej trajektorii.

### Krok 0 — „Po co dynamika"
**Treść:**
- Trzy zastosowania: (a) **sterowanie** (computed-torque control — pre-feedforward τ wyliczone z modelu), (b) **symulacja** (silnik fizyki w grze albo emulator robota), (c) **optymalizacja** (minimalizacja zużycia energii — cel dysertacji).
- Pojęcie zadania prostego/odwrotnego — z dwóch jeden potrzebny w sterowniku.
- Metoda Newtona-Eulera vs Lagrange — krótkie porównanie. W kontekście wykładu: NE jest „kalkulacyjny", łatwo rozłożyć na rekurencję; Lagrange'a używa się gdy zależy nam na zwartej postaci (planowanie, dowody stabilności).

**Kompenenty:**
- Diagram blokowy „forward dynamics vs inverse dynamics" — co wchodzi co wychodzi.
- Brak interaktywnych elementów.

### Krok 1 — „Założenia i parametry"
**Treść:**
- Lista parametrów: m_i, ⁱp_Ci, I_Ci. Ich znaczenie geometryczne.
- Tabele 6.1 i 6.2 z dysertacji jako referencja.
- Założenia upraszczające (str. 51 dysertacji): liniowość, niezmienność czasowa, sztywne ciała, bez tarcia w przegubach, bez elastyczności napędów.
- Co zignorujemy: tarcie Coulomba w przegubach, błędy modelu CAD (m_i, p_Ci są przybliżone do 0,5%), elastyczność falowodu w przekładni harmonicznej.

**Komponenty:**
- `<DhTableEs5 />` — tabela 6.1 zaadaptowana stylistycznie do platformy.
- `<InertiaParametersTable />` — tabela 6.2 + (jeśli mamy) 6.3 dla I_Ci.
- Schemat: jak interpretować ⁱp_Ci (we własnym układzie ogniwa) vs ⁱp_i (translacja do następnego ogniwa).

### Krok 2 — „Forward sweep: prędkości"
**Treść:**
- Idea propagacji: zaczynamy od bazy (ω₀ = 0, v₀ = 0) i lecimy w górę aż do TCP.
- Wzór (6.6) ω_{i+1}: dziedziczenie obracane przez R + dodatek θ̇·z.
  - Geometryczna interpretacja: każde ogniwo „obraca się tak jak poprzednie + plus własny ruch przegubu".
  - Skąd Z_{i+1} — z konwencji DH (oś z = oś przegubu).
- Wzór (6.8) v_{i+1}: dziedziczenie + efekt obrotu „ramię × ω".
  - Geometryczna interpretacja: ogniwo ma prędkość liniową = baza + obrót poprzedniego ogniwa wokół jego początku.

**Komponenty:**
- `<LinkDiagram showVelocities />` — animowany schemat dwóch ogniw (i, i+1), strzałki ω_i i v_i narastają od bazy do efektora wraz z postępem animacji.
- Krok-po-kroku visualizer: kliknięcie strzałki w prawo przesuwa krok forward sweep o jedno ogniwo, na panelu wyświetlają się wartości ω_i, v_i numerycznie.
- Code snippet TS: `function forwardVelocities(state, q_dot)` (15 linii).

### Krok 3 — „Forward sweep: przyspieszenia"
**Treść:**
- Wzór (6.7) ε_{i+1}: dziedziczenie + człon Coriolisa (R·ω×θ̇z) + człon tangencjalny (θ̈z).
  - **Człon Coriolisa** — skąd się bierze: gdy ogniwo i obraca się i jednocześnie ma własną prędkość kątową przegubu, te dwie rotacje „mieszają się" przez iloczyn wektorowy.
- Wzór (6.9) a_{i+1}: dziedziczenie + człon tangencjalny (ε×p) + człon dośrodkowy (ω×(ω×p)).
  - **Człon dośrodkowy** — bezpośrednia analogia do v²/r dla ruchu kołowego.
  - **Człon tangencjalny** — efekt zmiany prędkości kątowej ogniwa nadrzędnego.
- Wzory (6.11) i (6.12) dla środka masy: prędkość/przyspieszenie środka masy = wartości w przegubie + efekt geometryczny p_Ci.

**Komponenty:**
- `<LinkDiagram showAccelerations />` — wektory ε i a, plus pomocnicze ω×ω i ε×p oddzielnie kolorowane.
- Mini-eksperyment: slider prędkości q̇₂, niezerowe q̇ pokazuje człony nieoczywiste (Coriolisa, dośrodkowy) — student widzi że nawet przy q̈ = 0 mogą być niezerowe przyspieszenia kątowe.
- Code snippet: `function forwardAccelerations(state, q_dot, q_ddot)`.

### Krok 4 — „Tensor bezwładności i siły bezwładności"
**Treść:**
- Wzór (6.13): tensor I_C — matryca 3x3 symetryczna (po znakach), 6 niezależnych elementów.
  - Diagonalne: momenty bezwładności wokół osi.
  - Niediagonalne: momenty dewiacji (sprzężenia rotacji wokół różnych osi).
  - Dla cylindra wzdłuż osi z, idealny przypadek: I_xx = I_yy = mr²/2 + mh²/12, I_zz = mr²/2, niediagonalne = 0.
- Wzór (6.14): F_Ci = m·a_Ci — siła d'Alemberta (II zasada Newtona „odwrócona": siła bezwładności równoważy siłę zewnętrzną).
- Wzór (6.15): M_Ci = I·ε + ω×Iω — analog rotacyjny.
  - **Drugi człon ω×Iω** — efekt giroskopowy: szybko obracające się ciało „opiera się" zmianie osi obrotu.
  - Specjalny przypadek: gdy ω||eigvec(I), drugi człon znika.

**Komponenty:**
- `<InertiaEllipsoid />` — elipsoida bezwładności rysowana wokół środka masy ogniwa (analogiczna do elipsoidy manipulacyjności z M7, ale fizyczna). Półosie = 1/√λ_i gdzie λ_i są wartościami własnymi I_C.
- Wykres: osobno F_Ci (siła) i M_Ci (moment) jako funkcje czasu dla ruchomej trajektorii.
- Code snippet: `function inertialForceTorque(I_C, m, omega, alpha, a_C)`.

### Krok 5 — „Backward sweep: siły reakcji i momenty napędowe"
**Treść:**
- Idea propagacji: zaczynamy od ostatniego ogniwa (i = 6, gdzie F_7 = 0, τ_7 = 0 — efektor bez chwytaka pod obciążeniem) i lecimy w dół do bazy.
- Wzór (6.16): siła grawitacji ⁱF_gi w lokalnym układzie ogniwa = obrócony [0, 0, g]ᵀ.
- Wzór (6.17): bilans sił. Każde ogniwo „przekazuje" siłę dalej + dorzuca własny wkład (siły bezwładności, grawitacji).
- Wzór (6.18): bilans momentów. Trochę bardziej złożony bo ramiona × siły.
- Moment napędowy w przegubie = projekcja momentu siły reakcji na oś przegubu z_i (skalar).

**Komponenty:**
- `<LinkDiagram showForces />` — wektory F_i, F_Ci, F_gi, M_Ci na schemacie ogniwa.
- Mini-eksperyment: tylko grawitacja (q̇=0, q̈=0) → pokazuje statyczne momenty „trzymające" robota w danej konfiguracji.
- Plot porównawczy: τ_grav vs τ_dyn (rozkład momentu na statyczny + dynamiczny).
- Code snippet: `function backwardForcesAndTorques(state, F_C, M_C, F_g)`.

### Krok 6 — „Studium liczbowe"
- Konkretny scenariusz dla ES5: q = (0, π/4, π/4, 0, π/2, 0), q̇ = (0,5; 0; 0; 0; 0; 0) rad/s, q̈ = 0.
- Krok-po-kroku wszystkie wartości pośrednie:
  - ⁰ω₀ = 0, ⁰v₀ = 0, ⁰a₀ = (0, 0, -9,81)ᵀ (grawitacja).
  - ¹ω₁, ¹v₁, ¹a₁ = z (B.1)–(B.4) zał. B.
  - …
  - ⁶F₆ = 0, ⁶τ₆ = 0 (warunki brzegowe efektora).
  - ⁵F₅, ⁵τ₅, ..., ⁰F₀, ⁰τ₀ = z (B.50)–(B.65).
  - τ napędowe = ⁱτ_i · z_i (skalar).
- Komponent `<NumericalExampleM9 />` z bake-in liczb.
- Tabela końcowa: 6 wartości τ_i [Nm], gotowe do porównania z implementacją studenta.

### Krok 7 — „Eksperyment interaktywny"
- Multi-trajektoria: dropdown pozwala wybrać profil
  - Trapezoid w q₂ (0 → π/2 → 0 z plateau)
  - Sinusoidalny ruch w wszystkich osiach
  - Pick-and-place (q_start → q_high → q_target → q_high → q_start)
- Wykres τ_i(t) wszystkich 6 napędów.
- Slider „masa narzędzia" (0 do 3 kg) dodawana do m₆ — obserwacja jak rosną momenty.
- Slider „przyspieszenie" — skalowanie q̈, pokazuje jak τ_dyn rośnie kwadratowo z prędkością.

### Sekcja końcowa
- Cheat sheet (`<CheatSheetM9 />`) — wszystkie wzory (6.6)–(6.18) zgrupowane.
- Następny moduł: M10 — od momentu napędowego do mocy elektrycznej i energii.
- Linki: M3 (Jacobian: q̇ → ẋ to to samo co tu, ale dla pierwszej pochodnej), M7 (elipsoida manipulacyjności vs bezwładności).

---

## 5. Moduł M10 — struktura szczegółowa

**URL:** `/modules/10-energy`
**Tytuł:** „Silnik DC, przekładnia, energia — od τ_i do mocy elektrycznej"
**Poprzedni:** M9, **Następny:** brak (ostatni moduł).

### Sekcja wstępna
- Co dostajemy z M9: τ_i — moment „mechaniczny" w przegubie. Co potrzebujemy: energia w cyklu transportowym.
- Łańcuch transformacji: τ_i → przekładnia (η_r, n) → τ_mi (na wale silnika) → silnik DC (k_T, k_e, R, L) → u_i, i_i → P_i = u·i → E = ∫P dt.
- Cytat z dysertacji str. 39: powiązanie z optymalizacją — model energii pozwala na off-line optymalizację cyklu transportowego.

### Krok 0 — „Od momentu mechanicznego do mocy elektrycznej"
- Diagram blokowy całego łańcucha (przegub → przekładnia → silnik → bateria).
- Rola każdego elementu pojedynczo.
- Wprowadzenie: ω_mi = n_i · θ̇_i (prędkość kątowa wirnika silnika).

### Krok 1 — „Przekładnia harmoniczna i sprawność η_r(ω, τ)"
- Wzór (6.19): τ_mi = τ_i / (η_ri · n_i).
- Skąd przekładnia w robocie: silniki działają najwydajniej przy wysokich obrotach + niskich momentach; przeguby potrzebują niskich obrotów + wysokich momentów. Przekładnia jest „translatorem" mocy.
- Co to przekładnia harmoniczna (Harmonic Drive) — krótki opis konstrukcji (flexspline, wave generator, circular spline). Cytat: dysertacja str. 49 + ref [73].
- Sprawność jako funkcja ω i τ — Rys. 6.4 z dysertacji.
- Założenia upraszczające: pomijamy zależność od temperatury (str. 49).

**Komponenty:**
- `<HarmonicDriveSchema />` — schematyczny rysunek przekładni harmonicznej (statyczny SVG).
- `<EfficiencyChart />` — odtworzenie Rys. 6.4 jako interaktywny wykres. Wybór grupy przegubów (1-3 / 2 / 4-5-6) + suwak prędkości obrotowej, krzywa się przesuwa.

### Krok 2 — „Aproksymacja wielomianowa η_r"
- Wzór (6.37): f(x) = a₅x⁵ + a₄x⁴ + a₃x³ + a₂x² + a₁x + a₀.
- Tab. 6.4 z dysertacji — pełna tabela współczynników.
- Dlaczego wielomian 5. stopnia: wystarczająca dokładność dla zakresu typowych obciążeń, niska liczba parametrów.
- Interpolacja po prędkościach: η_r(ω_input, τ_input) — interpolacja liniowa po ω_input pomiędzy 4 krzywymi z Tab. 6.4.
- Implementacja: hardcoded coefficients + funkcja `efficiency(jointId, omega_motor_rpm, torqueLoadPercent)`.

**Komponenty:**
- `<EfficiencyTable />` — pełna tabela 6.4 z dysertacji (4 prędkości × 3 grupy × 6 współczynników).
- `<EfficiencyInterpolator />` — interaktywne narzędzie: wpisz prędkość i obciążenie → wynik η.

### Krok 3 — „Model elektromechaniczny silnika DC"
- Wzór (6.21): τ_mi = k_Ti · i_i (stała momentowa).
- Wzór (6.22): u_i = R_ti · i_i + L_i · di_i/dt + k_ei · ω_mi (równanie napięciowe Kirchhoffa).
- Pochodzenie: prawo Ampera (siła Lorentza działająca na uzwojenie tworznika) + EMF wirnika (siła elektromotoryczna obrotu w polu magnetycznym).
- Stałe k_T i k_e — w SI mają tę samą wartość (zaokrąglenie do innej jednostki). W dysertacji wartości różne (Tab. 6.3) bo k_T podane w Nm/A a k_e w V/(rad/s) — łatwo sprawdzić identyczność po skalowaniu.
- Model jest uproszczony: pomijamy nasycenie magnetyczne, tarcie wewnątrz silnika, charakterystykę indukcji L w funkcji prądu.

**Komponenty:**
- `<MotorSchematic />` — schemat elektryczny silnika DC: bateria, R, L, EMF (= k_e·ω_mi). Wartości u, i wyświetlane numerycznie.
- Code snippet: implementacja w TS — di/dt jako pochodna numeryczna.

### Krok 4 — „Moc chwilowa i energia całkowita"
- Wzór: P_i(t) = u_i(t) · i_i(t).
- Wzór (6.23): E = Σ_i ∫₀^tr u_i · i_i dt — sumowane po wszystkich napędach.
- Implementacja: trapezoidalna integracja numeryczna z dt = 0,001s (krok analizy).
- Założenia upraszczające str. 51 dysertacji: liniowość, niezmienność czasowa, brak strat w przewodach/złączach, brak strat termicznych.

**Komponenty:**
- `<PowerEnergyChart />` — wykresy P_i(t) wszystkich 6 napędów + skumulowane E(t) na osobnej osi.

### Krok 5 — „Eksperyment optymalizacyjny"
- Dla zadania pick-and-place (z dysertacji rozdz. 7 — blending wielomianowy):
  - Trajektoria #1: szybka, agresywna (małe t_r, duże τ).
  - Trajektoria #2: powolna, łagodna (duże t_r, małe τ).
  - Trajektoria #3: optymalna (znaleziona przez minimalizację E).
- Pokazanie energii każdej trajektorii: kontrast szybko vs ekonomicznie.
- Zapowiedź pełnej optymalizacji z rozdz. 8 dysertacji (multi-criteria: czas + energia + koszt ekonomiczny).
- Linki do potencjalnego M11 — „Optymalizacja cyklu transportowego" (do dyskusji z autorem).

### Sekcja końcowa
- Cheat sheet (`<CheatSheetM10 />`) — wszystkie wzory (6.19)–(6.23) + (6.37).
- „Co dalej": optymalizacja off-line cyklu transportowego (rozdz. 7-8 dysertacji).

---

## 6. Komponenty do utworzenia

### Współdzielone (`src/components/dynamics/`)
| Plik | Opis |
|---|---|
| `link-diagram.tsx` | Schemat dwóch ogniwów (i, i+1) z możliwością wyświetlenia ω, v, ε, a, F, M, F_g w dowolnej kombinacji. Animacja forward/backward sweep. |
| `inertia-ellipsoid.tsx` | 3D elipsoida bezwładności rysowana wokół środka masy (R3F). |
| `torque-chart.tsx` | Wykres τ_i(t) dla wszystkich 6 napędów; wsparcie dla anotacji (np. „zaburzenie", „zmiana fazy"). |
| `numerical-example-m9.tsx` | Wzorzec liczbowy dla M9 (analogicznie do `numerical-example.tsx` z M1). |
| `cheat-sheet-m9.tsx` | Ściąga formuł (6.6)–(6.18). |
| `motor-schematic.tsx` | Schemat elektryczny silnika DC z aktualnymi wartościami. |
| `efficiency-chart.tsx` | Sprawność przekładni — odtworzenie Rys. 6.4. |
| `efficiency-interpolator.tsx` | Interpolator do wyświetlania η dla zadanych ω, τ. |
| `power-energy-chart.tsx` | Wykres P(t) i E(t) z dwiema osiami. |
| `harmonic-drive-schema.tsx` | Schemat statyczny przekładni harmonicznej (SVG). |
| `cheat-sheet-m10.tsx` | Ściąga formuł (6.19)–(6.23). |

### Robot ES5 (`src/components/robot/`)
| Plik | Opis |
|---|---|
| `es5-model.tsx` | Model 3D ES5 zgodnie z Rys. 6.1 (cylindry + sześciany + układy DH). |
| `es5-playground.tsx` | Playground analogiczny do `puma560-playground.tsx` z 6 sliderami. |
| `es5-ghost.tsx` | Półprzezroczysta wersja modelu — do nakładania trajektorii. |

### Strony modułów
| Plik | Opis |
|---|---|
| `src/app/modules/9-dynamics/page.tsx` | Strona M9 z 8 sekcjami StepPanel + interaktywne lab. |
| `src/app/modules/10-energy/page.tsx` | Strona M10 z 6 sekcjami StepPanel + interaktywne lab. |

### Logika domenowa (`src/lib/`)
| Plik | Opis |
|---|---|
| `lib/robots/es5.ts` | Tabela DH + masy + środki masy + tensory + offsety. |
| `lib/dynamics/newton-euler.ts` | Algorytm forward + backward sweep, parametryzowany robotem. |
| `lib/dynamics/types.ts` | `DynamicState`, `LinkInertia`, `TorqueOutput`. |
| `lib/dynamics/motor-model.ts` | Silnik DC + przekładnia + sprawność (Tab. 6.3, 6.4). |
| `lib/dynamics/efficiency-coefficients.ts` | Hardcoded Tab. 6.4 (24 wektory współczynników). |
| `lib/dynamics/energy.ts` | Integracja P → E z trapezoidalną metodą. |
| `lib/dynamics/__smoke.ts` | Test round-trip (q,q̇,q̈ → τ → po porównaniu z wartościami z zał. B). |

### Pyodide
| Plik | Opis |
|---|---|
| `public/pyodide-worker.js` | Rozszerzenie o NE w Pythonie. |
| `lib/pyodide/client.ts` | API: `pyComputeDynamics(robot, q, q_dot, q_ddot)`. |
| `components/pyodide/dual-runtime-comparison-dynamics.tsx` | Side-by-side TS vs Python. |

### Dokumenty
| Plik | Opis |
|---|---|
| `docs/dynamika-cookbook.md` | Cookbook NE krok po kroku, z odniesieniami do (6.6)–(6.18). |
| `docs/zadania.md` (rozszerzenie) | +3 zadania o dynamice. |
| `docs/plan-wykladu.md` (rozszerzenie) | Dodatkowy 25-min blok wykładu o dynamice. |

---

## 7. Powiązania z istniejącymi modułami

| Moduł | Powiązanie |
|---|---|
| **M0** (Intro) | Dorzucić w klasyfikacji metod IK wzmiankę: „dynamika to osobny problem; raz mając IK, można zastosować NE z tego planu". |
| **M1** (Walkthrough) | Stopka „Co dalej": dorzucić link do M9 — „IK daje q; różniczkując po czasie i podstawiając do NE z M9, dostajemy τ". |
| **M2** (Playground) | Stopka: link do M9 dla porównania trajektorii w 8 gałęziach pod kątem energii. |
| **M3** (Jacobian) | Krok 0 lub stopka: „Jacobian to mapowanie q̇ → ẋ (pierwsza pochodna). NE z M9 to mapowanie q̈ → τ (druga pochodna + dynamika)". |
| **M7** (Singularities) | Krok 0: „elipsoida manipulacyjności (M7) vs elipsoida bezwładności (M9 krok 4) — różne tensory, ta sama matematyka eigendecomposition". |
| **`docs/plan-wykladu.md`** | Dodatkowy 25-min blok wykładu „Dynamika — Newton-Euler" (po analitycznej IK, przed numerycznymi). |

---

## 8. Plan czasowy — etapy implementacji

| # | Etap | Czas | Komentarz |
|---|---|---|---|
| 1 | Robot ES5 — `es5.ts` + `es5-model.tsx` + `es5-playground.tsx` | 4 h | Kalkować z `puma560.ts`; konstrukcja wizualna trochę bardziej skomplikowana. |
| 2 | Algorytm Newton-Euler — `newton-euler.ts` + smoke test | 5 h | Generyczny dla dowolnego robota DH; testy round-trip z wartościami z zał. B (próbka 2-3 ogniwa). |
| 3 | Komponenty wizualizacyjne wspólne (`link-diagram`, `torque-chart`, `inertia-ellipsoid`) | 6 h | Najwięcej pracy; każdy z animacjami, hydration-safe. |
| 4 | Strona M9 z 8 panelami StepPanel + lab interaktywne | 5 h | |
| 5 | `numerical-example-m9.tsx` + `cheat-sheet-m9.tsx` | 2 h | Bake-in liczb dla scenariusza testowego. |
| 6 | Pyodide wersja NE | 2 h | Algorytm jest szybki, łatwa portacja. |
| 7 | Silnik + przekładnia — `motor-model.ts` + `efficiency-coefficients.ts` | 3 h | Tab. 6.4 do przepisania ręcznie z PDF. |
| 8 | Komponenty wizualizacyjne M10 (`motor-schematic`, `efficiency-chart`, `power-energy-chart`) | 4 h | |
| 9 | Strona M10 z 6 panelami StepPanel | 4 h | |
| 10 | `cheat-sheet-m10.tsx` + `numerical-example-m10.tsx` (opcjonalnie) | 2 h | |
| 11 | Cookbook `docs/dynamika-cookbook.md` | 3 h | |
| 12 | Powiązania z innymi modułami (linki, stopki) | 1 h | |
| 13 | Zadania studenckie (`docs/zadania.md`) | 1 h | +3 zadania. |
| 14 | Plan wykładu rozszerzenie | 1 h | |
| 15 | Pre-flight + commit + push (3 razy w trakcie) | 1 h | |
| **RAZEM** | | **~44 h** | Realnie 5-6 sesji 6-8h każda. |

---

## 9. Zadania studenckie do `docs/zadania.md`

**Zadanie 11 — Wpływ masy chwytaka na momenty napędowe**
*Trudne.* Zmień m₆ z 0,365 kg na 2,365 kg (chwyta przedmiot 2 kg). Dla zadanej trajektorii wypisz: (a) τ_max przed/po, (b) τ_RMS przed/po, (c) dla którego napędu wpływ jest największy. Wyjaśnij dlaczego.

**Zadanie 12 — Statyczny vs dynamiczny moment**
*Średnie.* Uruchom symulację dwa razy: raz z prędkościami i przyspieszeniami zerowymi (tylko grawitacja), drugi raz z pełną dynamiką. Wykaż że τ_total = τ_grav + τ_dyn (z uproszczeniem do liniowego rozkładu). Pokaż na wykresie który ma większą amplitudę dla typowej trajektorii pick-and-place.

**Zadanie 13 — Optymalizacja energetyczna**
*Trudne.* Dla zadania transportu z punktu A = (0,5; 0; 0,5) do B = (0,5; 0,5; 0,5): wygeneruj trzy trajektorie (czas 1 s, 2 s, 3 s) z profilem trapezowym. Policz zużycie energii dla każdej z M10. Pokaż że istnieje minimum w funkcji czasu — zinterpretuj dlaczego (zbyt szybka trajektoria → wysokie τ_dyn → wysoki prąd; zbyt wolna → długi czas integracji + grawitacja przez długie t).

---

## 10. Otwarte pytania (do rozstrzygnięcia z użytkownikiem przed implementacją)

### 10.1 Tensory bezwładności I_Ci ⭐ priorytet

W zał. B są podane symbolicznie (jako I_xx, I_xy, ..., I_zz dla każdego ogniwa), ale nie znalazłem tabeli z konkretnymi wartościami liczbowymi. Tabela 6.2 podaje masy + ⁱ⁺¹p_i + ⁱp_Ci, ale **bez tensorów**.

Trzy opcje:

**Opcja A — Dostarczasz tabelę.** Najlepsze rozwiązanie. Czy masz w plikach źródłowych pracy (np. Word/LaTeX) dane tensorów? Format który mi pasuje:
```
| Ogniwo | I_xx | I_yy | I_zz | I_xy | I_xz | I_yz |
|--------|------|------|------|------|------|------|
| 1      | ?    | ?    | ?    | ?    | ?    | ?    |
| 2      | ?    | ?    | ?    | ?    | ?    | ?    |
...
```
(jednostki: kg·m²)

**Opcja B — Wyciągamy z modelu CAD ES5.** Czy masz dostęp do modelu w SOLIDWORKS/Fusion/inne, z którego pochodziły wartości? Jeśli tak, można je wyciągnąć przez „Mass Properties".

**Opcja C — Oszacowanie z geometrii cylindrycznej.** Każde ogniwo aproksymujemy cylindrem jednorodnym o znanej masie i wymiarach (z Rys. 6.1). Wzory:
- Cylinder długi (oś z lokalna): I_zz = ½mr², I_xx = I_yy = ¼mr² + ⅓ml² — kalkulowane numerycznie z wartości m_i, l_i (długości DH), r_i (promień przyjmowany 0,05–0,07 m wg geometrii ES5).
- Niediagonalne = 0 (ogniwo jednorodne).

**Domyślnie**, jeśli się nie odezwiesz w tej kwestii, idę z opcją C i daję otwartą notkę w module: „Tensory bezwładności są aproksymowane geometrycznie (cylindry jednorodne); rzeczywiste wartości pochodzą z modelu CAD i mogą się różnić o 10-30%. Wzory algorytmu pozostają bez zmian."

### 10.2 Numeracja modułów

Aktualnie M8 jest „Reprezentacje orientacji" (bonus). Czy M9 i M10 mają iść po nim, czy lepiej:
- **A)** M9 i M10 jako naturalna kontynuacja (akcept moją propozycję) — proste, kolejność rosnąca.
- **B)** Dynamika idzie wcześniej, np. M4 (po Jakobianie), żeby grupować „matematykę propagacji" razem — pakuje moduły, ale wymaga renumerowania M4-M8.

**Rekomendacja:** A. Renumerowanie wymaga aktualizacji wszystkich routów, navigation, dokumentów — koszt znacznie wyższy niż wartość.

### 10.3 Trajektoria w eksperymencie M9 krok 7

Zaproponuję 3 predefiniowane trajektorie. Czy chciałbyś dodać:
- (a) możliwość importu trajektorii z pliku CSV (q(t), q̇(t), q̈(t))?
- (b) prostego edytora keyframes (kliknięcie w 3D pozycji TCP w kilku miejscach + interpolacja)?

To może być rozszerzenie po pierwszej iteracji.

### 10.4 Pyodide

Czy chcesz pełną wersję NE w Pythonie, czy uproszczoną (tylko zewnętrzny interfejs, dla porównania liczb)? Pełna pomocna dla studenta, który implementuje w Jupyter — ale to dodatkowe ~2h pracy.

**Rekomendacja:** pełna, dla spójności z M1.

### 10.5 Modele CAD ES5

Czy masz dostęp/uprawnienia do dystrybucji uproszczonego modelu CAD ES5 (np. STL z liczbą trójkątów ~5000 dla prostej wizualizacji R3F)? Aktualnie planuję cylindry + sześciany jak w M1, ale model fotorealistyczny by pomógł.

**Rekomendacja:** schematyczny (cylindry + sześciany) wystarczy dydaktycznie.

---

## 11. Pierwsze pytanie blokujące implementację

**Tensory I_Ci** (§10.1). Bez tej informacji nie mogę ruszyć z `es5.ts`. Pozostałe pytania (10.2–10.5) mogę rozwiązywać równolegle z kodem; ten jeden trzyma start.

Pinguj odpowiedzią na §10.1 i ruszamy.
