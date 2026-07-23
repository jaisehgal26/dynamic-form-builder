import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { serverFetchJson } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { forms } = await serverFetchJson<{
    forms: Array<{
      id: string;
      title: string;
      description: string | null;
      slug: string;
      status: "draft" | "published" | "archived";
      createdAt: number;
      updatedAt: number;
      publishedAt: number | null;
      responseCount: number;
      viewCount: number;
    }>;
  }>("/api/forms");

  const totalForms = forms.length;
  const totalResponses = forms.reduce((acc, f) => acc + f.responseCount, 0);
  const totalViews = forms.reduce((acc, f) => acc + f.viewCount, 0);
  const conversionRate = totalViews
    ? Math.round((totalResponses / totalViews) * 100)
    : 0;

  return (
    <AppShell title="Dashboard">
      <DashboardClient
        initialForms={forms}
        stats={{ totalForms, totalResponses, totalViews, conversionRate }}
      />
    </AppShell>
  );
}
