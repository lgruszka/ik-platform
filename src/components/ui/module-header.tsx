import { MODULES } from "@/lib/modules";
import { ModuleToolbar } from "@/components/ui/module-toolbar";

export function ModuleHeader({ slug }: { slug: string }) {
  const m = MODULES.find((x) => x.slug === slug);
  if (!m) return null;
  return (
    <header className="border-b border-[var(--panel-border)] px-8 py-6">
      <div className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--muted)]">
        Moduł {String(m.index).padStart(2, "0")} · {m.category}
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{m.title}</h1>
      <p className="mt-2 text-[var(--muted)] max-w-3xl">{m.subtitle}</p>
      <ModuleToolbar />
    </header>
  );
}
