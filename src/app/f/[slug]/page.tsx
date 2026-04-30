import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import Link from "next/link";
import { resolvePublicForm, loadFormFields } from "@/lib/forms.server";
import { PublicFormRenderer } from "@/components/public-form/public-form-renderer";
import { PasswordGate } from "@/components/public-form/password-gate";
import { ClosedScreen } from "@/components/public-form/closed-screen";
import {
  cookieNameForSlug,
  verifyAccessToken,
} from "@/lib/public-tokens";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolvePublicForm(slug);
  if (r.state === "not_found" || !r.form) return { title: "Form not found" };
  return {
    title: r.form.title,
    description: r.form.description ?? undefined,
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = await resolvePublicForm(slug);

  if (r.state === "not_found") notFound();

  const themeBg = r.form?.theme.backgroundColor;

  return (
    <div
      className="light-scope min-h-screen bg-background text-foreground"
      style={{ backgroundColor: themeBg || "hsl(var(--muted) / 0.4)" }}
    >
      <div className="mx-auto w-full max-w-[640px] px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
              <Boxes className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium tracking-tightish">FormForge</span>
          </Link>
        </div>

        {r.state === "expired" || r.state === "limit_reached" ? (
          <ClosedScreen
            variant={r.state}
            message={r.closedMessage}
          />
        ) : r.state === "password_required" ? (
          <PasswordGateOrForm slug={slug} payload={r.form!} />
        ) : (
          r.form && <PublicFormRenderer form={r.form} />
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link
            href="/"
            className="font-medium text-foreground/80 underline-offset-4 hover:underline"
          >
            FormForge
          </Link>
        </p>
      </div>
    </div>
  );
}

async function PasswordGateOrForm({
  slug,
  payload,
}: {
  slug: string;
  payload: import("@/types/form").PublicFormPayload;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieNameForSlug(slug))?.value;
  const allowed = await verifyAccessToken(token, slug);
  if (!allowed) {
    return (
      <PasswordGate
        slug={slug}
        title={payload.title}
        description={payload.description}
        primaryColor={payload.theme.primaryColor}
      />
    );
  }
  // Cookie present — load real fields and render.
  const fields = await loadFormFields(payload.id);
  return (
    <PublicFormRenderer form={{ ...payload, fields }} />
  );
}
