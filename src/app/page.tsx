import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = ["wprowadzenie", "analityczne", "numeryczne", "uczące się", "analiza", "bonus"] as const;

export default function Home() {
  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <header className="mb-12">
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--muted)] mb-3">
          Materiał dydaktyczny · Politechnika
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Odwrotna kinematyka w praktyce
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-3xl leading-relaxed">
          Od metody analitycznej dla manipulatora Puma560, przez algorytmy
          Jakobianowe i optymalizacyjne, po sieci neuronowe. Każda metoda: wzór —
          implementacja — wizualizacja — eksperyment.
        </p>
      </header>

      <section className="space-y-10">
        {CATEGORIES.map((cat) => {
          const modsInCat = MODULES.filter((m) => m.category === cat);
          if (modsInCat.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="text-sm font-mono uppercase tracking-[0.15em] text-[var(--muted)] mb-4">
                {cat}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {modsInCat.map((m) => (
                  <Link key={m.slug} href={m.href} className="group">
                    <Card className="h-full transition-colors group-hover:border-[var(--accent)]">
                      <CardHeader>
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-xs text-[var(--muted)]">
                            {String(m.index).padStart(2, "0")}
                          </span>
                          <CardTitle className="group-hover:text-[var(--accent)]">
                            {m.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <CardDescription>{m.subtitle}</CardDescription>
                        {m.status !== "gotowy" && (
                          <div className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                            · {m.status}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="mt-16 pt-8 border-t border-[var(--panel-border)] text-sm text-[var(--muted)]">
        <p>
          Platforma open-source — kod źródłowy zawiera implementacje referencyjne
          w TypeScript oraz w Pythonie (uruchamianym w przeglądarce przez
          Pyodide). Oba wydania są matematycznie równoważne.
        </p>
      </footer>
    </main>
  );
}
