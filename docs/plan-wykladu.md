# Plan wykładu — Odwrotna kinematyka metodą analityczną (Puma560)

**Czas:** 90 min (jeden blok wykładowy) + ewentualne 45 min ćwiczeń
**Odbiorca:** studenci 3–5 sem. specjalności „automatyka i robotyka" z opanowanym materiałem kinematyki prostej, DH i rachunku macierzowego
**Wyposażenie:**
- projektor, komputer z uruchomioną aplikacją IK Platform (`npm run dev`)
- ewentualnie tablica do dodatkowych rachunków
- każdy student z własnym laptopem (opcjonalnie) — aplikacja działa w przeglądarce

---

## Cele dydaktyczne

Po wykładzie student potrafi:

1. Sformułować problem IK jako zadanie odwrócenia odwzorowania `f: Q → SE(3)`.
2. Rozpoznać, kiedy istnieje rozwiązanie zamknięte (warunek Piepera).
3. Wyprowadzić samodzielnie wzory na `q₁, q₂, q₃` z pozycji środka nadgarstka dla manipulatora spełniającego warunek Piepera.
4. Wydobyć `q₄, q₅, q₆` z macierzy `R₃⁶` — rozumie związek z kątami Eulera.
5. Enumerować osiem gałęzi rozwiązania i rozróżniać kryteria selekcji praktycznej.
6. Zidentyfikować singularność nadgarstka i wyjaśnić, dlaczego traci się tam stopień swobody.

---

## Struktura czasowa

| Blok | Czas | Aktywność |
|------|------|-----------|
| 1 | 0–8 min | Wprowadzenie i motywacja |
| 2 | 8–15 min | Przypomnienie FK i DH (Moduł 0 w aplikacji) |
| 3 | 15–25 min | Problem IK — postawienie i klasyfikacja metod |
| 4 | 25–32 min | Warunek Piepera i dekompozycja kinematyczna |
| 5 | 32–60 min | **Wyprowadzenie IK dla Pumy560 — 8 kroków** (serce wykładu) |
| 6 | 60–72 min | Osiem rozwiązań, selekcja, singularność nadgarstka |
| 7 | 72–82 min | Weryfikacja: TS vs Python, porównanie z wyprowadzeniem z [327736] i [Craig] |
| 8 | 82–90 min | Podsumowanie, co dalej, pytania |

---

## BLOK 1 — Wprowadzenie (8 min)

**Pokaż:** stronę główną aplikacji `/` (siatka ośmiu modułów).

**Co powiedzieć:**

> „Dziś zajmiemy się zagadnieniem, które w podręczniku Craiga stanowi rozdział 4 — odwrotnym zadaniem kinematyki. Robot Puma560, na którym będziemy pracować, to klasyka — maszyna z połowy lat 80., ale jej struktura kinematyczna jest niezwykle wygodna dydaktycznie i do dziś stosowana jako przykład w każdym podręczniku robotyki."

**Postaw pytanie wstępne:**

> „Mamy robota. Chcemy, żeby końcówka (TCP) znalazła się tam, gdzie położymy palec. Jak obliczyć, w jakich kątach muszą ustawić się przeguby?"

**Wyjaśnij pojęcia:**
- **Kinematyka prosta (FK):** dane kąty → pozycja końcówki. Dzieci zabawy, iloczyn macierzy.
- **Kinematyka odwrotna (IK):** dana pozycja końcówki → kąty. To jest zadanie, które będziemy dziś rozwiązywać.

**Motywacja praktyczna:** w aplikacjach przemysłowych operator/planer programuje zadanie w przestrzeni kartezjańskiej („idź do punktu X z orientacją R") — sterownik robota w ułamku sekundy musi przeliczyć to na kąty przegubów. IK to serce sterownika.

---

## BLOK 2 — Przypomnienie FK i DH (7 min)

**Pokaż:** moduł `/modules/0-intro` — przewiń do interaktywnego panelu Pumy.

**Co zrobić na żywo:**

1. Ruszaj suwakami `θ₁, θ₂, θ₃` i pokazuj, jak efektor (czerwona kulka) zmienia pozycję.
2. Wskaż numerycznie wyświetlaną pozę `T₀⁶` — macierz 4×4.
3. Przypomnij strukturę macierzy jednorodnej:
   - Blok 3×3 w lewym górnym rogu — macierz obrotu `R ∈ SO(3)` (orientacja)
   - Prawa kolumna — wektor przesunięcia `p ∈ ℝ³` (pozycja)
   - Ostatni wiersz `[0 0 0 1]` — stały

**Co powiedzieć:**

> „Iloczyn sześciu macierzy 4×4 daje nam T₀⁶ — pełną transformację z bazy robota do końcówki. Każda z tych macierzy opisana jest przez cztery parametry Denavita–Hartenberga — `α_{i-1}, a_{i-1}, d_i, θ_i`. Pierwsze trzy są stałe (geometria robota), czwarta — `θ_i` — to zmienna konfiguracyjna, którą chcemy wyznaczyć."

**Pokaż:** moduł `/modules/1-analytical-walkthrough` — przewiń do sekcji „Geometria Pumy560 w konwencji DH (Craig)".

Zwróć uwagę na:
- **Diagram czterech parametrów DH** (rysunek z Commons, PD/Jahobr) — interpretacja geometryczna α (skręcenie), a (długość ogniwa), d (odsadzenie), θ (kąt przegubu).
- **Sekcję „Klasyczna vs zmodyfikowana konwencja DH"** — ostrzeż studentów, że w różnych książkach indeksy różnią się o 1. Używamy Craiga — `α_{i−1}, a_{i−1}, d_i, θ_i`.

**Podkreśl:** praca [327736] na s. 58–59 opisuje dokładnie tę samą konwencję — to standard w polskiej literaturze inżynierskiej.

---

## BLOK 3 — Problem IK, klasyfikacja metod (10 min)

**Wróć do tablicy.** Napisz formalnie:

```
f: Q → SE(3),   gdzie Q ⊂ ℝ⁶ (przestrzeń konfiguracji),   SE(3) ≅ ℝ³ × SO(3)

FK:  q ↦ T = f(q)          — łatwe (jednoznaczne, gładkie, iloczyn macierzy)
IK:  T ↦ q = f⁻¹(T)        — TRUDNE
```

**Dlaczego trudne?** (wypisuj po kolei)

1. **Nieliniowość.** Równania zawierają `sin`, `cos` splecione w sześciu zmiennych — nie ma ogólnej formuły algebraicznej.
2. **Wielokrotność.** Dla typowego 6-DOF manipulatora istnieje **do ośmiu** różnych konfiguracji osiągających tę samą pozę TCP. Nie „istnieje rozwiązanie" — istnieje *zbiór* rozwiązań.
3. **Osiągalność.** Zbiór dostępnych poz jest ograniczony geometrycznie. Cel poza przestrzenią roboczą — brak rozwiązań.
4. **Singularności.** W niektórych konfiguracjach macierz Jakobianu traci rząd — tracimy stopień swobody lokalnie.

**Pokaż:** tabelę klasyfikacji metod w Module 0 (sekcja „Klasyfikacja metod IK"). Omów pięć rodzin:

| Rodzina | Reprezentanci | Plus | Minus |
|---------|---------------|------|-------|
| Analityczne | Pieper, Paul | Dokładne, µs, wszystkie rozwiązania | Tylko dla robotów spełniających warunek |
| Jakobianowe | DLS, pinv | Dowolny robot, płynne trajektorie | Singularności, lokalne |
| Optymalizacyjne | SQP, NM | Elastyczne (dowolne koszty) | Wolne |
| Data-driven | MLP, IKFlow | Multi-modalne, µs inferencja | Koszt treningu, ekstrapolacja |
| Hybrydowe | NN+DLS | Praktyczny kompromis | Implementacja |

**Zapowiedź:**

> „Dziś skupiamy się na pierwszej rodzinie — **analitycznej**. To jest klasa metod, które dają nam dokładne rozwiązanie w czasie stałym, niezależnie od pozycji startowej. Ograniczenie: robot musi spełniać tzw. warunek Piepera."

---

## BLOK 4 — Warunek Piepera i dekompozycja (7 min)

**Pokaż:** w module 1 schemat `PieperSchematic` — trzy osie q₄, q₅, q₆ przecinające się w punkcie.

**Sformułuj warunek:**

> „Jeżeli trzy kolejne osie obrotu manipulatora przecinają się w jednym punkcie **lub** są wzajemnie równoległe, problem IK ma rozwiązanie zamknięte."

**Dla Pumy 560:** spełniony. Osie q₄, q₅, q₆ przecinają się w **środku nadgarstka** (ang. *wrist centre*). Nazwijmy ten punkt `p_wc`.

**Kluczowa obserwacja** (pokazać na rysunku):

> „Obrót wokół osi przechodzącej przez punkt nie przesuwa tego punktu. Osie q₄, q₅, q₆ wszystkie przechodzą przez `p_wc`. Zatem **położenie środka nadgarstka nie zależy od q₄, q₅, q₆** — zależy tylko od q₁, q₂, q₃."

**To jest serce metody** — zapisz to dużymi literami na tablicy:

```
DEKOMPOZYCJA KINEMATYCZNA (Pieper):

Zadanie 6-DOF   =   [Pozycja p_wc = p_wc(q₁, q₂, q₃)]   +   [Orientacja R]
                         ↓                                      ↓
                      3 równania                           3 równania
                      (3 niewiadome)                       (3 niewiadome)
```

**Dla Pumy w konwencji Craiga:** `d₆ = 0`, więc `p_wc = p` (pozycja efektora).

> „Dzięki temu najpierw szukamy q₁, q₂, q₃ takich, że pozycja wrist centre pokrywa się z zadanym `p`. Mając je, mamy też macierz `R₀³`. Resztę orientacji nadgarstek musi doprowadzić przez q₄, q₅, q₆ — w macierzy `R₃⁶ = (R₀³)ᵀ·R`."

---

## BLOK 5 — Wyprowadzenie IK dla Pumy560 (28 min)

**Serce wykładu.** Przechodzimy przez osiem kroków modułu 1 w aplikacji.

**Metodologia dla każdego kroku:**
1. Wyprowadź na tablicy (2–3 min)
2. Pokaż odpowiedni `StepPanel` w aplikacji — wzór + fragment kodu
3. Zmień pozę docelową w panelu „Poza docelowa" i obserwuj, jak liczby się przeliczają

### Krok 0 — Izolacja pozy wrist (2 min)

```
T₀⁶ = T* · T_tool⁻¹         (dla Pumy T_tool = I, więc T₀⁶ = T*)
R = extractRotation(T₀⁶)
p = extractPosition(T₀⁶)
```

**Pokaż:** `StepPanel` numer 0. Podkreśl: „pozycja wrist centre = pozycja TCP tylko dla d₆ = 0".

### Krok 1 — Wzór na pozycję wrist centre (4 min)

Rozpisz na tablicy (od razu wynik, nie mnożenie macierzy):

```
p_x = c₁(a₂c₂ + a₃c₂₃ − d₄s₂₃) − d₃s₁
p_y = s₁(a₂c₂ + a₃c₂₃ − d₄s₂₃) + d₃c₁
p_z = −a₂s₂ − a₃s₂₃ − d₄c₂₃
```

**Trik:** oznaczmy `ρ = a₂c₂ + a₃c₂₃ − d₄s₂₃`. Wtedy pierwsze dwa równania są obrotem wektora `(ρ, d₃)` o kąt `q₁` w płaszczyźnie XY.

**Kluczowa identyczność** (Pitagoras):

```
p_x² + p_y² = ρ² + d₃²
```

Napisz to na tablicy **w ramce** — to jest klucz do wszystkiego, co będzie dalej.

> „Lewa strona zawiera tylko znane liczby. Prawa zawiera `ρ`. W ten sposób wyliczamy `ρ` — bez wiedzy o `q₂, q₃`. To jest ten fragment, który sprawia, że metoda zamknięta w ogóle istnieje."

### Krok 2 — q₁ (3 min)

```
ρ = ±√(p_x² − d₃² + p_y²)        ← dwa znaki → shoulder right/left
q₁ = atan2(p_y, p_x) − atan2(d₃, ρ)
```

**Porównanie ze źródłami:**
- Craig (Fig. 4.7, eq. 4.73): identyczny wynik, ten sam wzór.
- Praca [327736]: uproszczony robot bez `d₃` — autor dostaje po prostu `θ₁ = atan2(y, x)` (wzór 10 w pracy, s. 62). **Ostrzeż studenta:** ta uproszczona forma działa tylko dla robotów bez bocznego offsetu. Dla rzeczywistej Pumy560 brak korekty `atan2(d₃, ρ)` daje błąd ~7°.
- Kod studencki z wprowadzenia (załączony snippet): **identyczny błąd** co w [327736] — tylko `atan2(y, x)`. Jeden z celów dzisiejszego wykładu: pokazać, dlaczego ten skrót zawodzi.

**Pokaż w aplikacji:** `StepPanel` 2 i panel „wartości pośrednie" po lewej. Zwróć uwagę na `φ = atan2(p_y, p_x)` oraz `q₁ = φ − atan2(d₃, ρ)` jako dwa różne kąty.

**Dlaczego atan2, nie arctan?** Arctan zwraca wartość z przedziału `(−π/2, π/2)` — traci informację o ćwiartce. Atan2 patrzy na znaki obu argumentów i zwraca kąt z pełnego przedziału `(−π, π]`. Jest to funkcja standardowa w bibliotekach numerycznych (C, Python, MATLAB, JavaScript).

### Krok 3 — Przejście do płaszczyzny ramienia (3 min)

**Pokaż** `ArmPlaneDiagram` w module 1 (teraz z dobrą skalą).

> „Obróć myślowo cały układ o `q₁` wokół pionowej osi. W obróconym układzie całe ramię robota leży w jednej płaszczyźnie. Mamy dwuwymiarowy problem 2R — bark w (0,0), wrist w `(ρ, z)`, a między nimi łokieć."

**Efektywna długość przedramienia** (to jest niuans, który łapie studentów):

```
L = √(a₃² + d₄²) ≈ 0.4323 m          (efektywna długość)
β = atan2(d₄, a₃) ≈ 87.3°            (stałe odchylenie od osi x_3)
```

> „Przedramię nie leży w prostym przedłużeniu ramienia — fizycznie jest tam boczny odgięcie `a₃` (mały) i długi odcinek `d₄` wzdłuż innej osi. Geometrycznie wrist centre jest od łokcia odchylone o kąt `β`."

**Uwaga:** w pracy [327736] autor **usunął** offset `a₃` (s. 57: „zdecydowano się usunąć przesunięcia osiowe") — przez co w jego modelu `L = d₄` i `β = π/2`. Prostsze wzory, ale to już nie jest Puma560.

### Krok 4 — q₃ przez twierdzenie cosinusów (5 min)

**Na tablicy rozpisz rachunek:**

Biorąc `ρ = a₂c₂ + a₃c₂₃ − d₄s₂₃` i `p_z = −a₂s₂ − a₃s₂₃ − d₄c₂₃`, podnieś oba do kwadratu i zsumuj. Człony z `c_2, s_2, c₂₃, s₂₃` splątują się przez tożsamości trygonometryczne i daje:

```
ρ² + p_z² = a₂² + a₃² + d₄² + 2a₂(a₃c₃ − d₄s₃)
```

Oznaczmy:

```
K = (ρ² + p_z² − a₂² − a₃² − d₄²) / (2a₂)  = a₃c₃ − d₄s₃
```

**Tożsamość pomocnicza:** `a₃cos(q₃) − d₄sin(q₃) = L·cos(q₃ + β)`. Stąd `cos(q₃+β) = K/L`, `sin(q₃+β) = ±√(1−K²/L²)` i:

```
q₃ = atan2(±√(L² − K²), K) − β          ← dwa znaki → elbow up/down
```

**Porównanie ze źródłami:**
- [327736] wzory (19)–(21): ta sama mechanika. Uproszczenie — autor operuje na `s₃·L₃ = K` zamiast pełnej tożsamości z `β`, bo `a₃ = 0` → β = π/2 → wzór upraszcza się algebraicznie.
- Craig eq. 4.76: praktycznie identyczny wzór.
- Twierdzenie cosinusów geometryczne: `c_elbow = (a₂² + L² − D²)/(2·a₂·L)` gdzie `D = √(ρ² + p_z²)` — daje dokładnie to samo z nieco inną algebrą. Warto pokazać studentom, że oba wyprowadzenia są równoważne.

### Krok 5 — q₂ przez układ liniowy (3 min)

```
M = a₂ + a₃c₃ − d₄s₃
N = a₃s₃ + d₄c₃
ρ   =  M·c₂ − N·s₂
p_z = −M·s₂ − N·c₂

→ układ liniowy 2×2 w (c₂, s₂)

c₂ = (Mρ − Np_z) / (M² + N²)
s₂ = (−Mp_z − Nρ) / (M² + N²)
q₂ = atan2(s₂, c₂)
```

**Porównanie z [327736]:** autor dostaje to samo przez porównanie elementów macierzy (24)–(29), zdefiniowawszy `θ₂₃ = θ₂ + θ₃` jako pośrednią. Dwie równoważne drogi: algebraiczna (moja) i macierzowa (praca dyplomowa). Warto pokazać obie.

### Krok 6 — Macierz R₀³ i residuum R₃⁶ (4 min)

```
R₀³ = R_z(q₁) · R_x(−π/2) · R_z(q₂ + q₃)

       ┌ c₁c₂₃   −c₁s₂₃   −s₁ ┐
R₀³ =  │ s₁c₂₃   −s₁s₂₃    c₁ │
       └ −s₂₃    −c₂₃       0 ┘

R₃⁶ = (R₀³)ᵀ · R            ← residuum orientacji
```

**Podkreśl:** `(R₀³)⁻¹ = (R₀³)ᵀ` bo macierz ortogonalna. Nie wolno używać numerycznego `inv()` — to jest marnowanie mocy obliczeniowej i wprowadzanie błędów zmiennoprzecinkowych.

### Krok 7 — Ekstrakcja q₄, q₅, q₆ (4 min)

Struktura `R₃⁶` dla Pumy (po wymnożeniu trzech rotacji nadgarstka):

```
         ┌ c₄c₅c₆ − s₄s₆   −c₄c₅s₆ − s₄c₆   −c₄s₅ ┐
R₃⁶ =   │ s₅c₆            −s₅s₆             c₅   │
         └ −s₄c₅c₆ − c₄s₆   s₄c₅s₆ − c₄c₆    s₄s₅  ┘
```

**Centralny wiersz** daje dostęp do `q₅, q₆`, **środkowa kolumna** do `q₄`.

```
|sin q₅| = √(R³⁶[1][0]² + R³⁶[1][1]²)
cos q₅  = R³⁶[1][2]

q₅ = atan2(±|sin q₅|, R³⁶[1][2])              ← dwa znaki → wrist noflip/flip
q₄ = atan2(±R³⁶[2][2], ∓R³⁶[0][2])
q₆ = atan2(∓R³⁶[1][1], ±R³⁶[1][0])
```

**Singularność nadgarstka:** `sin q₅ → 0` — wtedy środkowy wiersz i kolumna `R³⁶` zerują się, a macierz reduje się do rotacji o `q₄ + q₆` wokół wspólnej osi. Tracimy stopień swobody — `q₄` i `q₆` pojedynczo są *nieokreślone*, określona jest tylko suma.

W aplikacji/kodzie: sprawdź `|sin q₅| < ε`, jeśli tak — wybierz umownie `q₄ = 0`, obliczenie `q₆` z `atan2(−R³⁶[0][1], R³⁶[0][0])`.

> „To jest miejsce, gdzie w kodzie studenckim z wprowadzenia było `if (invTheta[4] < 0.0001) invTheta[4] -= 2π` — heurystyczne, ale formalnie niepoprawne. Właściwe wykrycie singularności to suma kwadratów dwóch elementów macierzy, nie porównanie pojedynczej wartości z zerem."

### Krok 8 — Osiem rozwiązań (3 min)

Trzy decyzje znakowe × 2 możliwości = 2³ = **8 rozwiązań**:
- shoulder ∈ {right, left}
- elbow ∈ {up, down}
- wrist ∈ {noflip, flip}

**Pokaż** w aplikacji komponent `SolutionsGrid` na końcu modułu 1 — osiem miniatur robota w identycznej pozie efektora, ale diametralnie różnych konfiguracjach przegubów.

---

## BLOK 6 — Osiem rozwiązań, selekcja (12 min)

**Przejdź do** `/modules/2-analytical-playground`.

**Demonstracja na żywo:**

1. Klikaj checkboxy w `BranchSelector` — pokazuj, jak włączanie/wyłączanie gałęzi zmienia scenę `AllBranchesViewer`.
2. Ruszaj suwakami w głównym kontrolerze. Kliknij „zrzut z kontrolera". Obserwuj, jak 8 gałęzi dopasowuje się.
3. Przesuń poza docelową w miejsce, gdzie łokieć się prostuje (`L² − K² → 0`). Obserwuj, jak dwie gałęzie elbow up/down zlewają się w jedną.

**Dyskusja kryteriów selekcji rozwiązania:**

W praktyce sterownik robota dostaje listę 8 rozwiązań i musi wybrać jedno. Standardowe kryteria:

```
q* = argmin_{q ∈ S(T*)}  Σᵢ wᵢ · wrap_π(qᵢ − qᵢ_current)²
```

gdzie `wrap_π(x)` zawija kąt do `(−π, π]` (pokazać wzór na tablicy, uzasadnić — kąt 170° i −190° to ten sam fizyczny obrót, ale bez zawinięcia różnica wynosi 340°).

Dodatkowe kryteria:
- Ograniczenia przegubowe (odrzuć `q` poza `[q_min, q_max]`).
- Kolizje (sprawdzenie zewnętrznym kolizją checker).
- Manipulacyjność — z dala od singularności.
- Ciągłość trajektorii — nie przełączaj gałęzi między krokami ścieżki.

**Pokaż** animację trajektorii w module 2 (`TrajectoryDemo`) — kliknij „odtwórz", obserwuj jak cztery gałęzie znikają/pojawiają się przy przekraczaniu granic osiągalności.

**Kluczowa myśl do zapamiętania:**

> „Algorytm IK to zamknięty przepis matematyczny. Wybór konkretnego rozwiązania — to już decyzja planera ruchu, nie IK. Te dwa poziomy trzeba rozdzielać."

---

## BLOK 7 — Weryfikacja i porównanie ze źródłami (10 min)

**Przejdź do sekcji „Ten sam solver, dwa języki"** na końcu modułu 1.

Kliknij „załaduj Python" — podczas ładowania (10 s) porozmawiaj o weryfikacji.

**Dlaczego dwa runtime?**

> „Mamy jeden przepis matematyczny i chcemy sprawdzić, czy jego implementacja jest poprawna. Najlepsza sanity-check: zaimplementuj dwukrotnie, w różnych językach, i porównaj wyniki. Jeśli różnica jest poniżej precyzji zmiennoprzecinkowej, oba kody prawdopodobnie są poprawne."

Po załadowaniu Pyodide: zmień pozę. Obserwuj, że tabele TS i Python zawierają identyczne liczby, a w dolnym pasku `max |q_TS − q_PY|` pokazuje ~10⁻¹⁵.

**Porównanie ze źródłami — trzy niezależne wyprowadzenia:**

1. **Craig (1986, 2005)** — podręcznik amerykański, metoda Paula: sukcesywne mnożenie T₀⁶ z lewej strony przez odwrotności macierzy ogniw, porównanie elementów. Wymaga dużo manipulacji ręcznej, ale daje jawne wzory w postaci zamkniętej.

2. **Praca inżynierska [327736], rozdz. 6.4 (s. 60–66)** — polskie wyprowadzenie dla uproszczonego robota Puma-like („Insight") bez offsetów `d₃, a₃`. Autor stosuje tę samą metodę Paula. Różnice: uproszczone wzory (`θ₁ = atan2(y,x)` bez korekty), krótsze równania, ale mniej reprezentatywne dla rzeczywistej Pumy560.

3. **Nasza implementacja (moduł 1)** — łączy obie metody: kluczowa identyczność Pitagorasa (Craig), potem prawo cosinusów (standardowa geometria 2R), potem układ liniowy 2×2 zamiast atan2 z podwójnym pomocniczym kątem (Craig eq. 4.77), na końcu ekstrakcja Eulera ZYZ.

**Czego można się nauczyć z porównania?**
- Metoda jest ta sama (dekompozycja Piepera), tylko chwyty algebraiczne różne.
- Łatwo popełnić błąd — autor [327736] rozwiązał swój uproszczony model **poprawnie**, ale zastosowanie jego wzorów do pełnej Pumy560 dałoby błąd ~7° w `q₁`. Morał: **zawsze sprawdzaj, jaką geometrię zakłada autor**.
- Nasza implementacja przechodzi round-trip FK → IK → FK z błędem ~10⁻¹⁴ (maszynowa precyzja). To silny dowód poprawności, ale nie formalny — formalny wymagałby verification w systemie typu Isabelle/Coq, co wykracza poza nasze ramy.

---

## BLOK 8 — Podsumowanie, co dalej (8 min)

**Podsumuj, co zrobiliśmy:**

1. Zdefiniowaliśmy IK jako problem odwrócenia `f: Q → SE(3)`.
2. Wprowadziliśmy warunek Piepera i dekompozycję pozycja + orientacja.
3. Wyprowadziliśmy **osiem rozwiązań zamkniętych** dla Pumy560.
4. Zaimplementowaliśmy ten sam algorytm w TS i Python, zweryfikowaliśmy zgodność numeryczną.
5. Porównaliśmy z literaturą (Craig, [327736]) — identyczna metodologia, drobne różnice w chwytach.

**Co dalej (zapowiedź kolejnych wykładów):**

- **Moduł 3 — Metody Jakobianowe.** Co jeśli robot NIE spełnia warunku Piepera? Linearyzujemy FK i iterujemy: Jacobian Transpose, pseudoinwersja, DLS (Levenberg-Marquardt). Standard przemysłowy.
- **Moduł 4 — Optymalizacja.** IK jako problem optymalizacji z ograniczeniami. Nelder-Mead, SQP, elastyczne funkcje kosztu.
- **Moduł 5 — Sieci neuronowe.** IK uczone na danych — MLP, MDN, IKFlow. Kiedy ma sens? Hybryda NN+DLS.
- **Moduł 7 — Singularności.** Miara manipulacyjności Yoshikawy, elipsoida manipulacyjności, strategie unikania.

**Zadanie na ćwiczenia / pracę domową:**
1. Wyprowadź wzory IK dla manipulatora ze strony 57–66 pracy [327736] (robot „Insight" — Puma bez offsetów). Porównaj z naszymi dla Pumy560: które wzory zupełnie znikają, a które się upraszczają?
2. Zmodyfikuj kod `src/lib/solvers/analytical-puma560.ts` tak, żeby działał też dla robota „Insight" (z parametrami `a₃ = 0, d₃ = 0`). Sprawdź, że wzory z pracy inżynierskiej są podprzypadkiem naszych.

---

## Pytania kontrolne (dla prowadzącego, do sesji Q&A)

1. *Dlaczego funkcja `atan2` jest lepsza niż `arctan(y/x)` w implementacji numerycznej IK?*
   → `atan2` zna znaki obu argumentów i zwraca pełne `(−π, π]`; `arctan` gubi ćwiartkę.

2. *Dla robota, który NIE spełnia warunku Piepera — czy istnieje rozwiązanie analityczne?*
   → Może istnieć (Paden-Kahan subproblems, screw theory), ale wzory stają się ogromne lub w ogóle nie istnieją w postaci elementarnej. W praktyce używa się metod iteracyjnych.

3. *Co oznacza „singularność" geometrycznie?*
   → Konfiguracja, w której jakobian traci pełny rząd — istnieje kierunek ruchu TCP, którego nie da się zrealizować dowolnym wyborem `dq/dt`.

4. *Ile różnych rozwiązań IK dla Pumy może istnieć jednocześnie i skąd bierze się ta liczba?*
   → Do 8, z trzech niezależnych binarnych decyzji (shoulder, elbow, wrist).

5. *W kodzie użytkownika znajdujemy `atan2(y, x)` bez korekty. Dlaczego to źle dla Pumy560, a dobrze dla robota „Insight" z pracy [327736]?*
   → „Insight" nie ma offsetu `d₃`, Puma ma. Bez korekty `− atan2(d₃, ρ)` ignorujemy boczny odstęp przedramienia — błąd ~7° w `q₁`.

---

## Referencje dla studenta

- **Craig J.J.** *Introduction to Robotics: Mechanics and Control*, wyd. 3, Pearson 2005 — rozdz. 3 (kinematyka prosta, konwencja DH) i rozdz. 4 (IK, §4.7 Puma560). Podstawowa pozycja.
- **Spong M.W., Hutchinson S., Vidyasagar M.** *Robot Modeling and Control*, Wiley 2006 — alternatywna prezentacja z klasyczną konwencją DH.
- **Praca inżynierska [327736]**, rozdz. 6 — polskojęzyczne wyprowadzenie dla uproszczonej Pumy. Dobry punkt wyjścia dla studenta pracującego nad własną implementacją.
- **Buss S.R.** „Introduction to Inverse Kinematics with Jacobian Transpose, Pseudoinverse and Damped Least Squares methods", IEEE JRA (2004) — fundamentalna dla modułów 3–4.
- **Aplikacja IK Platform** — `/modules/1-analytical-walkthrough` jako interaktywne uzupełnienie.

---

## Uwagi dla prowadzącego

- **Tempo.** Blok 5 jest najgęstszy matematycznie. Jeśli studenci gubią się w rachunku, lepiej zwolnić i poświęcić więcej czasu na krok 1 (kluczowa identyczność Pitagorasa). Kroki 6–7 można potem skrócić i pokazać głównie w aplikacji.
- **Częste pytania studentów:**
  - *„Skąd wiadomo, że `q₂ + q₃` to ten sam kąt w obu równaniach?"* — bo oba obroty są wokół tej samej osi `z_2` (po Rx(−π/2) w łączeniu ogniwa 2–3). Przypomnieć tabelę DH.
  - *„Dlaczego nie można po prostu użyć `sin⁻¹` zamiast `atan2` w kroku 7?"* — traci się informację o ćwiartce, funkcja sin nie jest injekcyjna na `(−π, π]`.
  - *„Jak wybrać wrist no-flip czy flip?"* — to jest wybór planera. Jedna konwencja: no-flip to `q₅ > 0`, flip to `q₅ < 0`. W sterownikach przemysłowych często narzucone ograniczenie `q₅ ∈ (0, π)` — wtedy tylko no-flip jest dostępny.
- **Powtórzenie**. Warto powtórzyć wyprowadzenie podczas ćwiczeń na konkretnym przykładzie liczbowym — studenci powinni samodzielnie rozwiązać przypadek z zadanymi `x, y, z, RPY` i dostać 8 wektorów `q`.
