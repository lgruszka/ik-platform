"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Spis treści (TOC) — sticky sidebar po prawej stronie modułu.
 *
 * Implementacja jest świadomie agnostyczna względem TEGO który element
 * faktycznie scrolluje (window vs wewnętrzny div). Powód: w naszym layoucie
 * body ma `min-h-full`, więc może rosnąć z treścią — i wtedy to window
 * scrolluje, nie wewnętrzny [data-module-scroll]. W innych konfiguracjach
 * (mobile, mniejszy viewport) może być odwrotnie.
 *
 * Strategia:
 *  - Click → element.scrollIntoView() — przeglądarka sama wybiera scroller
 *    i respektuje scroll-margin-top elementu (ustawione na headingach).
 *  - Active state → IntersectionObserver z root=null (window viewport)
 *    działa niezależnie od tego który kontener scrolluje.
 *  - MutationObserver na body re-skanuje gdy client componenty
 *    dodają nagłówki asynchronicznie (np. Es5IkPlayground w M12).
 */
export function ModuleToc() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<{ id: string; text: string; level: 2 | 3 }[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!pathname || !pathname.startsWith("/modules/")) {
      setEntries([]);
      return;
    }

    const scopeRoot = document.querySelector<HTMLElement>("[data-module-scroll]") ?? document.body;

    /** Skanuje DOM modułu, generuje brakujące ID, ustawia state. */
    const rescan = () => {
      const headings = Array.from(
        scopeRoot.querySelectorAll<HTMLHeadingElement>("h2, h3"),
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
        // Większy margines — działa z scrollIntoView dla obu scroll-rootów.
        h.style.scrollMarginTop = "80px";
        seen.add(id);
        return {
          id,
          text: h.textContent || "",
          level: (h.tagName === "H3" ? 3 : 2) as 2 | 3,
        };
      });

      setEntries((prev) => {
        if (prev.length === newEntries.length &&
            prev.every((p, i) => p.id === newEntries[i].id && p.text === newEntries[i].text)) {
          return prev;
        }
        return newEntries;
      });

      // Reset IntersectionObserver na świeżej liście headingów.
      observerRef.current?.disconnect();
      const obs = new IntersectionObserver(
        (records) => {
          // Aktywny: pierwszy widoczny nagłówek od góry viewportu.
          const visible = records
            .filter((r) => r.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length > 0) {
            const id = visible[0].target.id;
            setActiveId((prev) => (prev === id ? prev : id));
          }
        },
        {
          root: null, // viewport — działa dla każdego scroll-roota
          rootMargin: "-80px 0px -70% 0px",
          threshold: 0,
        },
      );
      headings.forEach((h) => obs.observe(h));
      observerRef.current = obs;
    };

    // Pierwsze skanowanie + ewentualne ponowne po krótkim czasie na wypadek
    // gdy client componenty mountują się asynchronicznie.
    rescan();
    const initTimer = window.setTimeout(rescan, 250);

    // MutationObserver — łapie dynamicznie dodawane nagłówki.
    let mutTimer: number | undefined;
    const mutObs = new MutationObserver(() => {
      if (mutTimer !== undefined) window.clearTimeout(mutTimer);
      mutTimer = window.setTimeout(rescan, 150);
    });
    mutObs.observe(scopeRoot, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(initTimer);
      if (mutTimer !== undefined) window.clearTimeout(mutTimer);
      mutObs.disconnect();
      observerRef.current?.disconnect();
    };
  }, [pathname]);

  if (entries.length === 0) return null;

  /**
   * Scroll do nagłówka — używamy scrollIntoView, przeglądarka sama znajduje
   * scrollowalnego przodka (window albo wewnętrzny div). Heading ma
   * scroll-margin-top: 80px ustawione w rescan() — chroni przed schowaniem
   * pod sticky nagłówkiem ModuleHeader.
   */
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof history.replaceState === "function") {
      history.replaceState(null, "", `#${id}`);
    }
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

/** Polish-aware slugify: usuwa diakrytyki, zamienia znaki nie-ASCII na łączniki. */
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
