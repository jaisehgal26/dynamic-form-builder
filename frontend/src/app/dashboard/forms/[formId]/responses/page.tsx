import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { ResponsesClient } from "@/components/dashboard/responses-client";
import { serverFetchJson } from "@/lib/server-api";
import type { FormFieldDef } from "@/types/form";

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

  try {
    const { form } = await serverFetchJson<{
      form: {
        title: string;
        fields: FormFieldDef[];
        collectEmail: boolean;
      };
    }>(`/api/forms/${formId}`);

    const { responses, total } = await serverFetchJson<{
      responses: Array<{
        id: string;
        respondentEmail: string | null;
        answers: Record<string, unknown>;
        metadata: Record<string, unknown>;
        startedAt: number | null;
        submittedAt: number;
        completionTimeSeconds: number | null;
      }>;
      total: number;
    }>(`/api/forms/${formId}/responses?page=1`);

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
          fields={form.fields}
          collectEmail={form.collectEmail}
          initialResponses={responses}
          initialTotal={total}
          pageSize={PAGE_SIZE}
        />
      </AppShell>
    );
  } catch {
    notFound();
  }
}
