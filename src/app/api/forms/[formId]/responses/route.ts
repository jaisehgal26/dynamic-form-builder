import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { formResponses } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadFormForOwner } from "@/lib/forms.server";
import { safeJsonParse } from "@/lib/utils";

const PAGE_SIZE = 50;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    await loadFormForOwner(formId, session.userId);

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const fromMs = fromParam ? Number(fromParam) : null;
    const toMs = toParam ? Number(toParam) : null;

    const whereConds = [eq(formResponses.formId, formId)] as Array<ReturnType<
      typeof eq
    >>;
    if (fromMs && !Number.isNaN(fromMs)) {
      whereConds.push(gte(formResponses.submittedAt, new Date(fromMs)));
    }
    if (toMs && !Number.isNaN(toMs)) {
      whereConds.push(lt(formResponses.submittedAt, new Date(toMs)));
    }
    const where = whereConds.length === 1 ? whereConds[0] : and(...whereConds);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(formResponses)
      .where(where);
    const total = Number(totalRows[0]?.count ?? 0);

    const offset = (page - 1) * PAGE_SIZE;
    const rows = await db
      .select()
      .from(formResponses)
      .where(where)
      .orderBy(desc(formResponses.submittedAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return NextResponse.json({
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: offset + rows.length < total,
      responses: rows.map((r) => ({
        id: r.id,
        formId: r.formId,
        respondentEmail: r.respondentEmail,
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
