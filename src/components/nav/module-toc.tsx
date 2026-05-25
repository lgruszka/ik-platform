"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Spis treści (Table of Contents) wyświetlany jako sticky sidebar po prawej.
 *
 * Działanie:
 *  1. Po zamontowaniu (i przy każdej zmianie ścieżki) skanuje DOM scrollowalnego
 *     kontenera modułu (selektor [data-module-scroll]) w poszukiwaniu nagłówków
 *     h2/h3 wewnątrz <section> z klasą prose-ik lub bezpośrednio jako sekcje.
 *  2. Dla nagłówków bez ID automatycznie generuje slug (transliteracja PL → ASCII).
 *  3. Używa IntersectionObserver z root ustawionym na scrollowalny kontener
 *     żeby śledzić który nagłówek jest aktualnie widoczny i podświetlić go w TOC.
 *
 * Komponent ukryty na ekranach < xl (1280 px) — tam pełna szerokość treści
 * jest ważniejsza niż osobny TOC. Na większych ekranach pojawia się jako
 * 16-rem kolumna z prawej strony.
 */
export function ModuleToc() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<{ id: string; text: string; level: 2 | 3 }[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Nie pokazujemy TOC na stronie głównej modułów (samo / lub /modules)
    if (!pathname || !pathname.startsWith("/modules/")) {
      setEntries([]);
      return;
    }

    const scroller = document.querySelector<HTMLElement>("[data-module-scroll]");
    if (!scroller) return;

    // Daj DOM-owi chwilę żeby się zmontował po nawigacji
    const collect = () => {
      const headings = Array.from(
        scroller.querySelectorAll<HTMLHeadingElement>("h2, h3"),
      );
      const seen = new Set<string>();
      const newEntries = headings.map((h) => {
        let id = h.id;
        if (!id) {
          id = slugify(h.textContent || "");
          // Unikaj kolizji ID
          let unique = id;
          let n = 1;
          while (seen.has(unique)) {
            unique = `${id}-${n}`;
            n++;
          }
          h.id = unique;
          id = unique;
        }
        // CSS scroll-margin-top żeby kotwica nie chowała się pod ModuleHeader
        h.style.scrollMarginTop = "24px";
        seen.add(id);
        return {
          id,
          text: h.textContent || "",
          level: (h.tagName === "H3" ? 3 : 2) as 2 | 3,
        };
      });
      setEntries(newEntries);

      // IntersectionObserver dla aktywnego highlightu
      const observer = new IntersectionObserver(
        (records) => {
          // Aktywny: najwyżej położony nagłówek który jeszcze nie zniknął nad górą
          const visible = records
            .filter((r) => r.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length > 0) {
            setActiveId(visible[0].target.id);
          }
        },
        {
          root: scroller,
          rootMargin: "-10% 0px -75% 0px",
          threshold: 0,
        },
      );
      headings.forEach((h) => observer.observe(h));
      return observer;
    };

    // requestAnimationFrame: poczekaj aż wszystkie sekcje będą wyrenderowane
    let observer: IntersectionObserver | undefined;
    const raf = requestAnimationFrame(() => {
      observer = collect();
    });

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [pathname]);

  if (entries.length === 0) return null;

  return (
    <aside
      className="hidden xl:block w-60 shrink-0 border-l border-[var(--panel-border)] bg-[var(--panel)] p-4 overflow-y-auto sticky top-0 self-start max-h-screen"
      aria-label="Spis treści tego modułu"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted)] mb-3">
        Na tej stronie
      </p>
      <nav>
        <ul className="space-y-0.5 text-xs list-none pl-0">
          {entries.map((e) => {
            const isActive = activeId === e.id;
            return (
              <li key={e.id}>
                <a
                  href={`#${e.id}`}
                  className={`block leading-snug py-1 pl-3 border-l-2 transition-colors ${
                    e.level === 3 ? "ml-3" : ""
                  } ${
                    isActive
                      ? "border-[var(--accent)] text-[var(--accent)] font-semibold"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--panel-border)]"
                  }`}
                  onClick={(ev) => {
                    // Spróbuj smooth scroll w obrębie scrollera
                    const el = document.getElementById(e.id);
                    const scroller = document.querySelector<HTMLElement>("[data-module-scroll]");
                    if (el && scroller) {
                      ev.preventDefault();
                      scroller.scrollTo({
                        top: el.offsetTop - 16,
                        behavior: "smooth",
                      });
                      // Zaktualizuj hash w URL bez przeładowania
                      history.replaceState(null, "", `#${e.id}`);
                    }
                  }}
                >
                  {e.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

/**
 * Polish-aware slugify: usuwa diakrytyki, zamienia znaki nie-ASCII na łączniki.
 * Wystarczająco dobre dla nagłówków modułów — kolizje obsługujemy w wywołującym.
 */
function slugify(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e")
    .replace(/ł/g, "l").replace(/ń/g, "n").replace(/ó/g, "o")
    .replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z");
  return normalized
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "section";
}
