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

  const formRows = await db
    .select()
    .from(forms)
    .where(eq(forms.userId, session.userId));

  // Aggregate counts in separate grouped queries — avoids unreliable
  // correlated subqueries via Drizzle's sql template tag.
  const responseCounts = await db
    .select({
      formId: formResponses.formId,
      count: sql<number>`count(*)`,
    })
    .from(formResponses)
    .groupBy(formResponses.formId);

  const viewCounts = await db
    .select({
      formId: formEvents.formId,
      count: sql<number>`count(*)`,
    })
    .from(formEvents)
    .where(eq(formEvents.eventType, "view"))
    .groupBy(formEvents.formId);

  const responseMap = new Map<string, number>(
    responseCounts.map((r) => [r.formId, Number(r.count)]),
  );
  const viewMap = new Map<string, number>(
    viewCounts.map((v) => [v.formId, Number(v.count)]),
  );

  const forms_ = formRows
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      slug: r.slug,
      status: r.status as "draft" | "published" | "archived",
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
      publishedAt: r.publishedAt ? Number(r.publishedAt) : null,
      responseCount: responseMap.get(r.id) ?? 0,
      viewCount: viewMap.get(r.id) ?? 0,
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
