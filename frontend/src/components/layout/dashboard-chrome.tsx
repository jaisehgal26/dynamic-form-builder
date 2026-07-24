"use client";

import * as React from "react";
import { DashboardSidebar, type SidebarUser } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

type DashboardChromeState = {
  actions?: React.ReactNode;
};

type DashboardChromeContextValue = {
  chrome: DashboardChromeState;
  setChrome: (chrome: DashboardChromeState) => void;
};

const DashboardChromeContext = React.createContext<DashboardChromeContextValue | null>(
  null,
);

export function useDashboardChrome() {
  const ctx = React.useContext(DashboardChromeContext);
  if (!ctx) {
    throw new Error("useDashboardChrome must be used within DashboardChromeProvider");
  }
  return ctx;
}

export function DashboardChromeProvider({
  user,
  children,
}: {
  user: SidebarUser;
  children: React.ReactNode;
}) {
  const [chrome, setChrome] = React.useState<DashboardChromeState>({});

  const value = React.useMemo(() => ({ chrome, setChrome }), [chrome]);

  return (
    <DashboardChromeContext.Provider value={value}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader user={user} />
          <main className="min-h-0 flex-1">{children}</main>
        </div>
      </div>
    </DashboardChromeContext.Provider>
  );
}

export function DashboardPageChrome({
  actions,
  children,
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { setChrome } = useDashboardChrome();

  React.useLayoutEffect(() => {
    setChrome({ actions });
  }, [actions, setChrome]);

  React.useEffect(() => {
    return () => setChrome({});
  }, [setChrome]);

  return <>{children}</>;
}
