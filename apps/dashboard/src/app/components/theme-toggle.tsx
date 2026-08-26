"use client";

import { Button } from "@basango/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@basango/ui/components/dropdown-menu";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { useHydrated } from "#dashboard/app/hooks/use-hydrated";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button className="h-8 w-8 shrink-0" size="icon" variant="ghost" />}
      >
        {theme === "light" ? (
          <SunIcon className="h-4 w-4" />
        ) : theme === "dark" ? (
          <MoonIcon className="h-4 w-4" />
        ) : (
          <LaptopIcon className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <SunIcon className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <LaptopIcon className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
