import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { forms } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadFormForOwner } from "@/lib/forms.server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);

    await db
      .update(forms)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(forms.id, formId), eq(forms.userId, session.userId)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
