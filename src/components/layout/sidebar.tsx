"use client";

import { CalendarDays, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavItem } from "@/components/layout/nav-item";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { Logo } from "../ui/logo";

export function Sidebar() {
  const isOpen = useUIStore((s) => s.isSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const showLabels = isOpen;

  return (
    <>
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[transform,width] duration-200 ease-in-out",
          "lg:static lg:translate-x-0",
          isOpen
            ? "w-60 translate-x-0"
            : "-translate-x-full w-[72px] lg:w-[72px] lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border px-3",
            showLabels ? "justify-between gap-2" : "justify-center",
          )}
        >
          {showLabels ? (
            <div className="flex min-w-0 flex-col items-center justify-center ">
              <Logo variant="dark" />
            </div>
          ) : (
            <span className="sr-only">Player Eventos</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => toggleSidebar()}
            aria-label={isOpen ? "Recolher menu" : "Expandir menu"}
          >
            {isOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Principal">
          <NavItem
            href="/events"
            label="Eventos"
            icon={CalendarDays}
            collapsed={!showLabels}
          />
        </nav>
      </aside>
    </>
  );
}
