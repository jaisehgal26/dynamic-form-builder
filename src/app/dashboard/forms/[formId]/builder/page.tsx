import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import {
  loadFormFields,
  loadFormForOwner,
  readFormSettings,
  readFormTheme,
} from "@/lib/forms.server";
import { BuilderShell } from "@/components/builder/builder-shell";

export const dynamic = "force-dynamic";

export default async function BuilderPage({
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
  const settings = readFormSettings(form);
  const theme = readFormTheme(form);

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
        status={form.status as "draft" | "published" | "archived"}
        initialFields={fields}
        initialSettings={settings}
        initialTheme={theme}
        initialAccess={{
          hasPassword: !!form.passwordHash,
          expiresAt: form.expiresAt ? Number(form.expiresAt) : null,
          responseLimit: form.responseLimit ?? null,
          collectEmail: !!form.collectEmail,
        }}
      />
    </AppShell>
  );
}
