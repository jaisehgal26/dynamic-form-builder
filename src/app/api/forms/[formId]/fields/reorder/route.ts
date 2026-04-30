import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formFields } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { reorderFieldsSchema } from "@/lib/validations";
import { loadFormForOwner } from "@/lib/forms.server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);
    const body = await req.json();
    const { order } = reorderFieldsSchema.parse(body);

    const now = new Date();
    for (let i = 0; i < order.length; i++) {
      await db
        .update(formFields)
        .set({ position: i, updatedAt: now })
        .where(
          and(eq(formFields.id, order[i]), eq(formFields.formId, formId)),
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
