import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { formEvents } from "@/db/schema";
import { handleApiError, parseDeviceFromUA, rateLimit } from "@/lib/api";
import { formEventSchema } from "@/lib/validations";
import { loadFormBySlug } from "@/lib/forms.server";
import { generateId } from "@/lib/slug";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";
    if (!rateLimit(`event:${ip}:${slug}`, 240, 60_000)) {
      return NextResponse.json({ ok: true });
    }
    const body = await req.json().catch(() => ({}));
    const data = formEventSchema.parse(body);

    const form = await loadFormBySlug(slug);
    if (!form || form.status !== "published") {
      return NextResponse.json({ ok: true });
    }

    const ua = req.headers.get("user-agent");
    const { device, browser } = parseDeviceFromUA(ua);
    const referrer = req.headers.get("referer") ?? "";

    await db.insert(formEvents).values({
      id: generateId("evt"),
      formId: form.id,
      eventType: data.eventType,
      step: data.step ?? null,
      fieldId: data.fieldId ?? null,
      sessionId: data.sessionId ?? null,
      metadataJson: JSON.stringify({
        ...(data.metadata ?? {}),
        device,
        browser,
        referrer,
        ip,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
