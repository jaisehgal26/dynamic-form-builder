import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formFields, forms } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { fullFormSchema } from "@/lib/validations";
import { loadFormForOwner } from "@/lib/forms.server";
import { generateFieldId } from "@/lib/slug";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);
    const body = await req.json();
    const data = fullFormSchema.parse(body);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(forms)
        .set({
          title: data.title,
          description: data.description ?? null,
          themeJson: JSON.stringify(data.theme),
          settingsJson: JSON.stringify(data.settings),
          schemaJson: JSON.stringify({
            title: data.title,
            description: data.description ?? "",
          }),
          updatedAt: now,
        })
        .where(and(eq(forms.id, formId), eq(forms.userId, session.userId)));

      await tx.delete(formFields).where(eq(formFields.formId, formId));

      if (data.fields.length > 0) {
        const sorted = [...data.fields].sort((a, b) => a.position - b.position);
        await tx.insert(formFields).values(
          sorted.map((f, idx) => ({
            id: f.id || generateFieldId(),
            formId,
            type: f.type,
            label: f.label,
            description: f.description ?? null,
            placeholder: f.placeholder ?? null,
            required: !!f.required,
            position: idx,
            step: f.step ?? 1,
            configJson: JSON.stringify(f.config ?? {}),
            validationJson: JSON.stringify(f.validation ?? {}),
            logicJson: JSON.stringify(f.logic ?? []),
            createdAt: now,
            updatedAt: now,
          })),
        );
      }
    });

    return NextResponse.json({ ok: true, savedAt: now.getTime() });
  } catch (err) {
    return handleApiError(err);
  }
}
