import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@basango/ui/components/breadcrumb";
import { Separator } from "@basango/ui/components/separator";
import { SidebarTrigger } from "@basango/ui/components/sidebar";

import { Show } from "#dashboard/components/shell/show";
import { ThemeToggle } from "#dashboard/components/theme-toggle";

type Props = {
  title?: string | React.ReactNode;
};

export function PageHeader({ title }: Props) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />

        <Show when={title !== undefined}>
          <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Show>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
