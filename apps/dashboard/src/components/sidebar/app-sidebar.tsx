"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@basango/ui/components/sidebar";
import { LayoutDashboard, SquareTerminal } from "lucide-react";
import * as React from "react";

import { AppSidebarContent } from "./app-sidebar-content";
import { AppSidebarInfo } from "./app-sidebar-info";
import { AppSidebarUser } from "./app-sidebar-user";

const data = {
  main: [
    {
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
      ],
      title: "Overview",
      url: "#",
    },
    {
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Sources",
          url: "/sources",
        },
        {
          title: "Articles",
          url: "/articles",
        },
      ],
      title: "Dataset",
      url: "#",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <AppSidebarInfo />
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarContent items={data.main} />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
