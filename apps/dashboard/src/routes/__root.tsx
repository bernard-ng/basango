import "@basango/ui/globals.css";

import { createRootRouteWithContext } from "@tanstack/react-router";

import { RootComponent, RootDocument, RootNotFound } from "#dashboard/app/routes/root-route";
import type { RouterContext } from "#dashboard/router-context";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1, maximum-scale=1", name: "viewport" },
      { title: "Basango | AI-powered news curation dashboard" },
      {
        content: "Basango: The intelligent news curation platform.",
        name: "description",
      },
    ],
  }),
  notFoundComponent: RootNotFound,
  shellComponent: RootDocument,
});
