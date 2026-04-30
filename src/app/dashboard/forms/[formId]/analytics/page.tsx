import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formEvents, formResponses } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import {
  loadFormFields,
  loadFormForOwner,
} from "@/lib/forms.server";
import { safeJsonParse } from "@/lib/utils";
import { computeAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { formId } = await params;

  let form;
  try {
    form = await loadFormForOwner(formId, session.userId);
  } catch {
    notFound();
  }

  const fields = await loadFormFields(formId);
  const events = await db
    .select()
    .from(formEvents)
    .where(eq(formEvents.formId, formId));
  const responses = await db
    .select()
    .from(formResponses)
    .where(eq(formResponses.formId, formId));

  const analytics = computeAnalytics({
    fields,
    events: events.map((e) => ({
      eventType: e.eventType,
      step: e.step,
      createdAt: Number(e.createdAt),
    })),
    responses: responses.map((r) => ({
      submittedAt: Number(r.submittedAt),
      completionTimeSeconds: r.completionTimeSeconds,
      answers: safeJsonParse(r.answersJson, {}),
    })),
  });

  return (
    <AppShell
      breadcrumb={[
        { href: "/dashboard", label: "Forms" },
        { href: `/dashboard/forms/${formId}/builder`, label: form.title },
        { label: "Analytics" },
      ]}
    >
      <AnalyticsDashboard
        formId={formId}
        formTitle={form.title}
        analytics={analytics}
      />
    </AppShell>
  );
}
