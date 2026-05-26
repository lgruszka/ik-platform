"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Spis treści (Table of Contents) — sticky sidebar po prawej stronie modułu.
 *
 * Działanie:
 *  1. Skanuje DOM scrollowalnego kontenera modułu ([data-module-scroll])
 *     w poszukiwaniu nagłówków h2/h3 — generuje ID dla tych, które go nie mają.
 *  2. MutationObserver na scrollerze re-skanuje gdy client componenty
 *     dodają sekcje już po pierwszym mountcie (np. Es5IkPlayground w M12).
 *  3. Scroll listener przelicza aktywny nagłówek na podstawie pozycji
 *     widzialnej w scrollerze (najwyższy nagłówek powyżej offsetu 100 px
 *     od góry kontenera).
 *  4. Kliknięcie odsyłacza scrolluje WEWNĘTRZNY scroller (nie window) używając
 *     getBoundingClientRect — odporne na zagnieżdżone offsetParenty.
 *
 * Komponent ukryty na ekranach < xl (1280 px).
 */
export function ModuleToc() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<{ id: string; text: string; level: 2 | 3 }[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const headingsRef = useRef<HTMLHeadingElement[]>([]);

  useEffect(() => {
    if (!pathname || !pathname.startsWith("/modules/")) {
      setEntries([]);
      headingsRef.current = [];
      return;
    }

    const scroller = document.querySelector<HTMLElement>("[data-module-scroll]");
    if (!scroller) return;

    /** Skanuje DOM, generuje ID, ustawia state z listą wpisów. */
    const rescan = () => {
      const headings = Array.from(
        scroller.querySelectorAll<HTMLHeadingElement>("h2, h3"),
      );
      const seen = new Set<string>();
      const newEntries = headings.map((h) => {
        let id = h.id;
        if (!id) {
          id = slugify(h.textContent || "");
          let unique = id;
          let n = 1;
          while (seen.has(unique)) {
            unique = `${id}-${n}`;
            n++;
          }
          h.id = unique;
          id = unique;
        }
        h.style.scrollMarginTop = "24px";
        seen.add(id);
        return {
          id,
          text: h.textContent || "",
          level: (h.tagName === "H3" ? 3 : 2) as 2 | 3,
        };
      });
      headingsRef.current = headings;
      setEntries((prev) => {
        // Tylko ustaw nowe entries jeśli różnią się od poprzednich
        // (uniknij re-renderu gdy MutationObserver odpala bez powodu)
        if (prev.length === newEntries.length &&
            prev.every((p, i) => p.id === newEntries[i].id && p.text === newEntries[i].text)) {
          return prev;
        }
        return newEntries;
      });
    };

    /** Wylicza aktywny nagłówek na podstawie pozycji widzialnej w scrollerze. */
    const recomputeActive = () => {
      const headings = headingsRef.current;
      if (headings.length === 0) return;
      const scrollerTop = scroller.getBoundingClientRect().top;
      const threshold = 120; // px od góry scrollera — nagłówek nad tą linią = aktywny
      let bestId = headings[0].id;
      let bestTop = -Infinity;
      for (const h of headings) {
        const relTop = h.getBoundingClientRect().top - scrollerTop;
        if (relTop <= threshold && relTop > bestTop) {
          bestTop = relTop;
          bestId = h.id;
        }
      }
      setActiveId((prev) => (prev === bestId ? prev : bestId));
    };

    // Pierwsze skanowanie + ewentualne ponowne po krótkim czasie (na wypadek
    // gdy client componenty mountują się asynchronicznie).
    rescan();
    recomputeActive();
    const initTimer = window.setTimeout(() => {
      rescan();
      recomputeActive();
    }, 200);

    // MutationObserver — reaguje na dodawanie/usuwanie nagłówków przez
    // dynamicznie ładowane komponenty.
    let mutTimer: number | undefined;
    const mutObs = new MutationObserver(() => {
      // Debounce: zbij wiele mutacji w jeden re-scan
      if (mutTimer !== undefined) window.clearTimeout(mutTimer);
      mutTimer = window.setTimeout(() => {
        rescan();
        recomputeActive();
      }, 100);
    });
    mutObs.observe(scroller, { childList: true, subtree: true });

    // Scroll listener — przelicza aktywny nagłówek przy każdym przewinięciu.
    const onScroll = () => recomputeActive();
    scroller.addEventListener("scroll", onScroll, { passive: true });

    // Również okno (gdyby ktoś zmieniał viewport)
    const onResize = () => recomputeActive();
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.clearTimeout(initTimer);
      if (mutTimer !== undefined) window.clearTimeout(mutTimer);
      mutObs.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  if (entries.length === 0) return null;

  /**
   * Scroll wewnętrznego kontenera do nagłówka — używamy boundingClientRect
   * zamiast offsetTop, bo offsetTop jest względem offsetParent (które może być
   * dowolnym pozycjonowanym przodkiem), a boundingClientRect zawsze daje
   * pozycję względem viewportu.
   */
  const scrollToHeading = (id: string) => {
    const scroller = document.querySelector<HTMLElement>("[data-module-scroll]");
    const el = document.getElementById(id);
    if (!scroller || !el) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetScroll = scroller.scrollTop + (elRect.top - scrollerRect.top) - 16;
    scroller.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: "smooth",
    });
    // Hash w URL bez przeładowania
    if (typeof history.replaceState === "function") {
      history.replaceState(null, "", `#${id}`);
    }
    // Wymuś aktualizację active state — scroll smooth może opóźnić.
    setActiveId(id);
  };

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
                  onClick={(ev) => {
                    ev.preventDefault();
                    scrollToHeading(e.id);
                  }}
                  className={`block leading-snug py-1 pl-3 border-l-2 transition-colors ${
                    e.level === 3 ? "ml-3" : ""
                  } ${
                    isActive
                      ? "border-[var(--accent)] text-[var(--accent)] font-semibold"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--panel-border)]"
                  }`}
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
