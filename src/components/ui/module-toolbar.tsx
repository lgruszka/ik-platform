"use client";

import { useEffect, useState } from "react";

/**
 * Pasek narzędzi modułu pokazujący:
 *  - czas czytania (wyliczany dynamicznie z tekstu po stronie klienta)
 *  - przyciski „rozwiń / zwiń wszystkie kroki"
 *
 * Wszystko po mount, w jednym client componentcie żeby ModuleHeader (server)
 * pozostał lekki.
 */
export function ModuleToolbar() {
  const [minutesReading, setMinutesReading] = useState<number | null>(null);
  const [stepCount, setStepCount] = useState<number>(0);

  useEffect(() => {
    const recalc = () => {
      const scroller = document.querySelector<HTMLElement>("[data-module-scroll]");
      if (!scroller) return;
      const text = scroller.innerText || "";
      // Polski czytelnik: ~200 wpm dla materiału technicznego
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.round(words / 200));
      setMinutesReading(minutes);
      // Liczba kroków (StepPanel oznaczony data-step-panel)
      setStepCount(scroller.querySelectorAll("[data-step-panel]").length);
    };
    // Odczekaj na render
    const raf = requestAnimationFrame(recalc);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggleAll = (open: boolean) => {
    document.querySelectorAll<HTMLDetailsElement>("[data-step-panel]").forEach((d) => {
      d.open = open;
    });
  };

  return (
    <div className="mt-3 flex items-center gap-3 flex-wrap text-xs">
      {minutesReading !== null && (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--code-bg)] text-[var(--muted)] font-mono"
          title="Szacunkowy czas lektury liniowej przy ~200 słów/min"
        >
          <span aria-hidden>⏱</span>
          ≈{minutesReading} min lektury
        </span>
      )}
      {stepCount > 0 && (
        <>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--code-bg)] text-[var(--muted)] font-mono">
            {stepCount} {stepCount === 1 ? "krok" : stepCount < 5 ? "kroki" : "kroków"}
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="px-2 py-1 rounded-md border border-[var(--panel-border)] text-[var(--muted)] hover:bg-[var(--code-bg)] hover:text-[var(--foreground)] font-mono"
            >
              ▾ rozwiń wszystkie
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="px-2 py-1 rounded-md border border-[var(--panel-border)] text-[var(--muted)] hover:bg-[var(--code-bg)] hover:text-[var(--foreground)] font-mono"
            >
              ▸ zwiń wszystkie
            </button>
          </div>
        </>
      )}
    </div>
  );
}
