import type { ReactNode } from "react";

type Props = {
  number: number | string;
  title: string;
  children: ReactNode;
};

export function StepPanel({ number, title, children }: Props) {
  return (
    <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden">
      <header className="step-header">
        <span className="step-num">Krok {number}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </header>
      <div className="px-5 py-5 prose-ik max-w-none">{children}</div>
    </section>
  );
}
