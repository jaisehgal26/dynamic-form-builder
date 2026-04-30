"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, Menu, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DashboardNav } from "./dashboard-sidebar";

interface DashboardHeaderProps {
  user: { name: string; email: string };
  title?: string;
  breadcrumb?: { href?: string; label: string }[];
  actions?: React.ReactNode;
}

export function DashboardHeader({
  user,
  title,
  breadcrumb,
  actions,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Close drawer on route change
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Mobile menu button */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="md:hidden text-muted-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-subtle/95 p-0 w-64"
            hideClose
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Workspace navigation</SheetTitle>
            </SheetHeader>
            <DashboardNav onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="flex min-w-0 items-center gap-1.5 text-sm">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {b.href ? (
                  <Link
                    href={b.href}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-foreground">
                    {b.label}
                  </span>
                )}
                {i < breadcrumb.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="truncate text-sm font-medium tracking-tightish">
            {title ?? "Dashboard"}
          </h1>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {actions}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-1.5"
              aria-label="Account menu"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                {initials || <User className="h-3 w-3" />}
              </span>
              <span className="hidden text-sm font-normal text-muted-foreground sm:inline">
                {user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
