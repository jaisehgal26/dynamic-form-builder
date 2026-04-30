import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formEvents } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { computeInteractionInsights } from "@/lib/analytics";
import { loadFormFields, loadFormForOwner } from "@/lib/forms.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);
    const fields = await loadFormFields(formId);
    const events = await db
      .select()
      .from(formEvents)
      .where(eq(formEvents.formId, formId));

    const insights = computeInteractionInsights({
      fields,
      events: events.map((e) => ({
        eventType: e.eventType,
        step: e.step,
        fieldId: e.fieldId,
        sessionId: e.sessionId,
        createdAt: Number(e.createdAt),
      })),
    });
    return NextResponse.json({ insights });
  } catch (err) {
    return handleApiError(err);
  }
}
