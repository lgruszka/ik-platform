"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function ModuleNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 border-r border-[var(--panel-border)] bg-[var(--panel)] p-4 overflow-y-auto">
      <Link
        href="/"
        className="block text-sm font-mono uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] mb-4"
      >
        ← IK Platform
      </Link>
      <div className="space-y-0.5">
        {MODULES.map((m) => {
          const active = pathname?.startsWith(m.href);
          return (
            <Link
              key={m.slug}
              href={m.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--accent-muted)] text-[var(--accent)] font-medium"
                  : "text-[var(--foreground)] hover:bg-[var(--code-bg)]",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-[var(--muted)]">
                  {String(m.index).padStart(2, "0")}
                </span>
                <span>{m.title}</span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5 leading-snug">
                {m.category}
                {m.status !== "gotowy" && (
                  <span className="ml-1.5 inline-block text-[10px] font-mono uppercase tracking-wider">
                    · {m.status}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
