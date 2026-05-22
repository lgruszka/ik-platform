export type ModuleMeta = {
  slug: string;
  index: number;
  title: string;
  subtitle: string;
  category: "wprowadzenie" | "analityczne" | "numeryczne" | "uczące się" | "analiza" | "bonus";
  href: string;
  status: "gotowy" | "w trakcie" | "planowany";
};

export const MODULES: readonly ModuleMeta[] = [
  {
    slug: "0-intro",
    index: 0,
    title: "Wprowadzenie do IK",
    subtitle: "Od FK do problemu odwrotnego — postawienie zagadnienia, klasyfikacja, osiągalność, singularności.",
    category: "wprowadzenie",
    href: "/modules/0-intro",
    status: "w trakcie",
  },
  {
    slug: "1-analytical-walkthrough",
    index: 1,
    title: "Wyprowadzenie analityczne",
    subtitle: "Puma560 krok-po-kroku: warunek Piepera, środek nadgarstka, q₁…q₆ z geometrii i algebry.",
    category: "analityczne",
    href: "/modules/1-analytical-walkthrough",
    status: "w trakcie",
  },
  {
    slug: "2-analytical-playground",
    index: 2,
    title: "Playground 8 rozwiązań",
    subtitle: "Rodziny shoulder × elbow × wrist — wszystkie rozwiązania zamknięte obok siebie.",
    category: "analityczne",
    href: "/modules/2-analytical-playground",
    status: "planowany",
  },
  {
    slug: "3-jacobian",
    index: 3,
    title: "Metody Jakobianowe",
    subtitle: "Jacobian Transpose, pseudoinwersja, Damped Least Squares, SDLS.",
    category: "numeryczne",
    href: "/modules/3-jacobian",
    status: "planowany",
  },
  {
    slug: "4-optimization",
    index: 4,
    title: "Optymalizacja",
    subtitle: "Nelder–Mead, gradient descent, SQP z ograniczeniami, algorytmy ewolucyjne.",
    category: "numeryczne",
    href: "/modules/4-optimization",
    status: "planowany",
  },
  {
    slug: "5-neural",
    index: 5,
    title: "Sieci neuronowe",
    subtitle: "MLP, MDN, IKFlow, diffusion — multi-modalne odwracanie f: Q → SE(3).",
    category: "uczące się",
    href: "/modules/5-neural",
    status: "planowany",
  },
  {
    slug: "6-benchmark",
    index: 6,
    title: "Benchmark",
    subtitle: "Wspólny zbiór testowy — czas, błąd, success rate, stabilność dla każdego solvera.",
    category: "analiza",
    href: "/modules/6-benchmark",
    status: "planowany",
  },
  {
    slug: "7-singularities",
    index: 7,
    title: "Singularności",
    subtitle: "det(J), manipulacyjność Yoshikawy, elipsoida manipulacyjności, zachowanie w pobliżu osobliwości.",
    category: "analiza",
    href: "/modules/7-singularities",
    status: "planowany",
  },
  {
    slug: "8-orientations",
    index: 8,
    title: "Reprezentacje orientacji",
    subtitle: "Macierz rotacji, kąty Eulera, axis-angle, wektor rotacji, kwaterniony — konwersje, gimbal lock, kiedy czego używać.",
    category: "bonus",
    href: "/modules/8-orientations",
    status: "w trakcie",
  },
  {
    slug: "9-dynamics",
    index: 9,
    title: "Dynamika odwrotna (Newton-Euler)",
    subtitle: "Od trajektorii (q, q̇, q̈) do momentów napędowych τ — robot ES5, rekurencja w przód i w tył (forward/backward sweep), tensor bezwładności.",
    category: "analiza",
    href: "/modules/9-dynamics",
    status: "w trakcie",
  },
  {
    slug: "10-energy",
    index: 10,
    title: "Silnik DC i energia napędów",
    subtitle: "Od momentu mechanicznego τᵢ przez przekładnię harmoniczną i silnik DC do mocy chwilowej i energii cyklu transportowego.",
    category: "analiza",
    href: "/modules/10-energy",
    status: "planowany",
  },
  {
    slug: "11-drive-sizing",
    index: 11,
    title: "Dobór napędów",
    subtitle: "Pełen pipeline projektowy: od τ(t) z dynamiki odwrotnej, przez 4 metryki konstrukcyjne i krzywą T-N silnika, do konkretnego modelu z katalogu Maxon/Kollmorgen + Harmonic Drive.",
    category: "analiza",
    href: "/modules/11-drive-sizing",
    status: "w trakcie",
  },
] as const;
