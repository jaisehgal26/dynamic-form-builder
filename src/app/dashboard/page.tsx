import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { formEvents, formResponses, forms } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await db
    .select({
      id: forms.id,
      title: forms.title,
      description: forms.description,
      slug: forms.slug,
      status: forms.status,
      createdAt: forms.createdAt,
      updatedAt: forms.updatedAt,
      publishedAt: forms.publishedAt,
      responseCount: sql<number>`(SELECT COUNT(*) FROM ${formResponses} WHERE ${formResponses.formId} = ${forms.id})`,
      viewCount: sql<number>`(SELECT COUNT(*) FROM ${formEvents} WHERE ${formEvents.formId} = ${forms.id} AND ${formEvents.eventType} = 'view')`,
    })
    .from(forms)
    .where(eq(forms.userId, session.userId));

  const forms_ = rows
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      slug: r.slug,
      status: r.status as "draft" | "published" | "archived",
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
      publishedAt: r.publishedAt ? Number(r.publishedAt) : null,
      responseCount: Number(r.responseCount),
      viewCount: Number(r.viewCount),
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const totalForms = forms_.length;
  const totalResponses = forms_.reduce((acc, f) => acc + f.responseCount, 0);
  const totalViews = forms_.reduce((acc, f) => acc + f.viewCount, 0);
  const conversionRate = totalViews
    ? Math.round((totalResponses / totalViews) * 100)
    : 0;

  return (
    <AppShell title="Dashboard">
      <DashboardClient
        initialForms={forms_}
        stats={{ totalForms, totalResponses, totalViews, conversionRate }}
      />
    </AppShell>
  );
}
