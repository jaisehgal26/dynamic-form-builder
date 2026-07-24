"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ThemeSegmentedToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "dashboard-sidebar-collapsed";

export type SidebarUser = { name: string; email: string };

type SidebarForm = {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: number;
};

function extractFormId(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/forms\/([^/]+)/);
  if (!match || match[1] === "new") return null;
  return match[1];
}

interface DashboardNavProps {
  user: SidebarUser;
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium transition-colors",
        collapsed ? "w-full justify-center py-2.5" : "gap-3 px-3 py-2.5",
        active
          ? "bg-primary/10 text-primary shadow-xs ring-1 ring-primary/15"
          : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {!collapsed && <span>{label}</span>}
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarUserMenu({
  user,
  collapsed,
  onLogout,
}: {
  user: SidebarUser;
  collapsed: boolean;
  onLogout: () => void;
}) {
  const initials = getInitials(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-left transition-colors hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed
              ? "flex h-10 w-10 items-center justify-center rounded-lg"
              : "flex w-full items-center gap-3 py-3",
          )}
          aria-label="Account menu"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align={collapsed ? "end" : "start"}
        sideOffset={10}
        alignOffset={collapsed ? 0 : 12}
        className="w-60"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </p>
          <ThemeSegmentedToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="gap-2 text-muted-foreground focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarFormsList({
  forms,
  loading,
  query,
  activeFormId,
  collapsed,
  onNavigate,
}: {
  forms: SidebarForm[];
  loading: boolean;
  query: string;
  activeFormId: string | null;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...forms].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter((form) => form.title.toLowerCase().includes(q));
  }, [forms, query]);

  if (collapsed) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
        {forms.length === 0 ? "No forms yet" : "No forms match your search"}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {filtered.map((form) => {
        const active = form.id === activeFormId;
        return (
          <li key={form.id}>
            <Link
              href={`/dashboard/forms/${form.id}/builder`}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
                active
                  ? "bg-primary/10 ring-1 ring-primary/15"
                  : "hover:bg-background/80",
              )}
            >
              <FileText
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground/70",
                )}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium",
                  active ? "text-primary" : "text-foreground",
                )}
              >
                {form.title}
              </span>
              {form.status === "draft" && (
                <span className="shrink-0 text-[11px] text-muted-foreground/70">Draft</span>
              )}
              {form.status === "archived" && (
                <span className="shrink-0 text-[11px] text-muted-foreground">Archived</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Reusable sidebar content used in both desktop sidebar and mobile drawer. */
export function DashboardNav({
  user,
  collapsed = false,
  onNavigate,
  className,
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const formId = extractFormId(pathname ?? "");
  const onDashboard = pathname === "/dashboard";

  const [forms, setForms] = React.useState<SidebarForm[]>([]);
  const [loadingForms, setLoadingForms] = React.useState(true);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setLoadingForms(true);
    fetch("/api/forms")
      .then((res) => res.json())
      .then((data: { forms?: SidebarForm[] }) => {
        if (!cancelled) setForms(data.forms ?? []);
      })
      .catch(() => {
        if (!cancelled) setForms([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingForms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("flex h-full flex-col", className)}>
        <div
          className={cn(
            "flex shrink-0 border-b border-border/50",
            collapsed
              ? "w-full flex-col items-center py-3"
              : "h-16 items-center px-4",
          )}
        >
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={cn(
              "group flex shrink-0 items-center justify-center",
              collapsed ? "h-10 w-10" : "min-w-0",
            )}
          >
            {collapsed ? (
              <Logo size={28} className="transition-transform group-hover:scale-[1.03]" />
            ) : (
              <LogoMark size="sm" />
            )}
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              "shrink-0",
              collapsed
                ? "flex w-full flex-col items-center gap-1 py-3"
                : "space-y-1 p-3",
            )}
          >
            <NavLink
              href="/dashboard"
              label="Dashboard"
              icon={LayoutDashboard}
              active={onDashboard}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/forms/new"
                    onClick={onNavigate}
                    aria-label="New form"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">New form</TooltipContent>
              </Tooltip>
            ) : (
              <Button asChild className="w-full justify-start gap-2" size="sm">
                <Link href="/dashboard/forms/new" onClick={onNavigate}>
                  <Plus className="h-4 w-4" />
                  New form
                </Link>
              </Button>
            )}

          </div>

          {!collapsed && (
            <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
              <div className="relative mb-2 shrink-0">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search forms…"
                  className="h-8 bg-background/60 pl-8 text-sm"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SidebarFormsList
                  forms={forms}
                  loading={loadingForms}
                  query={query}
                  activeFormId={formId}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "shrink-0 border-t border-border/50",
            collapsed ? "flex w-full justify-center py-2" : "px-3",
          )}
        >
          <SidebarUserMenu user={user} collapsed={collapsed} onLogout={onLogout} />
        </div>
      </div>
    </TooltipProvider>
  );
}

function SidebarFloatingToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute right-0 top-16 z-30 flex h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center",
            "rounded-full border border-border/80 bg-subtle/40 text-muted-foreground shadow-sm backdrop-blur-sm",
            "transition-all duration-200 hover:border-border hover:bg-background hover:text-foreground hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {collapsed ? "Expand sidebar" : "Collapse sidebar"}
      </TooltipContent>
    </Tooltip>
  );
}

interface DashboardSidebarProps {
  user: SidebarUser;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
    setReady(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col overflow-visible border-r border-border/60 bg-subtle/40 transition-[width] duration-200 ease-out md:flex",
        ready && collapsed ? "w-[72px]" : "w-72",
      )}
    >
      <TooltipProvider delayDuration={0}>
        <DashboardNav user={user} collapsed={ready && collapsed} />
        <SidebarFloatingToggle collapsed={ready && collapsed} onToggle={toggleCollapse} />
      </TooltipProvider>
    </aside>
  );
}
