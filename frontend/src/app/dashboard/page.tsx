import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { serverFetchJson } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { forms } = await serverFetchJson<{
    forms: Array<{
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
    <DashboardHome
      stats={{ totalForms, totalResponses, totalViews, conversionRate }}
      hasForms={totalForms > 0}
    />
  );
}
