# Dynamika odwrotna manipulatora — przepis postępowania (Newton-Euler)

Skondensowana instrukcja krok po kroku: jak wyznaczyć momenty napędowe `τ_i` w przegubach robota dla zadanej trajektorii `(q, q̇, q̈)`. Źródło: [Gruszka, dysertacja 2024, rozdz. 6.2.1, eq. (6.6)–(6.18)] oraz [Craig, *Introduction to Robotics*, 3rd ed., §6.7]. Implementacja: `src/lib/dynamics/newton-euler.ts`.

> Dokument jest uzupełnieniem do modułu 9 w aplikacji (`/modules/9-dynamics`).

---

## 1. Co musisz mieć przed startem

### 1.1 Geometria robota (modified DH, Craig)
Tabela DH z parametrami `(α_{i-1}, a_{i-1}, d_i, θ_i-home)` dla każdego ogniwa. Dla ES5 (przykład w aplikacji) — patrz `src/lib/robots/es5.ts`. Dla Pumy 560 — `puma560.ts`.

### 1.2 Parametry inercji każdego ogniwa
Trzy obiekty na ogniwo:
- Masa `m_i` [kg].
- Środek masy `^i p_Ci` [m] — w lokalnym układzie ogniwa.
- Tensor bezwładności `I_Ci` [kg·m²] — macierz 3×3 wokół środka masy, w lokalnym układzie.

Wartości pochodzą z modelu CAD lub z eksperymentalnej identyfikacji parametrów (rozdz. 9 dysertacji weryfikuje model przez pomiary momentów). Dla aplikacji edukacyjnej często wystarcza oszacowanie cylindryczne (każde ogniwo ≈ jednorodny cylinder).

### 1.3 Trajektoria
Wektor `(q(t), q̇(t), q̈(t))` w wybranych chwilach czasu. Jeśli masz tylko `q(t)`, możesz różniczkować numerycznie (centralne różnice albo automatyczne różniczkowanie symboliczne).

---

## 2. Forward sweep — propagacja prędkości i przyspieszeń

### 2.1 Inicjalizacja w bazie

```
^0 ω_0 = 0
^0 ε_0 = 0  
^0 v_0 = 0
^0 a_0 = -g · ẑ_world      (sztuczka Craig'a — grawitacja jako przyspieszenie bazy)
```

Dla `z_world` skierowanej w górę: `^0 a_0 = (0, 0, +g)` z `g = 9.81`.

### 2.2 Iteracja od ogniwa 1 do n

Dla każdego ogniwa `i+1` w kolejności rosnącej:

```
^{i+1} ω_{i+1} = ^{i+1}R_i · ^i ω_i + θ̇_{i+1} · ẑ_{i+1}                         (6.6)

^{i+1} ε_{i+1} = ^{i+1}R_i · ^i ε_i 
              + (^{i+1}R_i · ^i ω_i) × (θ̇_{i+1} · ẑ_{i+1}) 
              + θ̈_{i+1} · ẑ_{i+1}                                                 (6.7)

^{i+1} v_{i+1} = ^{i+1}R_i · ( ^i v_i + ^i ω_i × ^i p_{i+1} )                     (6.8)

^{i+1} a_{i+1} = ^{i+1}R_i · ( ^i ε_i × ^i p_{i+1} 
                             + ^i ω_i × (^i ω_i × ^i p_{i+1}) 
                             + ^i a_i )                                            (6.9)
```

gdzie:
- `^{i+1}R_i` — macierz rotacji z układu (i) do (i+1) (z modifiedDHTransform).
- `^i p_{i+1}` — wektor od początku układu (i) do (i+1), wyrażony w układzie (i).
- `ẑ_{i+1} = (0, 0, 1)` w lokalnym układzie (i+1).

### 2.3 Środek masy (po wyliczeniu ω_i, ε_i, a_i)

```
^i v_Ci = ^i v_i + ^i ω_i × ^i p_Ci                                                (6.11)

^i a_Ci = ^i ε_i × ^i p_Ci + ^i ω_i × (^i ω_i × ^i p_Ci) + ^i a_i                  (6.12)
```

### 2.4 Siły i momenty bezwładności w środku masy

```
^i F_Ci = m_i · ^i a_Ci                                                            (6.14)

^i N_Ci = I_Ci · ^i ε_i + ^i ω_i × (I_Ci · ^i ω_i)                                 (6.15)
```

Drugi człon w `N_C` to **moment giroskopowy** — pojawia się gdy ω nie jest wektorem własnym I.

---

## 3. Backward sweep — siły i momenty reakcji w przegubach

### 3.1 Inicjalizacja w końcówce

```
^{n+1} f_{n+1} = 0    (brak obciążenia zewnętrznego)
^{n+1} n_{n+1} = 0
```

Jeśli robot trzyma jakiś przedmiot, dorzucamy ten ciężar tu.

### 3.2 Iteracja od ogniwa n do 1

Dla każdego ogniwa `i` w kolejności malejącej:

```
^i f_i = ^i R_{i+1} · ^{i+1} f_{i+1} + ^i F_Ci                                     (Craig 6.49)

^i n_i = ^i N_Ci 
       + ^i R_{i+1} · ^{i+1} n_{i+1} 
       + ^i p_Ci × ^i F_Ci 
       + ^i p_{i+1} × (^i R_{i+1} · ^{i+1} f_{i+1})                                (Craig 6.50)
```

### 3.3 Moment napędowy w osi przegubu

```
τ_i = ^i n_i · ẑ_i = (^i n_i)_z          # składowa wzdłuż osi przegubu
```

To skalar — to, czego silnik musi wytworzyć w przegubie.

---

## 4. Konwencje i typowe pułapki

### 4.1 Konwencja grawitacji

Algorytm wykorzystuje sztuczkę Craig'a: inicjalizacja `a_0 = -g·ẑ_world` powoduje, że `a_C` w forward sweep zawiera grawitację, a `F_C = m·a_C` jest sumą siły bezwładności i grawitacji. Stąd w backward sweep używamy `f_i = R·f_{i+1} + F_C` **bez osobnego członu F_g**.

> Dysertacja Gruszki w eq. (6.16)-(6.17) zawiera dodatkowy człon `-F_g`. Taka konwencja pojawia się przy `a_0 = 0`, ale (B.4) pokazuje `^1 a_1 = (0, 0, -9.81)`, czyli grawitacja JEST w propagacji. To może być pomyłka konwencji — w naszej implementacji wybraliśmy spójne podejście Craig'a (bez F_g osobno).

### 4.2 Kierunek transformacji R

`linkTransform` zwraca macierz, której kolumny to baza (i+1) wyrażona w (i) — czyli macierz `T^i_{i+1}` (z (i+1) do (i)).

- W **forward sweep** (przejście z (i) do (i+1)) używamy **R^T** (`mat3TmulVec3`).
- W **backward sweep** (przejście z (i+1) do (i)) używamy **R bezpośrednio** (`mat3mulVec3`).

To częste źródło bugów — dla q=0 wszystkie macierze są tożsamością, więc bug się nie ujawnia.

### 4.3 Tensor I_C w lokalnym układzie ogniwa

`I_C` zdefiniowany **w lokalnym układzie ogniwa**, nie w bazie. Twierdzenie Steinera (parallel-axis) potrzebne tylko gdy producent podaje I względem początku ogniwa zamiast środka masy.

### 4.4 τ to składowa N_i wzdłuż z_i

Nie norma, nie moduł. Dla przegubu obrotowego oś z_i to oś przegubu (konwencja DH). Pozostałe składowe momentu są równoważone przez konstrukcję mechaniczną przegubu.

---

## 5. Złożoność i implementacja

Algorytm jest **O(n)** — liniowy w liczbie przegubów. Dla n=6 (typowy manipulator):
- Forward sweep: 6 iteracji × ~20 operacji wektorowych = ~120 multikrosów + dodawań.
- Backward sweep: 6 iteracji × ~10 operacji = ~60 multikrosów.
- Razem: ~5–10 µs na typowym CPU. Dla trajektorii 1000 punktów: ~5–10 ms.

To bardzo szybkie — można uruchamiać w kontrolerze robota w czasie rzeczywistym z częstotliwością 1 kHz bez problemów.

---

## 6. Weryfikacja implementacji

Kilka dobrych testów:

1. **Statyka (q̇ = q̈ = 0)** — momenty wynikają tylko z grawitacji. Powinny być znacznie większe gdy robot ma ramię w pozycji poziomej niż pionowej. Konkretne wartości: τ₂ dla Pumy 560 z q = home (ramię poziomo) wynosi ~50–80 Nm.

2. **Bez masy (m_i = 0, I_i = 0)** — momenty muszą być DOKŁADNIE 0 dla każdej q, q̇, q̈.

3. **Round-trip FK → IK → NE** — wykonaj FK na zadanej q, znajdź IK do tej samej pozy (powinno wrócić q identyczne lub z innej gałęzi), potem NE → wynik powinien być spójny.

4. **Porównanie z Lagrangem** — jeśli masz dostęp do Lagrange'a (np. Sympy w Pythonie), wartości τ z obu metod muszą być identyczne z dokładnością do precyzji maszynowej.

5. **Wartości z dysertacji** — załącznik B zawiera rozpisane wzory skalarne dla każdego ogniwa ES5. Można porównać linijka po linijce wartości pośrednie ω, ε, v, a, F_C, N_C dla wybranego scenariusza.

---

## 7. Rozszerzenia (poza zakresem podstawowego algorytmu)

- **Tarcie w przegubach** — Coulomba (`τ_friction = b·sign(q̇)`) i wiskotyczne (`b·q̇`). Dorzucone do `τ_i` po backward sweep.
- **Inercja wirnika silnika** — dla przekładni `n:1` efektywna inercja widziana z przegubu wynosi `J_rotor · n²`. Dla 101:1 i J_rotor = 10⁻⁵ kg·m², to dodaje ~0.1 kg·m² do dynamiki przegubu — nieignorowalne.
- **Elastyczność przekładni harmonicznej** — pełna elastyczność prowadzi do oddzielnego stanu (`q_motor`, `q_joint` — różnica wynika z deformacji flexspline). Dorzuca to 6 dodatkowych stopni swobody do wektora stanu.
- **Dynamika szybkośyciowa silnika** — `L·di/dt` pomijamy w quasi-statyce. Pełen model dodaje 6 stanów elektrycznych.
