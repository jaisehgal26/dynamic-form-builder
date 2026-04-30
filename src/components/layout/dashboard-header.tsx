"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
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
    <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="flex min-w-0 items-center gap-1 text-sm">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {b.href ? (
                  <Link
                    href={b.href}
                    className="truncate text-muted-foreground hover:text-foreground"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-foreground">
                    {b.label}
                  </span>
                )}
                {i < breadcrumb.length - 1 && (
                  <span className="text-muted-foreground">/</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="truncate text-base font-semibold">
            {title ?? "Dashboard"}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials || <User className="h-3.5 w-3.5" />}
              </span>
              <span className="hidden text-sm sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
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
