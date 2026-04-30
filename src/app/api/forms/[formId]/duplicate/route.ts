import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { formFields, forms } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadFormFields, loadFormForOwner } from "@/lib/forms.server";
import { generateFieldId, generateFormSlug, generateId } from "@/lib/slug";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    const original = await loadFormForOwner(formId, session.userId);
    const fields = await loadFormFields(formId);

    const newId = generateId("form");
    const newTitle = `${original.title} (Copy)`;
    const slug = generateFormSlug(newTitle);
    const now = new Date();

    await db.insert(forms).values({
      id: newId,
      userId: session.userId,
      title: newTitle,
      description: original.description,
      slug,
      status: "draft",
      schemaJson: original.schemaJson,
      themeJson: original.themeJson,
      settingsJson: original.settingsJson,
      createdAt: now,
      updatedAt: now,
    });

    if (fields.length > 0) {
      await db.insert(formFields).values(
        fields.map((f) => ({
          id: generateFieldId(),
          formId: newId,
          type: f.type,
          label: f.label,
          description: f.description ?? null,
          placeholder: f.placeholder ?? null,
          required: f.required,
          position: f.position,
          step: f.step,
          configJson: JSON.stringify(f.config ?? {}),
          validationJson: JSON.stringify(f.validation ?? {}),
          logicJson: JSON.stringify(f.logic ?? []),
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    return NextResponse.json({ form: { id: newId, slug } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
