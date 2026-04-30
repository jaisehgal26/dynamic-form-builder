import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formEvents, formResponses } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { computeAnalytics } from "@/lib/analytics";
import {
  loadFormFields,
  loadFormForOwner,
} from "@/lib/forms.server";
import { safeJsonParse } from "@/lib/utils";

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
    const responses = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, formId));

    const summary = computeAnalytics({
      fields,
      events: events.map((e) => ({
        eventType: e.eventType,
        step: e.step,
        createdAt: Number(e.createdAt),
      })),
      responses: responses.map((r) => ({
        submittedAt: Number(r.submittedAt),
        completionTimeSeconds: r.completionTimeSeconds,
        answers: safeJsonParse(r.answersJson, {}),
      })),
    });

    return NextResponse.json({ analytics: summary });
  } catch (err) {
    return handleApiError(err);
  }
}
