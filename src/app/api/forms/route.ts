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
    const rows = await db
      .select({
        id: forms.id,
        title: forms.title,
        description: forms.description,
        slug: forms.slug,
        status: forms.status,
        createdAt: forms.createdAt,
        updatedAt: forms.updatedAt,
        publishedAt: forms.publishedAt,
        responseCount: sql<number>`(SELECT COUNT(*) FROM ${formResponses} WHERE ${formResponses.formId} = ${forms.id})`,
        viewCount: sql<number>`(SELECT COUNT(*) FROM ${formEvents} WHERE ${formEvents.formId} = ${forms.id} AND ${formEvents.eventType} = 'view')`,
      })
      .from(forms)
      .where(eq(forms.userId, session.userId))
      .orderBy(forms.updatedAt);

    return NextResponse.json({
      forms: rows
        .map((r) => ({
          ...r,
          createdAt: Number(r.createdAt),
          updatedAt: Number(r.updatedAt),
          publishedAt: r.publishedAt ? Number(r.publishedAt) : null,
          responseCount: Number(r.responseCount),
          viewCount: Number(r.viewCount),
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    });
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
