# IK Platform — odwrotna kinematyka w praktyce

Interaktywny materiał dydaktyczny dla studentów robotyki. Pokrywa klasyczną odwrotną kinematykę (IK) manipulatorów szeregowych — od rozwiązania analitycznego zamkniętego (Puma560 / warunek Piepera) przez metody Jakobianowe, optymalizacyjne, po sieci neuronowe, z jednym wspólnym środowiskiem testowym i benchmarkiem.

Projekt powstał jako materiał do zajęć na politechnice — każdy moduł łączy wyprowadzenie matematyczne, referencyjną implementację kodu i interaktywny eksperyment w przeglądarce.

## Moduły

0. **Wprowadzenie do IK** — FK vs IK, wielokrotność rozwiązań, osiągalność, singularności, klasyfikacja rodzin metod.
1. **Walkthrough analityczny (Puma560)** — pełne wyprowadzenie rozwiązania zamkniętego krok po kroku, warunek Piepera, 8-krotne rozwiązanie.
2. **Playground 8 rozwiązań** — wszystkie gałęzie shoulder × elbow × wrist jednocześnie, animacja trajektorii.
3. **Metody Jakobianowe** — Jacobian Transpose, Pseudoinverse, DLS (Levenberg-Marquardt), Adaptive DLS; porównanie zbieżności i czasów.
4. **Optymalizacja** — Nelder-Mead, Gradient Descent z Armijo, omówienie SQP.
5. **Sieci neuronowe** — trenowalny MLP od zera (Adam, MSE), hybryda NN → DLS; teoria MDN, IKFlow, diffusion.
6. **Benchmark** — ten sam deterministyczny zbiór testowy dla wszystkich solverów; success rate, czas mean/median/p95.
7. **Singularności** — manipulacyjność Yoshikawy, elipsoida, profile w(q), rzutowanie na przestrzeń zerową jakobianu.

## Stos technologiczny

- **Next.js 16** (App Router, Turbopack, statyczne prerenderowanie)
- **React 19.2** + **TypeScript 5**
- **React Three Fiber** + **three.js** — wizualizacja 3D
- **Tailwind CSS 4**
- **KaTeX** — notacja matematyczna
- **Zustand** — lokalne store'y stanu robota i pozy docelowej

Wszystkie solvery (analityczny, Jakobianowe, optymalizacyjne, MLP) napisane są od zera w TypeScript — bez zewnętrznych bibliotek ML — żeby kod był w pełni przejrzysty dla studenta.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

### Walidacja solvera analitycznego

```bash
npx tsx src/lib/solvers/__smoke.ts
```

Round-trip FK → IK → FK na 6 przypadkach testowych (w tym przy singularności nadgarstka). Błąd powinien być rzędu maszynowej precyzji (~10⁻¹⁴).

### Test solverów Jakobianowych i optymalizacyjnych

```bash
npx tsx src/lib/solvers/__jacobian_smoke.ts
npx tsx src/lib/solvers/__opt_smoke.ts
```

### Regeneracja case-study

```bash
npm run case-study
```

Wypisuje na konsolę wszystkie wartości pośrednie dla konfiguracji zdefiniowanej w `scripts/generate-case-study.ts`. Jeśli zmienisz `Q_TRUE` w tym pliku, dostaniesz nowy zestaw liczb, który można wkleić do `docs/case-study-liczbowy.md`.

### Generowanie PDF-ów dokumentacji

Dokumentację w `docs/*.md` można wygenerować do PDF przez pandoc + xelatex:

```bash
npm run docs:pdf
```

Wynik: `docs/pdf/plan-wykladu.pdf`, `docs/pdf/ik-analityczna-cookbook.pdf`, `docs/pdf/zadania.pdf`, `docs/pdf/case-study-liczbowy.pdf`.

Wymaga pandoc + xelatex. Instalacja:

| System | Komenda |
|--------|---------|
| macOS  | `brew install pandoc basictex` |
| Ubuntu | `sudo apt install pandoc texlive-xetex texlive-fonts-recommended` |
| Arch   | `sudo pacman -S pandoc texlive-xetex texlive-fontsrecommended` |

## Dokumenty dydaktyczne

W katalogu `docs/` znajdują się cztery dokumenty Markdown do prowadzenia zajęć:

- **`plan-wykladu.md`** — szczegółowy scenariusz 90-minutowego wykładu (8 bloków, plan czasowy, co mówić, co pokazywać w aplikacji, pytania kontrolne, praca domowa).
- **`ik-analityczna-cookbook.md`** — skondensowany przepis na wyprowadzenie IK krok po kroku (16 sekcji, gotowy do dystrybucji studentom).
- **`case-study-liczbowy.md`** — pełny przykład liczbowy dla konkretnej pozy Pumy560, z wartościami pośrednimi każdego kroku.
- **`zadania.md`** — 10 zadań praktycznych (laboratoria + domowe), podzielone na łatwe/średnie/wymagające, z kryterium oceny i sugestią punktów.

## Deploy

Projekt jest w pełni kompatybilny z platformą [Vercel](https://vercel.com) (statyczne prerenderowanie + R3F w przeglądarce, zero wymagań serwerowych).

### Przez GitHub + Vercel dashboard

1. Wepchnij repozytorium na GitHub.
2. Zaimportuj projekt na [vercel.com/new](https://vercel.com/new) — Next.js jest wykrywany automatycznie.
3. Żadne zmienne środowiskowe nie są wymagane.
4. Deploy zostanie automatycznie uruchomiony przy każdym pushu.

### Przez Vercel CLI

```bash
npm i -g vercel
vercel deploy              # podgląd (preview)
vercel deploy --prod       # produkcja
```

## Struktura katalogów

```
src/
├── app/                    # strony Next.js (App Router)
│   ├── layout.tsx
│   ├── page.tsx            # landing z siatką modułów
│   └── modules/            # 8 modułów dydaktycznych
├── components/
│   ├── robot/              # wizualizacje 3D Pumy (R3F)
│   ├── walkthrough/        # elementy modułu analitycznego
│   ├── playground/         # moduł 2
│   ├── jacobian/           # moduł 3
│   ├── optimization/       # moduł 4
│   ├── neural/             # moduł 5
│   ├── benchmark/          # moduł 6
│   ├── singularities/      # moduł 7
│   ├── nav/                # nawigacja
│   └── ui/                 # komponenty współdzielone
├── lib/
│   ├── math/               # matrix, rotations, twist (SE(3)), linalg, jacobian, eigen
│   ├── robots/             # DH, FK, Puma560 DH params
│   ├── solvers/            # analityczny Puma, Jakobianowe, optymalizacyjne
│   ├── ml/                 # MLP + dataset FK syntetyczny
│   ├── benchmark.ts        # generator zbioru testowego + agregacja wyników
│   ├── store.ts            # stan robota (bieżąca konfiguracja)
│   ├── target-store.ts     # stan pozy docelowej
│   └── playground-store.ts # stan wyboru gałęzi w module 2
public/
└── images/dh/              # rysunki DH z Wikimedia Commons (PD / Jahobr)
```

## Licencja i atrybucja

- Kod źródłowy projektu: MIT (autor: wykładowca + Claude Code).
- Rysunki DH w `public/images/dh/`: **Public Domain**, autor Jahobr, źródło [Wikimedia Commons — Category:Denavit-Hartenberg transformation](https://commons.wikimedia.org/wiki/Category:Denavit-Hartenberg_transformation).
- Rozwiązanie analityczne Pumy560 oparte na: Craig, *Introduction to Robotics: Mechanics and Control*, wyd. 3, Pearson 2005, rozdz. 3 i 4. Książka nie jest redystrybuowana z tym projektem — studenci korzystają z własnych kopii.

## Wymagania

- Node.js 20.9+ (LTS)
- npm / pnpm / yarn / bun
- Nowoczesna przeglądarka z WebGL 2 (Chrome 111+, Firefox 111+, Safari 16.4+)
