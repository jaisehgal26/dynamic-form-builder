import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { serverFetchJson } from "@/lib/server-api";
import type { AnalyticsSummary } from "@/types/response";
import type { FunnelSummary, InteractionInsights } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { formId } = await params;

  try {
    const { form } = await serverFetchJson<{ form: { title: string } }>(
      `/api/forms/${formId}`,
    );

    const [analytics, funnel, insights] = await Promise.all([
      serverFetchJson<AnalyticsSummary>(`/api/forms/${formId}/analytics?range=30d`),
      serverFetchJson<FunnelSummary>(`/api/forms/${formId}/analytics/funnel?range=30d`),
      serverFetchJson<InteractionInsights>(
        `/api/forms/${formId}/analytics/interactions?range=30d`,
      ),
    ]);

    return (
      <AnalyticsDashboard
        formId={formId}
        formTitle={form.title}
        initialAnalytics={analytics}
        initialFunnel={funnel}
        initialInsights={insights}
      />
    );
  } catch {
    notFound();
  }
}
