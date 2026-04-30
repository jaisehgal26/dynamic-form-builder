import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { forms } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { generateFormSlug, generateId } from "@/lib/slug";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/types/form";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = generateId("form");
  const title = "Untitled form";
  const slug = generateFormSlug(title);
  const now = new Date();

  await db.insert(forms).values({
    id,
    userId: session.userId,
    title,
    description: null,
    slug,
    status: "draft",
    settingsJson: JSON.stringify(DEFAULT_SETTINGS),
    themeJson: JSON.stringify(DEFAULT_THEME),
    schemaJson: "{}",
    createdAt: now,
    updatedAt: now,
  });

  redirect(`/dashboard/forms/${id}/builder`);
}
