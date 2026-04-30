import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formFields } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { updateFieldSchema } from "@/lib/validations";
import { loadFormForOwner } from "@/lib/forms.server";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ formId: string; fieldId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId, fieldId } = await params;
    await loadFormForOwner(formId, session.userId);
    const body = await req.json();
    const data = updateFieldSchema.parse(body);

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (data.type !== undefined) update.type = data.type;
    if (data.label !== undefined) update.label = data.label;
    if (data.description !== undefined) update.description = data.description ?? null;
    if (data.placeholder !== undefined) update.placeholder = data.placeholder ?? null;
    if (data.required !== undefined) update.required = !!data.required;
    if (data.position !== undefined) update.position = data.position;
    if (data.step !== undefined) update.step = data.step;
    if (data.config !== undefined) update.configJson = JSON.stringify(data.config);
    if (data.validation !== undefined) update.validationJson = JSON.stringify(data.validation);
    if (data.logic !== undefined) update.logicJson = JSON.stringify(data.logic);

    await db
      .update(formFields)
      .set(update)
      .where(
        and(eq(formFields.id, fieldId), eq(formFields.formId, formId)),
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ formId: string; fieldId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId, fieldId } = await params;
    await loadFormForOwner(formId, session.userId);
    await db
      .delete(formFields)
      .where(
        and(eq(formFields.id, fieldId), eq(formFields.formId, formId)),
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
