import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formResponses } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import {
  loadFormFields,
  loadFormForOwner,
} from "@/lib/forms.server";
import { responsesToCsv } from "@/lib/csv";
import { safeJsonParse } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    const form = await loadFormForOwner(formId, session.userId);
    const fields = await loadFormFields(formId);
    const rows = await db
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, formId))
      .orderBy(desc(formResponses.submittedAt));

    const csv = responsesToCsv(
      fields,
      rows.map((r) => ({
        id: r.id,
        submittedAt: Number(r.submittedAt),
        startedAt: r.startedAt ? Number(r.startedAt) : null,
        completionTimeSeconds: r.completionTimeSeconds,
        answers: safeJsonParse(r.answersJson, {}),
      })),
    );

    const safeTitle = (form.title || "form")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "form";
    const filename = `${safeTitle}_responses.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
