# Plan przebudowy pedagogicznej Modułu 9 (Dynamika odwrotna · Newton-Euler)

Dokument źródłowy: krytyczny przegląd modułu 9 wykonany 2026-05-22 — przed implementacją. Plik służy jako **punkt odniesienia** do porównania z faktycznym stanem aplikacji po wprowadzeniu zmian.

---

## Diagnoza — moduł ma świetne fundamenty, ale brakuje mostu pedagogicznego

**Co działa:** wyprowadzenia w `<StepPanel />`, playground na żywo (ES5 + suwaki q, q̇, q̈), `TorqueDisplay`, cheat-sheet, numerical-example, citacje do dysertacji.

**Co nie działa:** student wchodzi od razu w rekurencję z indeksami (i, i+1), macierzami rotacji w obie strony i 5 równań kinematyki — bez „kroku 0", w którym widzi czystą postać Newton-Eulera dla pojedynczego ciała sztywnego, bez wytłumaczenia *dlaczego* w ogóle robimy dwa przebiegi (forward+backward), i bez animacji która by przepływ informacji pokazała.

---

## A. Pedagogiczne luki w narracji

| ID | Luka | Co dodać |
|---|---|---|
| **A1** | Brakuje „pojedynczego ciała przed łańcuchem" | Krok 0: jedno sztywne ciało, F=m·a + N=Iε+ω×Iω. Wszystko inne to tylko łączenie tego w łańcuch. |
| **A2** | „Dlaczego forward potem backward, a nie razem?" — nigdy nie wyjaśnione | Boks: siły bezwładności zależą tylko od kinematyki, kinematyka nie zależy od sił → możemy rozdzielić. |
| **A3** | Konwencja notacji `^i p_{i+1}` — bez wprowadzenia | 3-wierszowa legenda notacyjna przed pierwszą formułą. |
| **A4** | „Computed-torque" obiecane na początku, nigdy nie pokazane | Demo PID vs PID+NE-feedforward na agresywnej trajektorii. |
| **A5** | Coriolis i siła odśrodkowa — wzór bez fizyki | Klasyczne intuicje (pociąg na obrotowej platformie, łyżwiarka). |
| **A6** | R^T vs R — najczęstszy bug schowany w `<details>` | Promote do widocznego callout-boxa „najczęstsza pułapka". |
| **A7** | „τ_i to RZUT n_i na ẑ_i" — dlaczego? | Schemat „przegub jako zawias absorbuje wszystko poza składową osiową". |

## B. Brakujące wizualizacje / animacje (najwyższy ROI)

| ID | Wizualizacja | Uzasadnienie |
|---|---|---|
| **B1** ⭐ | Animacja propagacji forward+backward link-by-link | Single biggest opportunity — student widzi przepływ informacji wzdłuż algorytmu. |
| **B2** ⭐ | Elipsoidy bezwładności na 3D ogniwach | Tensor I_C abstrakcyjny dopóki nie zobaczysz go geometrycznie. |
| **B3** ⭐ | Wykres słupkowy τ_grav vs τ_dyn + suwak q̇ | Student „czuje" jak rośnie wkład dynamiki. |
| **B4** | Animacja Coriolisa na 2D platformie obrotowej | Wzór staje się zjawiskiem fizycznym. |
| **B5** | Sanity-check panel — bilans mocy `∑τᵢq̇ᵢ vs dT/dt+dV/dt` | Najpiękniejszy dowód że algorytm działa. |
| **B6** | Demo precesji żyroskopowej na pojedynczym cylindrze | Uzupełnienie obecnego tekstu „koło rowerowe". |
| **B7** | Schemat blokowy całego algorytmu na wstępie | Mapa do nawigacji w 5 sekund. |

## C. Brakujące przykłady dydaktyczne

| ID | Przykład | Uzasadnienie |
|---|---|---|
| **C1** ⭐ | Wzorzec 2R-planarny ręcznie wyprowadzony | Game changer — całe NE rozpisane na pół strony, wszystkie iloczyny wektorowe widoczne. |
| **C2** | Test „statyka = gradient energii potencjalnej" | Dwa niezależne wyprowadzenia tej samej liczby. |
| **C3** | Boksy „spróbuj sam" (3-4 zadania) | Engagement booster. |
| **C4** | Pułapka „prismatic vs revolute" | Studenci patrzący na SCARĘ lub Stanford Arm dostaną błąd. |
| **C5** | „Co się zmienia gdy robot trzyma przedmiot" | Suwak masy w chwytaku 0–5 kg, demo skalowania momentów. |

## D. Drobne korekty i porządki

| ID | Problem | Naprawa |
|---|---|---|
| **D1** | **BUG** — duplikat akapitu (linie 166-175 page.tsx) | Usunąć drugą kopię. |
| **D2** | „Liniowość modelu" w założeniach (krok 1) — mylące | Przeformułować na „liniowo-sprężyste ciało stałe / zaniedbywanie deformacji". |
| **D3** | „Brak rezonansu strukturalnego" — słabe | „Silnik jako idealny generator momentu, wracamy do tego w M10". |
| **D4** | Cylindryczne oszacowanie inercji — wartości niepokazane | Tabela 6 wierszy: ogniwo / m / długość / I_xx I_yy I_zz. |
| **D5** | Eq. 6.11–6.12 (v_Ci) brakuje w głównym tekście | Symetryczny akapit w kroku 3. |
| **D6** | Brak ramki „inverse vs forward dynamics" | Krótki boks pozycjonujący. |
| **D7** | `ε` w tekście vs `alpha` w kodzie | Krótka notka „w kodzie alpha bo TS nie lubi unicode". |
| **D8** | R^T w `<details>` z błahym summary | Hasło „najczęstszy bug w implementacjach NE". |
| **D9** | Brak linku do modułu 1 (Puma — forma A vs B) | `<a href="/modules/1-analytical-walkthrough">`. |
| **D10** | TorqueChart bez legendy/opisu osi | Dopisać legendę i opis. |
| **D11** | „Co dalej" lakoniczne | Wymienić: M10 + dynamika kontaktu jako możliwe rozszerzenie. |

---

## E. Sugerowana kolejność implementacji wg ROI

### Tier 1 — must-have, max impact (zaczynamy tutaj)
1. **D1** — usuń duplikat akapitu (5 sekund pracy)
2. **A1** — krok 0 „pojedyncze ciało" (1 panel)
3. **A2** — boks „dlaczego dwa przebiegi" (1 panel z schematem strzałkowym)
4. **A3** — legenda notacji `^i v` (3-wierszowa tabelka)
5. **B1** — animacja forward+backward sweep (~200 linii SVG)
6. **C1** — wzorzec 2R-planarny ręcznie (1 strona tekstu, wszystkie wzory rozpisane)

### Tier 2 — high-impact ale więcej pracy
7. **A4** — demo computed-torque (PID vs PID+NE-feedforward)
8. **B3** — wykres słupkowy τ_grav vs τ_dyn
9. **B5** — sanity-check z bilansem mocy
10. **A6 / D8** — R^T callout

### Tier 3 — nice-to-have
11. **B2** — elipsoidy bezwładności w 3D
12. **B4** — animacja Coriolisa 2D
13. **B7** — schemat blokowy na wstępie
14. **C2** — test ∂V/∂q vs τ_grawit
15. **C3** — boksy „spróbuj sam"
16. **D2–D11** — drobne kosmetyki

---

## Definicja sukcesu

Po wdrożeniu Tier 1 + 2:

- Student wchodzący do modułu po raz pierwszy w **pierwszych 5 minutach** widzi: schemat blokowy → legendę notacji → krok 0 z jednym ciałem → boks „dlaczego dwa przebiegi". **Nie zostaje rzucony w równania.**
- Każda formuła w krokach 2–5 jest **uzasadniona przez wcześniejszą intuicję** (single body + propagation).
- Student widzi **wzorzec 2R-planarny** wyprowadzony ręcznie, zanim spojrzy na 6-DOF.
- W playgroundzie nie tylko liczby, ale **animacja przepływu** (B1) + **bilans mocy** (B5) jako live-sanity-check.
- Demo computed-torque (A4) zamyka pętlę z motywacją ze wstępu.

---

## Tier 1 — checklist implementacyjna (do oznaczania w trakcie pracy)

- [ ] **D1** Usuń duplikat akapitu w `page.tsx` linie 166-175
- [ ] **A3** Dodaj boks „Legenda notacji" przed krokiem 1 (`<NotationLegend />` lub inline)
- [ ] **A1** Dodaj `<StepPanel number={0} title="Krok 0 — Newton-Euler dla pojedynczego ciała">`
- [ ] **A2** Dodaj boks „Dlaczego dwa przebiegi?" między krokiem 0 a 1 lub na końcu wstępu
- [ ] **B1** Stwórz `<NewtonEulerSweepDiagram />` (animowany schemat ES5)
- [ ] **C1** Stwórz `<TwoLinkPlanarWorkedExample />` jako osobną sekcję przed numerical-example

Po Tier 1 — **commit + review** zanim wchodzimy w Tier 2.
