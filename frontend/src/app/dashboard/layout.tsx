import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createPageMetadata } from "@/lib/seo";
import { DashboardChromeProvider } from "@/components/layout/dashboard-chrome";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Dashboard",
    description: "Manage your forms, responses, and analytics in FormForge.",
    path: "/dashboard",
    noIndex: true,
  }),
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardChromeProvider user={{ name: session.name, email: session.email }}>
      {children}
    </DashboardChromeProvider>
  );
}
