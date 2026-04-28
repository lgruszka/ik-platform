# Zadania praktyczne — odwrotna kinematyka

Zbiór ćwiczeń laboratoryjnych i zadań domowych bazujących na kodzie aplikacji IK Platform. Każde zadanie ma:

- **Cel** — co student ma zrozumieć / potrafić po wykonaniu
- **Pliki do modyfikacji / utworzenia** — konkretne ścieżki w repozytorium
- **Podpowiedź** — punkt wyjścia lub ostrzeżenie przed typowym błędem
- **Kryterium oceny** — co musi działać, żeby zadanie uznać za zaliczone

Zadania są uporządkowane od najprostszych (1–3) przez średnio trudne (4–7) po wymagające (8–10). Sugerowana objętość: 2–4 zadania na 90-minutowe laboratorium.

---

## Zadanie 1 — Uproszczony robot Puma (porównanie z pracą 327736)

**Poziom:** podstawowy

**Cel:** Zrozumieć, jak wyprowadzenie IK upraszcza się, gdy robot ma prostszą geometrię (bez odsunięć osiowych). Porównać z pracą [327736] rozdz. 6.4 i zauważyć, które człony wzorów znikają.

**Treść:** W pracy inżynierskiej [327736] robot „Insight" to uproszczona Puma bez offsetów `d₃` i `a₃`. Rozpocznij od kopii pliku `src/lib/solvers/analytical-puma560.ts` jako `src/lib/solvers/analytical-insight.ts`. W nowej wersji:

1. Ustaw `D3 = 0` i `A3 = 0` na stałe.
2. Sprawdź, które wzory się upraszczają:
   - `q₁ = atan2(p_y, p_x) − atan2(d₃, ρ)` → `q₁ = atan2(p_y, p_x)` (praca 327736, wzór 10)
   - `L = √(a₃² + d₄²) → L = d₄`, `β = π/2`
   - `K = (x² + y² + z² − L₃² − L₄²) / (2·L₃)` (wzory 19–20 w pracy)
3. Uprość kod usuwając niepotrzebne człony. Porównaj wyprowadzenie ze wzorami (13)–(40) w pracy.

**Pliki:**
- `src/lib/solvers/analytical-insight.ts` (nowy)
- `src/lib/solvers/__insight_smoke.ts` (nowy, odpowiednik `__smoke.ts`)

**Podpowiedź:** Skopiuj strukturę z `analytical-puma560.ts` i usuwaj wszystko powiązane z `d₃` i `a₃`. Pamiętaj że `L = d₄` teraz, a `β = atan2(d₄, 0) = π/2`.

**Kryterium oceny:** `__insight_smoke.ts` przechodzi round-trip dla 6 losowych przypadków z błędem < `10⁻¹²`. W komentarzu u góry pliku wypisz, które wiersze kodu bezpośrednio odpowiadają którym wzorom z pracy.

---

## Zadanie 2 — Filtr ograniczeń przegubowych w selekcji

**Poziom:** podstawowy

**Cel:** Uzupełnić funkcję wybierającą praktyczne rozwiązanie o filtr odrzucający rozwiązania spoza zakresu przegubów.

**Treść:** Funkcja `pickClosestSolution` w `src/lib/solvers/analytical-puma560.ts` wybiera rozwiązanie najbliższe zadanemu seed, ale nie sprawdza, czy jakieś `q_i` nie jest poza limitem mechanicznym. Rozszerz ją tak, by:

1. Najpierw odrzucała wszystkie rozwiązania, w których istnieje przegub poza jego `limits.min`/`limits.max` (pamiętaj o wrap-around: sprawdź też `q_i ± 2π`).
2. Spośród pozostałych wybierała najbliższe seed (jak dotychczas).
3. Zwracała `null` jeśli po filtrowaniu nic nie zostało.

**Pliki:**
- `src/lib/solvers/analytical-puma560.ts` (modyfikacja `pickClosestSolution`)

**Podpowiedź:** `PUMA560.dh[i].limits` zawiera granice w radianach. Dla niektórych przegubów (np. `q₆`) limit jest bardzo szeroki (`±265°`), co oznacza że zawinięcie `q_i + 2π` może być dopuszczalne.

**Kryterium oceny:** Stwórz test, w którym dla rozwiązania `q_i = 300°` przy limicie `[−160°, 160°]` funkcja zwraca `q_i − 360° = −60°` zamiast odrzucać je.

---

## Zadanie 3 — Planarne ramię 3R (IK analityczna od zera)

**Poziom:** podstawowy / średni

**Cel:** Samodzielnie wyprowadzić i zaimplementować IK dla prostszego robota — bez korzystania z naszego kodu Pumy.

**Treść:** Ramię planarne 3R ma trzy ogniwa obrotowe w jednej płaszczyźnie. Wejście IK: `(x, y, φ)` gdzie `(x, y)` to pozycja końcówki, `φ` to orientacja (kąt narzędzia względem osi x).

1. Wyprowadź ręcznie wzory na `q₁, q₂, q₃` (prawo cosinusów dla `q₂`, potem geometria dla `q₁`, na końcu `q₃ = φ − q₁ − q₂`).
2. Zaimplementuj w `src/lib/solvers/analytical-planar3r.ts`.
3. Zrób round-trip test.

**Pliki:**
- `src/lib/solvers/analytical-planar3r.ts` (nowy)
- Test smoke

**Podpowiedź:** Przyjmij długości `l₁ = l₂ = l₃ = 0.3 m`. Problem dekomponuje się na: (a) pozycja końca ogniwa 2 = `(x, y) − l₃·(cos φ, sin φ)`, (b) klasyczny 2R planarny dla `q₁, q₂`, (c) `q₃ = φ − q₁ − q₂`.

**Kryterium oceny:** Dwa rozwiązania (elbow up/down) poprawnie wyliczone, round-trip test z błędem < `10⁻¹²`.

---

## Zadanie 4 — Destabilizacja pseudoinwersji przy singularności

**Poziom:** średni

**Cel:** Doświadczalnie zobaczyć, dlaczego „czysta" pseudoinwersja się rozbiega w pobliżu singularności nadgarstka.

**Treść:** W module 3 aplikacji w `SolverComparison` dostępne są cztery metody jakobianowe. Zmodyfikuj kod tak, żeby:

1. Dodać piątą metodę `"pinv-fail"` — identyczną z `pinv`, ale bez fallbacku do DLS gdy macierz jest prawie singularna (usuń `try/catch` fallback w `src/lib/solvers/jacobian-solvers.ts`).
2. Przygotuj pozę docelową, w której rozwiązanie ma `|q₅| < 5°` (bliska singularność nadgarstka).
3. Uruchom porównanie metody `pinv-fail` z `dls` na tej samej pozie. Udokumentuj w krótkim raporcie (plik `docs/raport-zad4.md`) różnicę w liczbie iteracji, błędzie końcowym, czasie.

**Pliki:**
- `src/lib/solvers/jacobian-solvers.ts` (dodaj metodę `pinv-fail`)
- `docs/raport-zad4.md` (nowy, krótki — 1 strona)

**Podpowiedź:** Dla pozy bliskiej singularności wybierz taką, gdzie narzędzie jest pionowo (`RPY = (0, π, 0)`) — to zwykle wymusza `q₅` bliskie zera.

**Kryterium oceny:** Raport zawiera: (a) wykres błędu vs iteracja dla obu metod, (b) liczbową porównawczą tabelę (jak w module 3), (c) paragraph interpretacyjny — dlaczego pinv-fail zawodzi.

---

## Zadanie 5 — Obsługa offsetu narzędzia (tool frame)

**Poziom:** średni

**Cel:** Uzupełnić solver o obsługę stałego offsetu narzędzia (TCP ≠ origin frame 6).

**Treść:** Obecnie aplikacja zakłada, że poza efektora = poza origin ramki {6}. W praktyce robot ma narzędzie (chwytak, palnik, wrzeciono) zamontowane na flanszy — TCP jest przesunięty o `T_tool`. Rozszerz solver:

1. Do `RobotModel` dodaj pole `toolOffset?: Matrix4`.
2. W `solvePuma560Analytical` zastosuj korektę z kroku 0 cookbook'u: `T₀⁶ = T* · T_tool⁻¹`.
3. Dodaj UI — pole wprowadzania `T_tool` w kontrolerze głównym, oraz aktualizację wizualizacji w 3D.

**Pliki:**
- `src/lib/types.ts` (rozszerzenie typu)
- `src/lib/solvers/analytical-puma560.ts` (korekta)
- `src/components/robot/puma560-model.tsx` (wizualizacja)
- `src/components/walkthrough/target-pose-input.tsx` (UI)

**Podpowiedź:** Opcja Offset zacznij od prostej przesunięcia: `T_tool = translacja(0, 0, L_tool)` dla jakiegoś `L_tool = 0.1 m`. Sprawdź, że IK wciąż poprawnie osiąga pozę (teraz TCP, nie frame 6).

**Kryterium oceny:** Round-trip `FK(q, toolOffset) → IK → q'` gdzie `q'` zbiega do jednej z gałęzi `q`. Wizualizacja pokazuje narzędzie jako dodatkowy segment po frame 6.

---

## Zadanie 6 — Symulacja trajektorii liniowej

**Poziom:** średni / wymagający

**Cel:** Obserwować ciągłość rozwiązania IK w funkcji ciągłej trajektorii TCP — i miejsca, w których gałąź się przełącza.

**Treść:**

1. Zdefiniuj dwa punkty w przestrzeni kartezjańskiej: `p_start = (0.4, 0.15, 0.3)`, `p_end = (0.25, −0.35, 0.55)`, orientacja stała (narzędzie w dół).
2. Zinterpoluj liniowo na `N = 200` kroków.
3. Dla każdego kroku wywołaj `solvePuma560Analytical` i wybierz rozwiązanie najbliższe poprzedniemu (przez `pickClosestSolution`).
4. Narysuj wykres `q(t)` dla wszystkich sześciu przegubów (użyj istniejącego `ConvergenceChart` jako wzorca).
5. Znajdź punkt, w którym następuje nieciągłość któregokolwiek `q_i` (np. skok ze 100° do −100°) — to wskazuje na zmianę gałęzi.

**Pliki:**
- `src/components/playground/trajectory-playback.tsx` (nowy)
- Podpięcie w `src/app/modules/2-analytical-playground/page.tsx`

**Podpowiedź:** Animacja już istnieje w `TrajectoryDemo` ale pokazuje cztery gałęzie jednocześnie. Twój komponent pokazuje jedną gałąź śledzoną + wykres q(t).

**Kryterium oceny:** Poprawny wykres `q(t)` z wyraźną zmianą gałęzi w momencie, gdy solver przełącza się między shoulder lub elbow. Opcjonalnie: adnotacja na wykresie „tutaj przełączenie gałęzi".

---

## Zadanie 7 — Weryfikacja na statystycznym zbiorze (10 000 przypadków)

**Poziom:** średni

**Cel:** Rozszerzyć `__smoke.ts` o prawdziwy test statystyczny i zmierzyć dystrybucję błędów.

**Treść:**

1. Skopiuj `src/lib/solvers/__smoke.ts` jako `__stress.ts`.
2. Wygeneruj 10 000 losowych konfiguracji `q` w ograniczeniach przegubowych (deterministycznie, mulberry32 z `benchmark.ts`).
3. Dla każdej: FK → T*, IK(T*), wybierz najbliższy q'.
4. Licz błąd `max_i |q_i − q'_i|` (wrap-aware).
5. Wypisz: mediana, p95, p99, maksimum; liczba przypadków z błędem > `10⁻⁹`.
6. Zidentyfikuj „outliery" (przypadki z największym błędem) i ręcznie sprawdź, czy są bliskie singularności.

**Pliki:**
- `src/lib/solvers/__stress.ts` (nowy)

**Podpowiedź:** Wykorzystaj istniejącą funkcję `generateBenchmark` z `src/lib/benchmark.ts`, ale z `n = 10000`.

**Kryterium oceny:** Raport wypisany na konsolę zawiera statystyki + sugestię, czy outliery są „prawdziwym błędem" (wtedy jest bug) czy są przy singularności (wtedy OK, tam się traci stopień swobody).

---

## Zadanie 8 — Manipulator 6-DOF z naruszoną formą A Piepera

**Poziom:** wymagający

**Cel:** Zrozumieć granice klasycznej dekompozycji wristowej i pokazać, że jest to **wybór wyprowadzenia, nie warunek istnienia** rozwiązania zamkniętego.

**Treść:** Stwórz hipotetyczny wariant Pumy, w którym ostatnie trzy osie **NIE** przecinają się w jednym punkcie — dodaj offset `d₅ = 0.05 m` do tabeli DH (w oryginale `d₅ = 0`). To „złamie" formę A Piepera.

1. Zmodyfikuj `PUMA560` jako `PUMA_OFFSET_WRIST` w `src/lib/robots/puma560.ts`.
2. Spróbuj uruchomić na nim `solvePuma560Analytical` — co się dzieje? (Odpowiedź: wzory zakładają `d₅ = 0`, więc dają wynik niezgodny z FK.) Wyjaśnij, **dlaczego** te konkretne wzory już nie działają — które kroki wyprowadzenia z modułu 1 wymagałyby modyfikacji?
3. Uruchom na zmienionym robocie solvery Jakobianowe (`dls`) — czy wciąż działają? Pokaż że tak, zmierz ile iteracji potrzebują względem oryginalnej Pumy.
4. **Bonusowo:** zastanów się i opisz krótko, jakie chwyty geometryczne pozwoliłyby wyprowadzić zamkniętą formułę dla `PUMA_OFFSET_WRIST` (podpowiedź: w UR5 i podobnych robotach z offsetem wrist używa się równania kwadratowego w `q₃` zamiast prostego prawa cosinusów; literatura: Hawkins 2013 "Analytical IK of UR5").
5. Napisz akapit interpretacyjny: dlaczego producenci celowo projektują geometrię tak, by spełniała formę A lub B Piepera? (odpowiedź: tańsze wyprowadzenie, bardziej kanoniczne wzory, łatwiejsze debugowanie sterownika).

**Pliki:**
- `src/lib/robots/puma560.ts` (dodanie wariantu)
- Ewentualnie test w `__smoke.ts`
- `docs/raport-zad8.md`

**Podpowiedź:** To zadanie ma pokazać, że **analityczne IK dla `PUMA_OFFSET_WRIST` istnieje** — Raghavan i Roth (1990) udowodnili, że dowolny 6-DOF ma co najwyżej 16 rzeczywistych rozwiązań i wszystkie da się wyznaczyć przez równanie 16. stopnia. Tylko że tym razem wyprowadzenie nie idzie tą prostą drogą co dla klasycznej Pumy. Solvery iteracyjne są tu **wygodniejszym narzędziem prototypowania**, nie *jedyną* opcją.

**Kryterium oceny:** Raport pokazuje (a) niepoprawny wynik gotowego analitycznego solvera (bo wzory zakładały `d₅ = 0`), (b) poprawny wynik DLS, (c) liczbę iteracji DLS porównaną z oryginalną Pumą. Akapit „bonus" wskazuje konkretną technikę wyprowadzenia zamkniętej formuły dla nowej geometrii.

---

## Zadanie 9 — Implementacja Inverse Jakobian w Pythonie (Pyodide)

**Poziom:** wymagający

**Cel:** Porównać implementację TS vs Python dla solverów iteracyjnych (obecnie tylko analityczny jest dostępny w Pyodide).

**Treść:** Rozszerz `public/pyodide-worker.js` o Python-ową wersję DLS:

1. Napisz `solve_dls(target, seed, max_iter, tol, lam)` w Pythonie — z NumPy dla Jakobianu.
2. Udostępnij ją w kliencie przez `pySolveDLS()` w `src/lib/pyodide/client.ts`.
3. Dodaj kolumnę „Python DLS" do `DualRuntimeComparison` lub zrób osobne porównanie w module 3.
4. Porównaj czasy: Pyodide DLS (WebAssembly) vs natywny TS DLS — która jest szybsza?

**Pliki:**
- `public/pyodide-worker.js` (dodanie funkcji Python)
- `src/lib/pyodide/client.ts` (nowa metoda)
- `src/components/pyodide/...` (UI)

**Podpowiedź:** Numpy w Pyodide nie jest szybkie (WebAssembly + overhead serializacji). Spodziewaj się że TS będzie szybszy dla małych macierzy 6×6. To edukacyjne — pokazuje koszt uruchomienia Pythona w przeglądarce.

**Kryterium oceny:** Działa, porównanie czasów jest w tabeli. Dyskusja w raporcie: „kiedy warto używać Python/Pyodide a kiedy nie".

---

## Zadanie 10 — Własna miara wyboru rozwiązania

**Poziom:** wymagający

**Cel:** Eksperymentować z alternatywnymi funkcjami kosztu dla selekcji praktycznej rozwiązania IK.

**Treść:** W module 2 cookbook'u (rozdz. 11) podano standardową heurystykę:

```
q* = argmin  Σᵢ wᵢ · wrap_π(qᵢ − qᵢ_current)²
```

Zaproponuj i zaimplementuj **trzy** alternatywne miary:

1. **Miara energetyczna** — karze dużymi kątami (ramię ustawia się jak najbliżej „neutralnego" zera): `Σᵢ q_i²`
2. **Miara manipulacyjności** — preferuje konfiguracje dalekie od singularności: `−log(det(J·Jᵀ) + ε)`
3. **Miara hybrydowa** — suma powyższych z wagami.

Dla każdej miary:

1. Zaimplementuj w `src/lib/solvers/branch-selection.ts` (nowy plik).
2. Dla zbioru 100 losowych poz porównaj, którą gałąź każda miara wybiera.
3. Wizualnie w aplikacji pokaż różnice — dla tej samej pozy i seeda, różne wyniki selekcji.

**Pliki:**
- `src/lib/solvers/branch-selection.ts` (nowy)
- `src/components/...` (UI w module 2 z przełącznikiem miary)

**Podpowiedź:** Manipulacyjność możesz wziąć z `src/lib/math/jacobian.ts` (funkcja `manipulability`). Dla numerycznej stabilności dodaj `ε = 10⁻⁶` pod logarytmem.

**Kryterium oceny:** Trzy miary zaimplementowane i porównane. W `docs/raport-zad10.md`: wnioski — która miara dla jakiego zastosowania.

---

## Klucz punktowania (sugerowany)

| Zadanie | Punkty | Trudność |
|---------|--------|----------|
| 1 — Uproszczona Puma | 10 | łatwe |
| 2 — Filtr limitów | 10 | łatwe |
| 3 — Planarne 3R | 15 | średnie |
| 4 — Singularność pinv | 15 | średnie |
| 5 — Tool offset | 20 | średnie |
| 6 — Trajektoria | 20 | średnie |
| 7 — Test statystyczny | 20 | średnie |
| 8 — Naruszona forma A Piepera | 25 | trudne |
| 9 — DLS w Pythonie | 25 | trudne |
| 10 — Miary selekcji | 30 | trudne |

Łącznie: 190 punktów. Kolokwium zaliczeniowe: 100 punktów (wybór 4–5 zadań).

---

## Format oddania

Dla każdego zadania:

1. **Kod** — w branchy na Git, PR z opisem zmian i testów.
2. **Raport** (jeśli wymagany) — `docs/raport-zadX.md`, 1–2 strony Markdown z opisem podejścia, wyników i wniosków.
3. **Demo na żywo** — na laboratorium uruchom `npm run dev` i pokaż prowadzącemu działanie funkcjonalności.

Wszystkie zadania są rozszerzeniami istniejącej aplikacji IK Platform — nie ma potrzeby pisania od zera. Korzystaj z istniejącego kodu jako wzorca, ale **nie kopiuj ślepo** — rozumiej, co robisz.
