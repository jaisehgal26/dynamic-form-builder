import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
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

export type AnalyticsRange = "all" | "7d" | "30d" | "today";

function rangeToFromMs(range: AnalyticsRange): number | null {
  if (range === "all") return null;
  if (range === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  const days = range === "7d" ? 7 : 30;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);
    const fields = await loadFormFields(formId);

    const url = new URL(req.url);
    const range = (url.searchParams.get("range") ?? "all") as AnalyticsRange;
    const fromMs = rangeToFromMs(range);

    const eventWhere = fromMs
      ? and(
          eq(formEvents.formId, formId),
          gte(formEvents.createdAt, new Date(fromMs)),
        )
      : eq(formEvents.formId, formId);
    const responseWhere = fromMs
      ? and(
          eq(formResponses.formId, formId),
          gte(formResponses.submittedAt, new Date(fromMs)),
        )
      : eq(formResponses.formId, formId);

    const events = await db.select().from(formEvents).where(eventWhere);
    const responses = await db
      .select()
      .from(formResponses)
      .where(responseWhere);

    const summary = computeAnalytics({
      fields,
      events: events.map((e) => ({
        eventType: e.eventType,
        step: e.step,
        fieldId: e.fieldId,
        sessionId: e.sessionId,
        createdAt: Number(e.createdAt),
      })),
      responses: responses.map((r) => ({
        submittedAt: Number(r.submittedAt),
        completionTimeSeconds: r.completionTimeSeconds,
        answers: safeJsonParse(r.answersJson, {}),
      })),
      rangeDays: range === "30d" ? 30 : range === "7d" ? 7 : 14,
    });

    return NextResponse.json({ analytics: summary, range });
  } catch (err) {
    return handleApiError(err);
  }
}
