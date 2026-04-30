import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { forms } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { updateFormSchema } from "@/lib/validations";
import {
  loadFormFields,
  loadFormForOwner,
  readFormSettings,
  readFormTheme,
} from "@/lib/forms.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    const form = await loadFormForOwner(formId, session.userId);
    const fields = await loadFormFields(formId);
    return NextResponse.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        status: form.status,
        createdAt: Number(form.createdAt),
        updatedAt: Number(form.updatedAt),
        publishedAt: form.publishedAt ? Number(form.publishedAt) : null,
        settings: readFormSettings(form),
        theme: readFormTheme(form),
        fields,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);
    const body = await req.json();
    const data = updateFormSchema.parse(body);

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.status !== undefined) {
      update.status = data.status;
      if (data.status === "published") update.publishedAt = new Date();
    }

    await db
      .update(forms)
      .set(update)
      .where(and(eq(forms.id, formId), eq(forms.userId, session.userId)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);
    await db
      .delete(forms)
      .where(and(eq(forms.id, formId), eq(forms.userId, session.userId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
