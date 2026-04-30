"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileText, Home, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: (p: string) => p === "/dashboard",
  },
  {
    href: "/dashboard",
    label: "Forms",
    icon: FileText,
    match: (p: string) =>
      p.startsWith("/dashboard/forms") || p === "/dashboard",
  },
];

interface DashboardNavProps {
  /** Called when an item is activated — used to dismiss the mobile drawer. */
  onNavigate?: () => void;
  className?: string;
}

/** Reusable sidebar content used in both desktop sidebar and mobile drawer. */
export function DashboardNav({ onNavigate, className }: DashboardNavProps) {
  const pathname = usePathname();
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-14 items-center px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <Boxes className="h-3.5 w-3.5" />
          </span>
          <span className="tracking-tightish">FormForge</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 pt-1">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Workspace
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname ?? "");
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-background text-foreground shadow-xs ring-1 ring-border/60"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-primary" : "text-muted-foreground/80",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          Back to site
        </Link>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-subtle/50 md:flex">
      <DashboardNav />
    </aside>
  );
}
