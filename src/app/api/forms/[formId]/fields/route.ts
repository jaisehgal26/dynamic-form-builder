import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { formFields } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createFieldSchema } from "@/lib/validations";
import { loadFormForOwner } from "@/lib/forms.server";
import { generateFieldId } from "@/lib/slug";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);
    const body = await req.json();
    const data = createFieldSchema.parse(body);

    const id = data.id || generateFieldId();
    const positionRows = await db
      .select({ max: sql<number>`COALESCE(MAX(${formFields.position}), -1)` })
      .from(formFields)
      .where(eq(formFields.formId, formId));
    const position = data.position ?? Number(positionRows[0]?.max ?? -1) + 1;
    const now = new Date();

    await db.insert(formFields).values({
      id,
      formId,
      type: data.type,
      label: data.label,
      description: data.description ?? null,
      placeholder: data.placeholder ?? null,
      required: !!data.required,
      position,
      step: data.step ?? 1,
      configJson: JSON.stringify(data.config ?? {}),
      validationJson: JSON.stringify(data.validation ?? {}),
      logicJson: JSON.stringify(data.logic ?? []),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, position }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
