import { SidebarInset, SidebarProvider } from "@basango/ui/components/sidebar";

import { PageHeader } from "@/components/shell/page-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { HydrateClient } from "@/trpc/server";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HydrateClient>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <PageHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </HydrateClient>
  );
}
