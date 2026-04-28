# Odwrotna kinematyka analityczna — przepis postępowania

Skondensowana instrukcja krok po kroku, jak wyprowadzić rozwiązanie zamknięte IK dla manipulatora szeregowego 6-DOF — na przykładzie Pumy560 (forma A warunku Piepera, czyli wrist-decoupling). Ta sama metodologia z drobnymi modyfikacjami stosuje się do robotów z formą B (3 osie równoległe, np. UR5) oraz innych geometrii dających się rozłożyć. Źródła: Craig *Introduction to Robotics* (wyd. 3, §4.7), praca inżynierska [327736] rozdz. 6.4, implementacja w `src/lib/solvers/analytical-puma560.ts`.

> **Uwaga terminologiczna.** Warunek Piepera jest **wystarczający, nie konieczny**. Manipulator nie spełniający żadnej z dwóch klasycznych form (intersect / parallel) wciąż może mieć rozwiązanie zamknięte — Raghavan i Roth (1990) udowodnili, że dowolny 6-DOF ma co najwyżej 16 rzeczywistych rozwiązań i wszystkie da się wyznaczyć przez równanie 16. stopnia. Po prostu wyprowadzenie wymaga wtedy zaawansowanych narzędzi (rezultanty Sylvestera, redukcja Bézoutowska) zamiast geometrii szkolnej.

Dokument jest uzupełnieniem do modułu 1 w aplikacji (`/modules/1-analytical-walkthrough`) i planu wykładu (`plan-wykladu.md`).

---

## 1. Co musisz mieć przed startem

### 1.1 Model kinematyczny w notacji DH (Craig / zmodyfikowanej)

**Tabela parametrów Pumy560** (Craig, §3.8):

| i | α_{i−1} | a_{i−1} [m] | d_i [m] | θ_i (zmienna) |
|---|---------|-------------|---------|---------------|
| 1 | 0       | 0           | 0       | q₁            |
| 2 | −π/2    | 0           | 0       | q₂            |
| 3 | 0       | a₂ = 0.4318 | d₃ = 0.1254 | q₃       |
| 4 | −π/2    | a₃ = 0.0203 | d₄ = 0.4318 | q₄       |
| 5 | π/2     | 0           | 0       | q₅            |
| 6 | −π/2    | 0           | 0       | q₆            |

**Uwaga o indeksowaniu:** `α` i `a` mają indeks `i−1`, `d` i `θ` — indeks `i`. Jest to specyfika modyfikowanej konwencji Craiga (patrz moduł 1, sekcja „Klasyczna vs zmodyfikowana konwencja DH").

### 1.2 Macierz transformacji ogniwa

Modyfikowana DH:

```
            Rot_x(α_{i-1})                    Trans_x(a_{i-1})
T_{i-1}^i = ────────────── · Trans_x(a_{i-1}) · Rot_z(θ_i) · Trans_z(d_i)

            ┌ cθ          -sθ           0       a_{i-1}       ┐
          = │ sθ·cα       cθ·cα        -sα     -sα·d_i       │
            │ sθ·sα       cθ·sα         cα      cα·d_i       │
            └ 0            0            0       1            ┘
```

gdzie `cθ = cos θ_i`, `sθ = sin θ_i`, `cα = cos α_{i-1}`, `sα = sin α_{i-1}`.

### 1.3 Rozpoznaj geometryczne uproszczenia

Wyjrzyj na geometrię robota: **czy trzy kolejne osie obrotu przecinają się w jednym punkcie, albo są wzajemnie równoległe?** To dwie formy warunku Piepera (1968), które **gwarantują** dekompozycję pozycja+orientacja i bardzo upraszczają wyprowadzenie:

- **Forma A — przecinające się osie.** Dla Pumy560 osie q₄, q₅, q₆ przecinają się w **środku nadgarstka** (`d₅ = 0`, `a₄ = 0`, `a₅ = 0` → frame 4, 5, 6 współdzielą początek). Pozycja środka zależy tylko od q₁, q₂, q₃, więc 6-DOF rozkłada się na dwa łatwiejsze 3-DOF.
- **Forma B — równoległe osie.** Dla UR5 osie q₂, q₃, q₄ są wzajemnie równoległe. W tej rodzinie używa się innego chwytu geometrycznego (rzutowanie na płaszczyznę prostopadłą do wspólnego kierunku osi), dochodzi się również do rozwiązania zamkniętego.

Jeśli **żadna** z form nie jest spełniona — to **nie znaczy**, że rozwiązanie analityczne nie istnieje. Po prostu wyprowadzenie nie idzie najprostszą drogą i wymaga ogólniejszych technik (Raghavan–Roth: redukcja do równania 16. stopnia w jednej zmiennej, rozwiązywalna numerycznie ale wciąż w czasie stałym i z odzyskaniem wszystkich gałęzi). W praktyce tę pracę robi się raz, dla danej rodziny robotów; potem wynik rozprowadza się jako gotowy wzór do użycia online.

W dydaktyce skupiamy się na formie A (Puma) — daje najbardziej kanoniczne wyprowadzenie z geometrii szkolnej. Forma B i przypadek ogólny to materiał na osobne zajęcia. Solvery numeryczne z modułu 3 są **alternatywą wygodniejszą w prototypowaniu** (nie wymagają wyprowadzania), nie zaś jedyną opcją dla geometrii bez Piepera.

---

## 2. Dane wejściowe

Poza docelowa efektora jako macierz `T*` ∈ SE(3):

```
         ┌ r₁₁  r₁₂  r₁₃   x  ┐
T*  =    │ r₂₁  r₂₂  r₂₃   y  │
         │ r₃₁  r₃₂  r₃₃   z  │
         └ 0    0    0    1   ┘
```

Pierwsze trzy kolumny × wiersze = macierz orientacji `R`, ostatnia kolumna = wektor pozycji `p = (x, y, z)`.

---

## 3. Krok 0 — Sprowadzenie pozy do układu wrist

Jeśli robot ma stały offset narzędzia `T_tool` (układ TCP względem układu {6}):

```
T₀⁶ = T* · T_tool⁻¹
```

Dla Pumy560 z d₆ = 0 i bez narzędzia: `T₀⁶ = T*`. Ekstrahuj z `T₀⁶`:

```
R = T₀⁶[0:3, 0:3]       (macierz 3×3)
p = T₀⁶[0:3, 3]         (wektor 3×1 = (x, y, z))
```

**Identyczność kluczowa:** dla Pumy `d₆ = 0`, więc środek nadgarstka `p_wc ≡ p`. W ogólności: `p_wc = p − d₆·R·ẑ`.

---

## 4. Krok 1 — Wyprowadzenie wzorów na pozycję p_wc

Rozpisując iloczyn `T₀¹ · T₁² · T₂³ · T₃⁴` symbolicznie i izolując ostatnią kolumnę:

```
p_x = c₁·(a₂·c₂ + a₃·c₂₃ − d₄·s₂₃) − d₃·s₁
p_y = s₁·(a₂·c₂ + a₃·c₂₃ − d₄·s₂₃) + d₃·c₁
p_z = −a₂·s₂ − a₃·s₂₃ − d₄·c₂₃
```

gdzie `c_i = cos q_i`, `s_i = sin q_i`, `c₂₃ = cos(q₂+q₃)`, `s₂₃ = sin(q₂+q₃)`.

**Skrót:**

```
ρ ≡ a₂·c₂ + a₃·c₂₃ − d₄·s₂₃          (to sama wielkość co w równaniach p_x, p_y)
```

**Kluczowa identyczność** (Pitagoras: pomnóż pierwsze równanie przez c₁, drugie przez s₁, dodaj — dostaniesz `p_x·c₁ + p_y·s₁ = ρ`; pomnóż pierwsze przez −s₁, drugie przez c₁, dodaj — dostaniesz `−p_x·s₁ + p_y·c₁ = d₃`; podnieś oba do kwadratu i sumuj):

```
╔════════════════════════════╗
║  p_x² + p_y² = ρ² + d₃²    ║   ← SERCE METODY
╚════════════════════════════╝
```

Lewa strona zawiera tylko znane liczby. Prawa — tylko `ρ`. Dzięki temu `ρ` liczymy natychmiast.

---

## 5. Krok 2 — Wyznaczenie q₁ (dwie gałęzie: shoulder)

Z identyczności Pitagorasa:

```
ρ = ±√(p_x² + p_y² − d₃²)
```

**Warunek osiągalności:** `p_x² + p_y² ≥ d₃²`. Jeśli nie spełniony — cel jest w „zakazanym" cylindrze wokół osi bazy, IK **nie ma rozwiązania**.

Każdy znak `ρ` daje osobną gałąź:

- `ρ > 0` → **shoulder right** (bark zwraca się w stronę celu)
- `ρ < 0` → **shoulder left** (bark odwraca się o ~180°)

Rozwiązujemy układ liniowy:

```
 p_x·c₁ + p_y·s₁ = ρ
−p_x·s₁ + p_y·c₁ = d₃
```

Wynik zapisujemy jako różnicę dwóch `atan2`:

```
╔═══════════════════════════════════════════════════════════╗
║  q₁ = atan2(p_y, p_x) − atan2(d₃, ρ)                      ║
╚═══════════════════════════════════════════════════════════╝
```

**Dlaczego różnica, nie prosta `atan2`?** Robot ma boczne odsadzenie `d₃`. Bez korekty `atan2(d₃, ρ)` otrzymamy kąt do celu w XY — ale to nie jest kąt przegubu `q₁`, bo przegub 1 jest przesunięty od linii „bark → cel" o `d₃`.

**Ostrzeżenie:** w uproszczonych modelach bez `d₃` (np. w pracy [327736]) wzór redukuje się do `q₁ = atan2(p_y, p_x)`. Nie stosuj tej formy dla pełnej Pumy560 — wprowadzi błąd ~7°.

---

## 6. Krok 3 — Efektywna długość przedramienia

Wrist centre nie leży na prostym przedłużeniu ramienia. Boczny offset `a₃` plus przedramię `d₄` (wzdłuż ortogonalnej osi) dają razem:

```
L = √(a₃² + d₄²)     (efektywna długość przedramienia)
β = atan2(d₄, a₃)   (stałe odchylenie)
```

Dla Pumy: `L ≈ 0.4323 m`, `β ≈ 87.3°`.

W uproszczonych modelach bez `a₃` (jak w [327736]): `L = d₄`, `β = π/2`.

---

## 7. Krok 4 — Wyznaczenie q₃ (dwie gałęzie: elbow)

Z równań pozycji z kroku 1 biorąc `ρ` i `p_z`, podnosząc do kwadratu i sumując, po uproszczeniu:

```
ρ² + p_z² = a₂² + a₃² + d₄² + 2·a₂·(a₃·c₃ − d₄·s₃)
```

Oznaczmy:

```
K = (ρ² + p_z² − a₂² − a₃² − d₄²) / (2·a₂)
```

Wtedy `K = a₃·c₃ − d₄·s₃`, co z tożsamości kombinacji sinusa i cosinusa:

```
a₃·cos q₃ − d₄·sin q₃ = L·cos(q₃ + β)
```

daje `cos(q₃+β) = K/L` i `sin(q₃+β) = ±√(1 − K²/L²)`. Finalnie:

```
╔════════════════════════════════════════════════════════════════╗
║  q₃ = atan2(±√(L² − K²), K) − β                               ║
╚════════════════════════════════════════════════════════════════╝
```

- Znak `+` → **elbow up**
- Znak `−` → **elbow down**

**Warunek osiągalności dla danej gałęzi barku:** `L² ≥ K²`. Jeśli nie — ramię za krótkie/za długie, kombinacja shoulder+elbow nie ma rozwiązania, przejdź do następnej.

---

## 8. Krok 5 — Wyznaczenie q₂ (układ liniowy 2×2)

Mając `q₃`, zdefiniuj pomocnicze:

```
M = a₂ + a₃·c₃ − d₄·s₃
N = a₃·s₃ + d₄·c₃
```

Równania pozycji z kroku 1, po rozwinięciu `c₂₃`, `s₂₃`, przyjmują zwartą postać:

```
 ρ   =  M·c₂ − N·s₂
p_z  = −M·s₂ − N·c₂
```

To jest układ liniowy 2×2 w niewiadomych `(c₂, s₂)`. Rozwiąż Cramerem:

```
Δ = M² + N²       (zawsze dodatnie dla realnych parametrów)

c₂ = (M·ρ − N·p_z) / Δ
s₂ = (−M·p_z − N·ρ) / Δ

╔═══════════════════════════════════╗
║  q₂ = atan2(s₂, c₂)              ║
╚═══════════════════════════════════╝
```

**Dlaczego `atan2` na parze `(s₂, c₂)`, a nie `arccos(c₂)` lub `arcsin(s₂)`?** Bo `arccos`/`arcsin` zwracają tylko połowę okręgu — tracimy informację o ćwiartce. `atan2` patrzy na znaki obu argumentów i zwraca poprawny kąt w pełnym `(−π, π]`.

---

## 9. Krok 6 — Macierz R₀³ i residuum orientacji

Z parametrów DH i znanych `q₁, q₂, q₃`:

```
R₀³ = R_z(q₁) · R_x(−π/2) · R_z(q₂ + q₃)

        ┌ c₁·c₂₃   −c₁·s₂₃   −s₁ ┐
R₀³ =   │ s₁·c₂₃   −s₁·s₂₃    c₁ │
        └ −s₂₃     −c₂₃       0  ┘
```

Residuum orientacji, które musi dostarczyć nadgarstek:

```
╔══════════════════════════════════╗
║  R₃⁶ = (R₀³)ᵀ · R                ║
╚══════════════════════════════════╝
```

**Wykorzystaj ortogonalność:** `(R₀³)⁻¹ = (R₀³)ᵀ`. Nie wywołuj numerycznego `inv()` — to strata mocy obliczeniowej i źródło błędów zmiennoprzecinkowych.

---

## 10. Krok 7 — Wyznaczenie q₄, q₅, q₆

Struktura `R₃⁶` po wymnożeniu trzech rotacji nadgarstka:

```
         ┌ c₄·c₅·c₆ − s₄·s₆     −c₄·c₅·s₆ − s₄·c₆    −c₄·s₅ ┐
R₃⁶ =   │ s₅·c₆                −s₅·s₆                c₅   │
         └ −s₄·c₅·c₆ − c₄·s₆    s₄·c₅·s₆ − c₄·c₆     s₄·s₅  ┘
```

**Dostęp do q₅** — środkowa kolumna i środkowy wiersz:

```
|sin q₅| = √(R³⁶[1][0]² + R³⁶[1][1]²)
cos q₅   = R³⁶[1][2]

q₅ = atan2(±|sin q₅|, R³⁶[1][2])      ← dwa znaki → wrist noflip/flip
```

**Dostęp do q₄ i q₆** (dla `sin q₅ ≠ 0`, czyli poza singularnością):

```
q₄ = atan2(±R³⁶[2][2], ∓R³⁶[0][2])
q₆ = atan2(∓R³⁶[1][1], ±R³⁶[1][0])
```

Górne znaki → gałąź **noflip**, dolne → **flip**.

**Singularność nadgarstka** (`sin q₅ ≈ 0`):

Środkowy wiersz i kolumna `R³⁶` się zerują (poza `c₅ = ±1`). `R³⁶` redukuje się do rotacji sumy `q₄ + q₆` wokół osi z. Tracimy stopień swobody — pojedynczo `q₄` i `q₆` są nieokreślone, określona jest tylko ich suma.

**Implementacja:** sprawdź `|sin q₅| < ε` (np. `ε = 10⁻⁶`). Jeśli tak — wybierz umownie `q₄ = 0`:

```
q₄ = 0
q₅ = atan2(0, R³⁶[1][2])     // 0 lub ±π
q₆ = atan2(−R³⁶[0][1], R³⁶[0][0])
```

---

## 11. Krok 8 — Enumeracja i selekcja

Trzy niezależne binarne decyzje → do **ośmiu rozwiązań**:

```
(shoulder ∈ {right, left})  ×  (elbow ∈ {up, down})  ×  (wrist ∈ {noflip, flip})
```

W praktyce bywa mniej:
- Ujemny dyskryminant w kroku 4 (`L² − K² < 0`) eliminuje parę shoulder+elbow.
- Singularność nadgarstka zlewą dwie gałęzie wrist w jedną.

### Kryteria selekcji praktycznej

```
q* = argmin_{q ∈ S(T*)}  Σᵢ wᵢ · wrap_π(qᵢ − qᵢ_current)²
```

gdzie `S(T*)` to zbiór do 8 rozwiązań, `wᵢ` — wagi per przegub (często `wᵢ = 1`), a `wrap_π` — zawinięcie kąta do `(−π, π]`:

```
wrap_π(x) = x − 2π · floor((x + π) / 2π)
```

**Dodatkowe kryteria** (po minimalizacji):
- Ograniczenia przegubowe — odrzuć `q` poza `[q_min, q_max]`.
- Kolizje — zewnętrzny kolizji checker.
- Manipulacyjność — preferuj `q` z `w(q) = √det(JJᵀ)` powyżej progu.
- Ciągłość trajektorii — nie zmieniaj gałęzi między krokami.

---

## 12. Weryfikacja implementacji

### Round-trip FK → IK → FK

```
Dla losowego q_true ∈ Q:
  1. Oblicz T = FK(q_true)
  2. Uruchom IK: S = IK(T)
  3. Dla każdego q* ∈ S oblicz T* = FK(q*)
  4. Sprawdź ‖T* − T‖ < 10⁻¹⁰

Co najmniej JEDNO q* ∈ S powinno być bliskie q_true (mod 2π).
```

Dla implementacji w `src/lib/solvers/analytical-puma560.ts` i `src/lib/solvers/__smoke.ts` ten test przechodzi na 6 przypadkach z błędem rzędu `10⁻¹⁴` (precyzja zmiennoprzecinkowa).

### Test cross-runtime

Zaimplementuj to samo w dwóch językach (TS, Python). Uruchom oba na tej samej pozie. Maksimum `|q_TS − q_PY|` powinno być poniżej `10⁻¹²`. W naszej aplikacji to zrobione w module 1 (sekcja „Ten sam solver, dwa języki").

---

## 13. Najczęstsze pułapki

| Pułapka | Objaw | Remedium |
|---------|-------|----------|
| Brak korekty o `d₃` w q₁ | Stały błąd ~7° w q₁ | Pełny wzór `q₁ = atan2(p_y, p_x) − atan2(d₃, ρ)` |
| Nieuwzględnienie offsetu `a₃` w L | Nieciągłość wyników | `L = √(a₃² + d₄²)`, `β = atan2(d₄, a₃)` |
| Używanie `arccos`/`arcsin` zamiast `atan2` | Nieciągłości na granicach ćwiartek | Zawsze `atan2(s, c)` |
| Porównanie `\|q₅\| < ε` zamiast `\|sin q₅\| < ε` | Fałszywa detekcja singularności | Użyj `hypot(R³⁶[1][0], R³⁶[1][1]) < ε` |
| Globalne wrap kątów do `[0, 2π)` w pętli | Dyskontynuacje trajektorii | Wrap dopiero przy selekcji (wrap_π) |
| Używanie `inv(R₀³)` zamiast `transpose(R₀³)` | Błąd numeryczny + wolno | `R₀³` jest ortogonalna — `inv = transpose` |

---

## 14. Rozszerzenia

Gdy zrozumiesz przypadek Pumy560, te rozszerzenia są naturalne:

1. **Tool offset.** Cofnij się o `T_tool⁻¹` z zadanej pozy na starcie (krok 0). Reszta wyprowadzenia bez zmian.
2. **Base offset.** Jeśli baza robota jest podniesiona/obrócona — `T_base` jest stałą macierzą. Algorytm IK pracuje wtedy z `T_target_in_base = T_base⁻¹ · T_target_in_world`.
3. **Limity przegubowe.** Po wygenerowaniu 8 rozwiązań, odrzuć te, w których jakieś `q_i ∉ [q_min, q_max]`. Pilnuj wrap do przedziału — niektóre limity są szerokie (`q₆ ∈ ±265°` dla Pumy), więc `q_i + 2π` może być dopuszczalne.
4. **Redundancja (7 DOF).** Dla 7-DOF manipulatora z geometrią Pumy-like + dodatkowy przegub obrotowy w ramieniu: paramtryzujesz jeden stopień swobody (np. „kąt łokcia" jako parametr `ψ`) i otrzymujesz *rodzinę* rozwiązań, a nie skończony zbiór. Patrz np. KUKA LBR iiwa.

---

## 15. Literatura

- **Craig J.J.** *Introduction to Robotics: Mechanics and Control*, 3ᵣd ed., Pearson 2005, §4.7 — kanoniczny wykład analitycznej IK dla Pumy560.
- **Paul R.P.** *Robot Manipulators: Mathematics, Programming, and Control*, MIT Press 1981 — historyczny początek „metody Paula" (sukcesywne odwracanie macierzy).
- **Spong M.W., Hutchinson S., Vidyasagar M.** *Robot Modeling and Control*, Wiley 2006 — alternatywna prezentacja w klasycznej konwencji DH.
- **Pieper D.L.** *The Kinematics of Manipulators Under Computer Control*, Ph.D. thesis Stanford 1968 — pierwotne sformułowanie warunku Piepera.
- **Praca inżynierska [327736]**, rozdz. 6.4 (s. 60–66) — polskojęzyczna implementacja dla uproszczonej Pumy, z naciskiem na aplikację sterującą.
- **Implementacja referencyjna w tym projekcie:** `src/lib/solvers/analytical-puma560.ts`, z testem round-trip w `src/lib/solvers/__smoke.ts`.

---

## 16. Minimalny checklist dla studenta

Jeśli realizujesz projekt/ćwiczenie z IK analitycznej, upewnij się, że Twoja implementacja:

- [ ] zwraca **wszystkie** rozwiązania (do 8), nie jedno;
- [ ] poprawnie **etykietuje** gałęzie (shoulder/elbow/wrist);
- [ ] używa `atan2` wszędzie, nie `arctan` / `arcsin` / `arccos`;
- [ ] wykrywa singularność nadgarstka przez `hypot` dwóch elementów macierzy;
- [ ] przechodzi round-trip FK → IK → FK z błędem < `10⁻¹⁰` na kilkudziesięciu losowych przypadkach;
- [ ] radzi sobie z targetami poza osiągalnością (zwraca pusty zbiór, nie NaN/crash);
- [ ] nie używa numerycznego `inv()` gdy wystarczy `transpose()`;
- [ ] selekcja rozwiązania (jeśli potrzebna) jest wyraźnie oddzielona od samego IK.
