import type { ReactNode } from "react";

type Props = {
  code: string;
  /** Krótki podpis — np. „implementacja eq. (A.13)" albo „linie 12-15 pełnej funkcji". */
  caption?: ReactNode;
  /** Etykieta na pasku — domyślnie „Python". Można też „Python · krok 3". */
  label?: string;
};

/**
 * Niewielki blok kodu w Pythonie wstawiany OBOK wyprowadzenia matematycznego,
 * żeby student widział natychmiastowe przełożenie wzorów na kod. Zasady:
 *
 * 1. Snippet ma być KRÓTKI (3–10 linii). Jeden wzór z MathBlock = jeden snippet.
 * 2. Nazwy zmiennych zgodne z notacją w dysertacji/wyprowadzeniu (s1, c5, p5x...).
 * 3. Komentarz na górze odsyła do konkretnego wzoru (eq. lub krok).
 * 4. Snippety są kawałkami JEDNEJ funkcji która zostanie złożona na końcu modułu
 *    w sekcji „Kompletna funkcja Python".
 *
 * Nie używamy syntax highlightera (Prism/Shiki) — komponent ma być zerowym
 * kosztem JS dla strony, a kod jest na tyle prosty że monospace wystarcza.
 */
export function PythonStep({ code, caption, label = "Python" }: Props) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] my-3 not-prose overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--panel)] border-b border-[var(--panel-border)]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <span aria-hidden>🐍</span>
          <span>{label}</span>
        </span>
        {caption && (
          <span className="text-xs text-[var(--muted)] italic">{caption}</span>
        )}
      </div>
      <pre className="px-4 py-3 text-xs leading-relaxed overflow-x-auto m-0">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
