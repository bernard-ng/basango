"use client";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@basango/ui/components/sidebar";

export function AppSidebarInfo() {
  const version = process.env.NEXT_PUBLIC_VERSION || "0.0.0";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          size="lg"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <img alt="Logo" className="size-8 rounded-lg object-cover" src="/logo.svg" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Basango</span>
            <span className="truncate text-xs">v{version}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
