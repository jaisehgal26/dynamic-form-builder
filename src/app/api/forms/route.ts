import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { formEvents, formResponses, forms } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createFormSchema } from "@/lib/validations";
import { generateFormSlug, generateId } from "@/lib/slug";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/types/form";

export async function GET() {
  try {
    const session = await requireSession();

    const formRows = await db
      .select()
      .from(forms)
      .where(eq(forms.userId, session.userId));

    const responseCounts = await db
      .select({
        formId: formResponses.formId,
        count: sql<number>`count(*)`,
      })
      .from(formResponses)
      .groupBy(formResponses.formId);

    const viewCounts = await db
      .select({
        formId: formEvents.formId,
        count: sql<number>`count(*)`,
      })
      .from(formEvents)
      .where(eq(formEvents.eventType, "view"))
      .groupBy(formEvents.formId);

    const responseMap = new Map<string, number>(
      responseCounts.map((r) => [r.formId, Number(r.count)]),
    );
    const viewMap = new Map<string, number>(
      viewCounts.map((v) => [v.formId, Number(v.count)]),
    );

    const out = formRows
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        slug: r.slug,
        status: r.status,
        createdAt: Number(r.createdAt),
        updatedAt: Number(r.updatedAt),
        publishedAt: r.publishedAt ? Number(r.publishedAt) : null,
        responseCount: responseMap.get(r.id) ?? 0,
        viewCount: viewMap.get(r.id) ?? 0,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return NextResponse.json({ forms: out });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const data = createFormSchema.parse(body);

    const id = generateId("form");
    const slug = generateFormSlug(data.title);
    const now = new Date();

    await db.insert(forms).values({
      id,
      userId: session.userId,
      title: data.title,
      description: data.description ?? null,
      slug,
      status: "draft",
      settingsJson: JSON.stringify(DEFAULT_SETTINGS),
      themeJson: JSON.stringify(DEFAULT_THEME),
      schemaJson: JSON.stringify({}),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ form: { id, slug } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export const dynamic = "force-dynamic";
