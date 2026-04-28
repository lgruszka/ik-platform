import { ModuleNav } from "@/components/nav/module-nav";

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0">
      <ModuleNav />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
