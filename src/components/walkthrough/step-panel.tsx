import type { ReactNode } from "react";

type Props = {
  number: number | string;
  title: string;
  children: ReactNode;
  /** Czy panel ma być domyślnie zwinięty. Domyślnie false (otwarty). */
  defaultCollapsed?: boolean;
};

/**
 * Panel kroku wyprowadzenia. Renderowany jako natywny <details>, więc każdy
 * krok da się indywidualnie zwinąć/rozwinąć kliknięciem nagłówka. Domyślnie
 * otwarte — komponent <ExpandCollapseAll /> w ModuleHeader może toggle'ować
 * wszystkie kroki naraz.
 *
 * Atrybut data-step-panel pozwala client-side widget'om (ExpandCollapseAll)
 * znaleźć wszystkie panele kroków bez sztucznej rejestracji.
 */
export function StepPanel({ number, title, children, defaultCollapsed = false }: Props) {
  return (
    <details
      open={!defaultCollapsed}
      data-step-panel
      className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden group"
    >
      <summary className="step-header list-none cursor-pointer flex items-center gap-3 [&::-webkit-details-marker]:hidden [&::marker]:hidden">
        <span className="step-num">Krok {number}</span>
        <h3 className="text-lg font-semibold flex-1 leading-tight">{title}</h3>
        <span
          aria-hidden
          className="text-sm text-[var(--muted)] group-open:rotate-180 transition-transform duration-150 mr-2"
        >
          ▾
        </span>
      </summary>
      <div className="px-5 py-5 prose-ik max-w-none">{children}</div>
    </details>
  );
}
