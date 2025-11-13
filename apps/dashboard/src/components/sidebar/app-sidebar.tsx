"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@basango/ui/components/sidebar";
import { SquareTerminal } from "lucide-react";
import * as React from "react";

import { AppSidebarContent } from "./app-sidebar-content";
import { AppSidebarInfo } from "./app-sidebar-info";
import { AppSidebarUser } from "./app-sidebar-user";

const data = {
  main: [
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppSidebarInfo />
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarContent items={data.main} />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
