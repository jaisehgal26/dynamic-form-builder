import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formResponses } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadFormForOwner } from "@/lib/forms.server";
import { safeJsonParse } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);

    const rows = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, formId))
      .orderBy(desc(formResponses.submittedAt))
      .limit(500);

    return NextResponse.json({
      responses: rows.map((r) => ({
        id: r.id,
        formId: r.formId,
        respondentId: r.respondentId,
        answers: safeJsonParse<Record<string, unknown>>(r.answersJson, {}),
        metadata: safeJsonParse<Record<string, unknown>>(r.metadataJson, {}),
        startedAt: r.startedAt ? Number(r.startedAt) : null,
        submittedAt: Number(r.submittedAt),
        completionTimeSeconds: r.completionTimeSeconds,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
