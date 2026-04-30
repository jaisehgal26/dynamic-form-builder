import { notFound, redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
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
import {
  computeAnalytics,
  computeFunnel,
  computeInteractionInsights,
} from "@/lib/analytics";

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

  const eventInputs = events.map((e) => ({
    eventType: e.eventType,
    step: e.step,
    fieldId: e.fieldId,
    sessionId: e.sessionId,
    createdAt: Number(e.createdAt),
  }));

  const analytics = computeAnalytics({
    fields,
    events: eventInputs,
    responses: responses.map((r) => ({
      submittedAt: Number(r.submittedAt),
      completionTimeSeconds: r.completionTimeSeconds,
      answers: safeJsonParse(r.answersJson, {}),
    })),
  });

  const funnel = computeFunnel({
    fields,
    events: eventInputs,
    totalSubmissions: responses.length,
  });
  const insights = computeInteractionInsights({
    fields,
    events: eventInputs,
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
        initialAnalytics={analytics}
        initialFunnel={funnel}
        initialInsights={insights}
      />
    </AppShell>
  );
}
