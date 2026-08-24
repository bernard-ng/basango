"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from "@basango/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";

type AppSidebarItem = {
  title: string;
  url: string;
};

type AppSidebarGroup = {
  items: readonly AppSidebarItem[];
  title: string;
};

type AppSidebarContentProps = {
  groups: readonly AppSidebarGroup[];
};

export function AppSidebarContent({ groups }: AppSidebarContentProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuSubButton
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                    render={<Link to={item.url} />}
                  >
                    <span>{item.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
