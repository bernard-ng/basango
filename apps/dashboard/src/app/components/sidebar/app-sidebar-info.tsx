"use client";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@basango/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { NewspaperIcon } from "lucide-react";

import { getPublicVersion } from "#dashboard/app/environment";

export function AppSidebarInfo() {
  const version = getPublicVersion();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<Link to="/dashboard" />} size="lg">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <NewspaperIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Basango Dashboard</span>
            <span className="truncate text-xs">Administration · v{version}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
