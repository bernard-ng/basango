import { SidebarProvider } from "@basango/ui/components/sidebar";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AppSidebar } from "#dashboard/components/sidebar/app-sidebar";
import { getClientAccessToken, getClientRefreshToken } from "#dashboard/utils/auth/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    if (typeof document === "undefined") {
      return;
    }

    if (!getClientAccessToken() && !getClientRefreshToken()) {
      throw redirect({
        search: {
          return_to: location.href,
        },
        to: "/login",
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  );
}
