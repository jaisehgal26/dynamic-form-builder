import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicFormRenderer } from "@/components/public-form/public-form-renderer";
import { PasswordGate } from "@/components/public-form/password-gate";
import { ClosedScreen } from "@/components/public-form/closed-screen";
import { LogoMark } from "@/components/brand/logo";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { publicFormJsonLd } from "@/lib/seo";
import {
  cookieNameForSlug,
  verifyAccessToken,
} from "@/lib/public-tokens";
import { serverFetchJson } from "@/lib/server-api";
import type { PublicFormPayload } from "@/types/form";

export const dynamic = "force-dynamic";

type PublicResolution = {
  state: string;
  form?: PublicFormPayload;
  closedMessage?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const r = await serverFetchJson<PublicResolution>(`/api/public/forms/${slug}`);
    if (r.state === "not_found" || !r.form) {
      return {
        title: "Form not found",
        robots: { index: false, follow: false },
      };
    }

    const title = r.form.title;
    const description =
      r.form.description ??
      `Fill out ${r.form.title} — powered by FormForge.`;
    const indexable = r.state === "ok";

    return {
      title,
      description,
      alternates: { canonical: absoluteUrl(`/f/${slug}`) },
      robots: indexable
        ? { index: true, follow: true }
        : { index: false, follow: false },
      openGraph: {
        title,
        description,
        url: absoluteUrl(`/f/${slug}`),
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Form not found",
      robots: { index: false, follow: false },
    };
  }
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let r: PublicResolution;
  try {
    r = await serverFetchJson<PublicResolution>(`/api/public/forms/${slug}`);
  } catch {
    notFound();
  }

  if (r.state === "not_found") notFound();

  const themeBg = r.form?.theme.backgroundColor;

  return (
    <div
      className="light-scope min-h-screen bg-background text-foreground"
      style={{ backgroundColor: themeBg || "hsl(var(--muted) / 0.4)" }}
    >
      {r.form && r.state === "ok" && (
        <JsonLd data={publicFormJsonLd(r.form)} />
      )}
      <div className="mx-auto w-full max-w-[640px] px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="group text-xs text-muted-foreground transition-colors hover:text-foreground">
            <LogoMark size="sm" textClassName="text-xs font-medium" />
          </Link>
        </div>

        {r.state === "expired" || r.state === "limit_reached" ? (
          <ClosedScreen variant={r.state as "expired" | "limit_reached"} message={r.closedMessage} />
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
  payload: PublicFormPayload;
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
  const unlocked = await serverFetchJson<PublicResolution>(
    `/api/public/forms/${slug}`,
  );
  const form = unlocked.form ?? { ...payload, fields: [] };
  if (unlocked.state === "ok" && unlocked.form) {
    return <PublicFormRenderer form={unlocked.form} />;
  }
  return <PublicFormRenderer form={form} />;
}
