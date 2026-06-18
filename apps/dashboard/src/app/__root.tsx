import "@basango/ui/globals.css";

import { Toaster } from "@basango/ui/components/sonner";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import type { ReactNode } from "react";

import type { RouterContext } from "#dashboard/router-context";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1, maximum-scale=1", name: "viewport" },
      { title: "Basango | AI-powered news curation dashboard" },
      {
        content: "Basango : The intelligent news curation platform.",
        name: "description",
      },
    ],
  }),
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <NuqsAdapter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableColorScheme
          enableSystem
        >
          <Outlet />
        </ThemeProvider>
        <Toaster />
      </NuqsAdapter>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
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

function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center text-sm text-[#606060]">
      <h2 className="mb-2 font-semibold text-xl">Not Found</h2>
      <p className="mb-4">Could not find requested resource</p>
      <a className="underline" href="/dashboard">
        Return Home
      </a>
    </div>
  );
}
