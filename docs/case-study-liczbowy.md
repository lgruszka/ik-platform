# Case study liczbowy — IK analityczna Puma560 krok po kroku

Ten dokument pokazuje **pełne przejście algorytmu IK** dla konkretnego przypadku liczbowego. Każdy krok, który w module 1 aplikacji i w `docs/ik-analityczna-cookbook.md` jest opisany formułami, jest tutaj dodatkowo rozliczony z konkretnymi wartościami. Celem jest:

- **ułatwić studentowi samodzielne sprawdzenie** swojej implementacji — po każdym kroku można porównać wartości pośrednie,
- **pokazać wykładowcy** na żywo (albo na tablicy) przykład, w którym wszystkie liczby są „sensowne" i widać, skąd one się biorą,
- **zweryfikować** własny kod przeciwko numerycznie tym samym wartościom.

Wszystkie liczby w tym dokumencie zostały wygenerowane skryptem `scripts/generate-case-study.ts`. Możesz go uruchomić ponownie (`npx tsx scripts/generate-case-study.ts`) po zmianie `Q_TRUE` i dostać nowy case study dla innej pozy.

---

## Dane wejściowe

### Parametry robota (przypomnienie)

| symbol | wartość | znaczenie |
|--------|---------|-----------|
| `a₂`   | 0,4318 m | długość ramienia |
| `a₃`   | 0,0203 m | offset boczny łokcia |
| `d₃`   | 0,1254 m | odsadzenie przedramienia od osi ramienia |
| `d₄`   | 0,4318 m | długość przedramienia |
| `d₆`   | 0 m | (offset narzędzia — brak) |

### Wybrana konfiguracja

Startujemy od **znanego** wektora kątów przegubowych (później zapomnimy o nim i spróbujemy go odtworzyć z samej macierzy pozy):

```
q_true = (30°, −60°, 120°, 20°, 40°, 15°)
       = (0.5236, −1.0472, 2.0944, 0.3491, 0.6981, 0.2618) rad
```

### Poza docelowa T* (wynik FK(q_true))

Obliczając kinematykę prostą (iloczyn sześciu macierzy DH):

```
        ┌  0.0452   0.3210  −0.9460  −0.1908 ┐
T*  =   │ −0.5469  −0.7845  −0.2923   0.0346 │
        │ −0.8359   0.5306   0.1401   0.1405 │
        └  0.0000   0.0000   0.0000   1.0000 ┘
```

Wyciągając z niej składowe:

```
p   = (px, py, pz) = (−0.1908, 0.0346, 0.1405) m
R   = górne 3×3
RPY = (75.21°, 56.71°, −85.27°)
```

**Uwaga dla studenta:** teraz „zapominamy" `q_true` i udajemy, że dostaliśmy tylko `T*`. Zadaniem IK jest zwrócenie zbioru wektorów `q`, z których każdy spełnia `FK(q) = T*`. Zobaczymy, że `q_true` jest w tym zbiorze jako jedna z ośmiu gałęzi.

---

## KROK 0 — Sprowadzenie pozy do układu wrist

Dla Pumy560 w konwencji Craiga `d₆ = 0`, więc środek nadgarstka pokrywa się z początkiem układu współrzędnych {6}. Brak narzędzia (`T_tool = I`), więc:

```
T₀⁶ = T* · T_tool⁻¹ = T*
p_wc = p = (−0.1908, 0.0346, 0.1405) m
```

To jest punkt, w który musimy trafić przegubami `q₁, q₂, q₃`.

---

## KROK 1 + 2 — Wyznaczenie q₁ (dwie gałęzie shoulder)

### Kluczowa identyczność

Z wzorów na pozycję wrist center (moduł 1, krok 1):

```
p_x² + p_y² = ρ² + d₃²
```

gdzie `ρ = p_x·cos(q₁) + p_y·sin(q₁)`.

### Numerycznie

```
p_x² + p_y² = (−0.1908)² + (0.0346)² = 0.03760
d₃²         = (0.1254)²              = 0.01573

ρ² = p_x² + p_y² − d₃² = 0.02187  (≥ 0, więc osiągalne)
ρ  = ±√0.02187 = ±0.1479 m
```

Dwa znaki dają dwie gałęzie (shoulder right/left).

### Kąt bazowy

```
φ = atan2(p_y, p_x) = atan2(0.0346, −0.1908) = 169.706°
```

### Dwa rozwiązania q₁

```
ρ = +0.1479  →  shoulder right  →  q₁ = φ − atan2(d₃, +ρ) = 169.706° − 40.293° = 129.413°
ρ = −0.1479  →  shoulder left   →  q₁ = φ − atan2(d₃, −ρ) = 169.706° − 139.706° = 30.000°
```

Zauważ, że **gałąź „left" odtwarza dokładnie `q₁_true = 30°`**. To znaczy, że nasze wyjściowe `q_true` przynależy do rodziny shoulder-left.

**Dla przejrzystości poniższe kroki prowadzimy dla gałęzi shoulder-RIGHT** (`q₁ = 129.413°`) — pokazuje to, że IK znajduje *inne* (alternatywne) rozwiązanie niż `q_true`, które jednak osiągnie tę samą pozę efektora.

---

## KROK 3 + 4 — Efektywna długość L, kąt β, q₃ (dwie gałęzie elbow)

### Geometria przedramienia

```
L = √(a₃² + d₄²) = √(0.00041 + 0.18645) = 0.43228 m
β = atan2(d₄, a₃) = atan2(0.4318, 0.0203) = 87.308°
```

`L` to „efektywna długość przedramienia" (od łokcia do środka nadgarstka, prosta euklidesowa). `β` to stały kąt geometryczny — ile przedramię odchyla się od osi x układu {3}.

### Prawo cosinusów w postaci K

Dla gałęzi shoulder-right (`ρ = +0.1479 m`):

```
K = (ρ² + p_z² − a₂² − a₃² − d₄²) / (2·a₂)
  = (0.02187 + 0.01973 − 0.18645 − 0.00041 − 0.18645) / 0.8636
  = −0.33170 / 0.8636
  = −0.38410
```

### Dyskryminant

```
L² − K² = 0.18687 − 0.14754 = 0.03933   (≥ 0, więc osiągalne)
√(L² − K²) = 0.19832
```

### Dwa rozwiązania q₃

```
elbow-up:   q₃ = atan2(+0.19832, −0.38410) − 87.308° = 152.691° − 87.308° = 65.383°
elbow-down: q₃ = atan2(−0.19832, −0.38410) − 87.308° = −152.691° − 87.308° = −240.000°
```

**Uwaga:** `q₃ = −240°` matematycznie jest równoważne `+120°` (mod 360°). Mechanicznie są to jednak różne pozycje przegubu (ta sama „gałąź" geometryczna, ale po wykonaniu pełnego obrotu). W implementacji wartość wraca bez wrap-around; dopiero selekcja praktyczna (zob. moduł 2) zadba o zawijanie do `(−π, π]`.

**Kontynuujemy dla gałęzi elbow-UP** (`q₃ = 65.383°`).

---

## KROK 5 — Wyznaczenie q₂ (układ liniowy 2×2)

### Współczynniki

```
c₃ = cos(65.383°) = 0.41655
s₃ = sin(65.383°) = 0.90911

M = a₂ + a₃·c₃ − d₄·s₃
  = 0.4318 + 0.0203·0.41655 − 0.4318·0.90911
  = 0.4318 + 0.00846 − 0.39253
  = 0.04770

N = a₃·s₃ + d₄·c₃
  = 0.0203·0.90911 + 0.4318·0.41655
  = 0.01846 + 0.17987
  = 0.19832
```

### Rozwiązanie układu

```
M² + N² = 0.00227 + 0.03933 = 0.04161  (wyznacznik, zawsze > 0 dla Pumy)

c₂ = (M·ρ − N·p_z) / (M² + N²)
   = (0.04770·0.1479 − 0.19832·0.1405) / 0.04161
   = (0.00705 − 0.02786) / 0.04161
   = −0.50000

s₂ = (−M·p_z − N·ρ) / (M² + N²)
   = (−0.04770·0.1405 − 0.19832·0.1479) / 0.04161
   = (−0.00670 − 0.02932) / 0.04161
   = −0.86603

q₂ = atan2(s₂, c₂) = atan2(−0.86603, −0.50000) = −120.000°
```

**Sanity check:** `c₂² + s₂² = 0.25 + 0.75 = 1.00` ✓ — para `(c₂, s₂)` jest wektorem jednostkowym, co potwierdza że układ jest spójny.

---

## KROK 6 — Macierze R₀³ i R₃⁶

### R₀³ z znanych q₁, q₂, q₃

```
c₁  = cos(129.413°) = −0.63490
s₁  = sin(129.413°) =  0.77259
c₂₃ = cos(q₂+q₃) = cos(−54.617°) =  0.57904
s₂₃ = sin(q₂+q₃) = sin(−54.617°) = −0.81530
```

Wstawiając do formuły:

```
        ┌  c₁c₂₃    −c₁s₂₃    −s₁  ┐      ┌ −0.3676  −0.5176  −0.7726 ┐
R₀³  =  │  s₁c₂₃    −s₁s₂₃     c₁  │   =  │  0.4474   0.6299  −0.6349 │
        └  −s₂₃     −c₂₃        0  ┘      └  0.8153  −0.5790   0.0000 ┘
```

**Sanity check:** `|det(R₀³)| = 1` i kolumny są wzajemnie ortogonalne (iloczyny skalarne zerowe). To powinno być prawdą z konstrukcji, ale warto to sprawdzić w kodzie.

### R₃⁶ = (R₀³)ᵀ · R

Mnożąc wiersz po wierszu (transponowana po lewej):

```
         ┌ −0.9429  −0.0363   0.3312 ┐
R₃⁶  =   │  0.1161  −0.9675   0.2244 │
         └  0.3123   0.2501   0.9165 ┘
```

To jest **orientacja, którą musi dostarczyć nadgarstek** (q₄, q₅, q₆), aby wypadkowa `R₀³·R₃⁶ = R*`.

---

## KROK 7 — Wyznaczenie q₄, q₅, q₆

### Z symbolicznej struktury R₃⁶

Porównując wartości z formułą:

```
|sin q₅| = √(R³⁶[1][0]² + R³⁶[1][1]²)
         = √(0.1161² + 0.9675²)
         = √(0.01348 + 0.93606)
         = √0.94955
         = 0.97449

cos q₅ = R³⁶[1][2] = 0.22444
```

### Dwie gałęzie wrist

Dla gałęzi **noflip** (`sin q₅ > 0`):

```
q₅ = atan2(+0.97449, 0.22444) = 77.030°
q₄ = atan2(R³⁶[2][2], −R³⁶[0][2]) = atan2(0.9165, −0.3312) = 109.870°
q₆ = atan2(−R³⁶[1][1], R³⁶[1][0]) = atan2(0.9675, 0.1161) = 83.157°
```

Dla gałęzi **flip** (`sin q₅ < 0`) wartości są dopełnieniami (patrz tabela niżej).

**Sanity check:** `sin²q₅ + cos²q₅ = 0.97449² + 0.22444² = 0.94965 + 0.05037 = 1.0000` ✓

### Czy jesteśmy blisko singularności?

```
|sin q₅| = 0.97449  ≫ 0
```

Jest daleko od zera (singularność nadgarstka zachodzi przy `|sin q₅| ≈ 0`). Ekstrakcja jest numerycznie stabilna.

---

## PODSUMOWANIE — wszystkie 8 rozwiązań

Po przejściu przez wszystkie trzy pary decyzji znakowych (shoulder × elbow × wrist) dostajemy:

| # | shoulder | elbow | wrist  | q₁ | q₂ | q₃ | q₄ | q₅ | q₆ |
|---|----------|-------|--------|------|------|------|------|------|------|
| 1 | right | up   | noflip | 129.4 | −120.0 | 65.4 | 109.9 | 77.0 | 83.2 |
| 2 | right | up   | flip   | 129.4 | −120.0 | 65.4 | −70.1 | −77.0 | −96.8 |
| 3 | right | down | noflip | 129.4 | 33.0 | −240.0 | 66.6 | 92.6 | −122.7 |
| 4 | right | down | flip   | 129.4 | 33.0 | −240.0 | −113.4 | −92.6 | 57.3 |
| 5 | left  | up   | noflip | 30.0 | 147.0 | 65.4 | 166.1 | 113.5 | −155.1 |
| 6 | left  | up   | flip   | 30.0 | 147.0 | 65.4 | −13.9 | −113.5 | 24.9 |
| **7** | **left** | **down** | **noflip** | **30.0** | **−60.0** | **−240.0** | **20.0** | **40.0** | **15.0** |
| 8 | left  | down | flip   | 30.0 | −60.0 | −240.0 | −160.0 | −40.0 | −165.0 |

**Pogrubiony wiersz #7** odpowiada pierwotnemu `q_true = (30°, −60°, 120°, 20°, 40°, 15°)` — z precyzyjnością do zawinięcia `q₃: 120° ≡ −240°` (mod 360°) i identycznie dla pozostałych.

**Wiersz #1** (dla którego robiliśmy wyprowadzenie) jest również poprawnym rozwiązaniem — tyle że całe ramię jest w zupełnie innym położeniu fizycznym, choć końcówka trafia w ten sam punkt z tą samą orientacją.

---

## Weryfikacja

Dla każdego z wygenerowanych ośmiu rozwiązań wykonujemy kinematykę prostą i porównujemy z zadaną `T*`:

```
Pozycja  — błąd: 8.78e−17 m
Orientacja — max |ΔRᵢⱼ|: 3.61e−16
```

To jest **precyzja zmiennoprzecinkowa double**. Algorytm IK jest matematycznie dokładny — jedyny błąd pochodzi z reprezentacji liczb w pamięci.

---

## Gdzie to zobaczyć interaktywnie

- **Moduł 1 aplikacji** (`/modules/1-analytical-walkthrough`) — kliknij „zrzut z kontrolera" z ustawionym `q_true` aby dostać `T*`, potem obserwuj wartości pośrednie w boksie po lewej, które aktualizują się na żywo. Każda liczba z tego dokumentu powinna zgadzać się z tym, co widzisz na ekranie.
- **Moduł 2 aplikacji** (`/modules/2-analytical-playground`) — tabela z residualami pokazuje wszystkie 8 rozwiązań z ich błędami FK→IK→FK.

---

## Uwagi dydaktyczne

1. **Dlaczego wybraliśmy gałąź right-up-noflip do wyprowadzenia, skoro q_true było left-down-noflip?**
   Celowo — żeby pokazać, że IK znajduje *wszystkie* rozwiązania, a nie „odgaduje" oryginalne q. Gdy student implementuje solver i widzi, że wynik dla pierwszej gałęzi nie zgadza się z q_true, nie jest to błąd — to po prostu inna gałąź zbioru rozwiązań.

2. **Zauważ pełną symetrię shoulder left/right:**
   Wiersze #1–4 (shoulder right) mają `q₁ = 129.4°`, wiersze #5–8 (shoulder left) mają `q₁ = 30°`. Różnica to dokładnie `180° − 2·atan2(d₃, ρ) ≈ 99.4°` (nie 180°, bo `d₃ ≠ 0`).

3. **q₃ = −240°** w implementacji:
   atan2 zwraca wartość w `(−π, π]`, ale po odjęciu `β ≈ 87°` możemy wyjść z tego przedziału. Dla selekcji praktycznej (moduł 2) warto dodać wrap do `(−π, π]` lub porównywać z konfiguracją bieżącą przez `wrap_π(Δq)`.

4. **Identyczność Pitagorasa** (`p_x² + p_y² = ρ² + d₃²`) można sprawdzić numerycznie:
   ```
   0.03760 = 0.02187 + 0.01573  ✓
   ```
   Takie sanity-checki warto wstawiać w kod — każda niespójność sygnalizuje błąd w implementacji.

5. **Singularność nadgarstka** przy `|sin q₅| → 0` — w naszym przypadku `|sin q₅| = 0.974`, jesteśmy daleko. Dla bezpiecznej implementacji wartość progu `ε` należy dostosować do precyzji zmiennoprzecinkowej używanej w rachunku; dla `double` typowo `ε = 10⁻⁶` jest rozsądne.

---

## Regeneracja dla innej pozy

Aby wygenerować ten sam case study dla innej konfiguracji, zmień `Q_TRUE` w `scripts/generate-case-study.ts` i uruchom:

```bash
npx tsx scripts/generate-case-study.ts
```

Skrypt wypisze wszystkie wartości w tym samym formacie, które można wkleić do tego dokumentu.
