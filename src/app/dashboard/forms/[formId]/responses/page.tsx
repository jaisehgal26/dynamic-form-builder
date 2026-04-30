import { notFound, redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { formResponses } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { ResponsesClient } from "@/components/dashboard/responses-client";
import {
  loadFormFields,
  loadFormForOwner,
} from "@/lib/forms.server";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function ResponsesPage({
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

  const totalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(formResponses)
    .where(eq(formResponses.formId, formId));
  const total = Number(totalRows[0]?.count ?? 0);

  const rows = await db
    .select()
    .from(formResponses)
    .where(eq(formResponses.formId, formId))
    .orderBy(desc(formResponses.submittedAt))
    .limit(PAGE_SIZE);

  const responses = rows.map((r) => ({
    id: r.id,
    respondentEmail: r.respondentEmail,
    answers: safeJsonParse<Record<string, unknown>>(r.answersJson, {}),
    metadata: safeJsonParse<Record<string, unknown>>(r.metadataJson, {}),
    startedAt: r.startedAt ? Number(r.startedAt) : null,
    submittedAt: Number(r.submittedAt),
    completionTimeSeconds: r.completionTimeSeconds,
  }));

  return (
    <AppShell
      breadcrumb={[
        { href: "/dashboard", label: "Forms" },
        { href: `/dashboard/forms/${formId}/builder`, label: form.title },
        { label: "Responses" },
      ]}
    >
      <ResponsesClient
        formId={formId}
        formTitle={form.title}
        fields={fields}
        collectEmail={!!form.collectEmail}
        initialResponses={responses}
        initialTotal={total}
        pageSize={PAGE_SIZE}
      />
    </AppShell>
  );
}
