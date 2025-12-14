import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@basango/ui/components/breadcrumb";
import { SidebarTrigger } from "@basango/ui/components/sidebar";

import { ThemeToggle } from "../theme-toggle";

type Props = {
  title?: string | React.ReactNode;
};

export function PageHeader({ title }: Props) {
  return (
    <header className="w-full flex justify-between items-center border-b py-2 px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage className="font-bold">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
