"use client";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@basango/ui/components/sidebar";

import { getPublicVersion } from "#dashboard/utils/environment";

export function AppSidebarInfo() {
  const version = getPublicVersion();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg">
          <a href="#">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Basango Dashboard</span>
              <span className="truncate text-xs">v{version}</span>
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
