import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import Link from "next/link";
import { loadPublicForm } from "@/lib/forms.server";
import { PublicFormRenderer } from "@/components/public-form/public-form-renderer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const form = await loadPublicForm(slug);
  if (!form) return { title: "Form not found" };
  return {
    title: form.title,
    description: form.description ?? undefined,
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await loadPublicForm(slug);
  if (!form) notFound();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: form.theme.backgroundColor || "#f8fafc" }}
    >
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-3.5 w-3.5" />
            </div>
            <span>FormForge</span>
          </Link>
        </div>
        <PublicFormRenderer form={form} />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="underline-offset-4 hover:underline">
            FormForge
          </Link>
        </p>
      </div>
    </div>
  );
}
