import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: { href?: string; label: string }[];
  actions?: React.ReactNode;
}

export async function AppShell({
  children,
  title,
  breadcrumb,
  actions,
}: AppShellProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted/10">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          user={{ name: session.name, email: session.email }}
          title={title}
          breadcrumb={breadcrumb}
          actions={actions}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
