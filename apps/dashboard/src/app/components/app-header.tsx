import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@basango/ui/components/breadcrumb";
import { Separator } from "@basango/ui/components/separator";
import { SidebarTrigger } from "@basango/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment } from "react";

import { ThemeToggle } from "#dashboard/app/components/theme-toggle";

type AppBreadcrumbItem = {
  label: string;
  to?: "/articles" | "/dashboard" | "/sources" | "/timeline";
};

export function AppHeader() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const items: AppBreadcrumbItem[] = [
    { label: "Administration", to: "/dashboard" },
    ...resolveBreadcrumbItems(pathname),
  ];

  return (
    <header className="mb-6 flex h-14 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          orientation="vertical"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => {
              const isRoot = index === 0;
              const isCurrent = index === items.length - 1;

              return (
                <Fragment key={`${item.to ?? "current"}-${item.label}`}>
                  {index > 0 ? (
                    <BreadcrumbSeparator className={index === 1 ? "hidden md:block" : ""} />
                  ) : null}
                  <BreadcrumbItem className={isRoot ? "hidden md:block" : ""}>
                    {item.to && !isCurrent ? (
                      <BreadcrumbLink render={<Link to={item.to} />}>{item.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function resolveBreadcrumbItems(pathname: string): AppBreadcrumbItem[] {
  if (/^\/articles\/[^/]+\/?$/.test(pathname)) {
    return [{ label: "Articles", to: "/articles" }, { label: "Article details" }];
  }

  if (/^\/sources\/[^/]+\/?$/.test(pathname)) {
    return [{ label: "Sources", to: "/sources" }, { label: "Source details" }];
  }

  const routeLabels: Record<string, string> = {
    "/articles": "Articles",
    "/dashboard": "Dashboard",
    "/ingestion": "Ingestion",
    "/sources": "Sources",
    "/timeline": "Timeline",
  };

  return [{ label: routeLabels[pathname] ?? "Dashboard" }];
}
