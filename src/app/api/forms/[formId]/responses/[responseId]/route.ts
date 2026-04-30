import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formResponses } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadFormForOwner } from "@/lib/forms.server";
import { safeJsonParse } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ formId: string; responseId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId, responseId } = await params;
    await loadFormForOwner(formId, session.userId);

    const rows = await db
      .select()
      .from(formResponses)
      .where(
        and(eq(formResponses.id, responseId), eq(formResponses.formId, formId)),
      )
      .limit(1);
    const r = rows[0];
    if (!r) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }
    return NextResponse.json({
      response: {
        id: r.id,
        formId: r.formId,
        answers: safeJsonParse<Record<string, unknown>>(r.answersJson, {}),
        metadata: safeJsonParse<Record<string, unknown>>(r.metadataJson, {}),
        startedAt: r.startedAt ? Number(r.startedAt) : null,
        submittedAt: Number(r.submittedAt),
        completionTimeSeconds: r.completionTimeSeconds,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ formId: string; responseId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId, responseId } = await params;
    await loadFormForOwner(formId, session.userId);

    await db
      .delete(formResponses)
      .where(
        and(eq(formResponses.id, responseId), eq(formResponses.formId, formId)),
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
