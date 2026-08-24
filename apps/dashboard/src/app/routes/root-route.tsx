import { SidebarInset, SidebarProvider } from "@basango/ui/components/sidebar";
import { Toaster } from "@basango/ui/components/sonner";
import { HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import type { ReactNode } from "react";

import { isPublicAuthPath } from "../auth/public-paths";
import { AppHeader } from "../components/app-header";
import { AppSidebar } from "../components/sidebar/app-sidebar";

type RootDocumentProps = {
  children: ReactNode;
};

export function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const showSidebar = !isPublicAuthPath(pathname);

  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableColorScheme
        enableSystem
      >
        {showSidebar ? (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <AppHeader />
              <div className="@container/main mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 pt-0">
                <Outlet />
              </div>
            </SidebarInset>
          </SidebarProvider>
        ) : (
          <Outlet />
        )}
        <Toaster />
      </ThemeProvider>
    </NuqsAdapter>
  );
}

export function RootDocument({ children }: RootDocumentProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export function RootNotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center text-sm text-muted-foreground">
      <h2 className="mb-2 font-semibold text-xl text-foreground">Not Found</h2>
      <p className="mb-4">Could not find requested resource</p>
      <a className="underline" href="/dashboard">
        Return home
      </a>
    </div>
  );
}
