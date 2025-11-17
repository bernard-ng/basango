import { Separator } from "@basango/ui/components/separator";
import { SidebarTrigger } from "@basango/ui/components/sidebar";

import { ThemeToggle } from "#dashboard/components/theme-toggle";

export function PageHeader() {
  return (
    <header className="border-b flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
      </div>
      <div className="flex items-center gap-2 px-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
