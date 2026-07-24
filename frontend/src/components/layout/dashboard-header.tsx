"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDashboardChrome } from "./dashboard-chrome";
import { DashboardNav, type SidebarUser } from "./dashboard-sidebar";

interface DashboardHeaderProps {
  user: SidebarUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { chrome } = useDashboardChrome();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md sm:px-6 md:hidden">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-subtle/95 p-0" hideClose>
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
          </SheetHeader>
          <DashboardNav user={user} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex shrink-0 items-center gap-1">{chrome.actions}</div>
    </header>
  );
}
