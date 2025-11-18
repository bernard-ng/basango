import { SidebarInset, SidebarProvider } from "@basango/ui/components/sidebar";

import { AppSidebar } from "#dashboard/components/sidebar/app-sidebar";
import { HydrateClient } from "#dashboard/trpc/server";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HydrateClient>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </HydrateClient>
  );
}
