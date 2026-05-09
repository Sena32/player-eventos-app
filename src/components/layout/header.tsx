"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui.store";

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={() => toggleSidebar()}
        aria-label="Alternar menu"
      >
        <Menu className="size-4" />
      </Button>
      <div className="min-w-0 flex-1">
        <Breadcrumb />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}
