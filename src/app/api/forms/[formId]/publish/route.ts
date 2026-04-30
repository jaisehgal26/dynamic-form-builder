import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { forms } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadFormFields, loadFormForOwner } from "@/lib/forms.server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    const form = await loadFormForOwner(formId, session.userId);
    const fields = await loadFormFields(formId);
    const inputFields = fields.filter(
      (f) => f.type !== "section_heading" && f.type !== "page_break",
    );
    if (inputFields.length === 0) {
      return NextResponse.json(
        { error: "Add at least one question before publishing." },
        { status: 400 },
      );
    }

    await db
      .update(forms)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(forms.id, formId), eq(forms.userId, session.userId)));

    return NextResponse.json({ ok: true, slug: form.slug });
  } catch (err) {
    return handleApiError(err);
  }
}
