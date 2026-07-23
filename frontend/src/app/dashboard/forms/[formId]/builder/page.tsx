import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { BuilderShell } from "@/components/builder/builder-shell";
import { serverFetchJson } from "@/lib/server-api";
import type { FormFieldDef, FormSettings, FormTheme } from "@/types/form";

export const dynamic = "force-dynamic";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { formId } = await params;

  let data: {
    form: {
      id: string;
      title: string;
      description: string | null;
      slug: string;
      status: "draft" | "published" | "archived";
      settings: FormSettings;
      theme: FormTheme;
      fields: FormFieldDef[];
      hasPassword: boolean;
      expiresAt: number | null;
      responseLimit: number | null;
      collectEmail: boolean;
    };
  };

  try {
    data = await serverFetchJson(`/api/forms/${formId}`);
  } catch {
    notFound();
  }

  const form = data.form;

  return (
    <AppShell
      breadcrumb={[
        { href: "/dashboard", label: "Forms" },
        { label: form.title },
      ]}
    >
      <BuilderShell
        formId={form.id}
        title={form.title}
        description={form.description ?? ""}
        slug={form.slug}
        status={form.status}
        initialFields={form.fields}
        initialSettings={form.settings}
        initialTheme={form.theme}
        initialAccess={{
          hasPassword: form.hasPassword,
          expiresAt: form.expiresAt,
          responseLimit: form.responseLimit,
          collectEmail: form.collectEmail,
        }}
      />
    </AppShell>
  );
}
