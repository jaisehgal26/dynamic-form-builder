"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileText, Home, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard?tab=forms", label: "Forms", icon: FileText },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-muted/20 md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">FormForge</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href.split("?")[0]
            : pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-background hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
