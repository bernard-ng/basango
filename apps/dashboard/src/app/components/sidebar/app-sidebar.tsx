"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@basango/ui/components/sidebar";
import type { ComponentProps } from "react";

import { AppSidebarContent } from "./app-sidebar-content";
import { AppSidebarInfo } from "./app-sidebar-info";
import { AppSidebarUser } from "./app-sidebar-user";

const navigationGroups = [
  {
    items: [
      { title: "Dashboard", url: "/dashboard" },
      { title: "Ingestion", url: "/ingestion" },
      { title: "Timeline", url: "/timeline" },
    ],
    title: "System",
  },
  {
    items: [
      { title: "Search", url: "/search" },
      { title: "Sources", url: "/sources" },
      { title: "Articles", url: "/articles" },
      { title: "Categories", url: "/categories" },
    ],
    title: "Content",
  },
  {
    items: [{ title: "Users", url: "/users" }],
    title: "Access",
  },
] as const;

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <AppSidebarInfo />
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarContent groups={navigationGroups} />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
