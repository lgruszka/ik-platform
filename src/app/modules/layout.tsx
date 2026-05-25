import { ModuleNav } from "@/components/nav/module-nav";
import { ModuleToc } from "@/components/nav/module-toc";

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0">
      <ModuleNav />
      <div className="flex-1 overflow-y-auto" data-module-scroll>{children}</div>
      <ModuleToc />
    </div>
  );
}
