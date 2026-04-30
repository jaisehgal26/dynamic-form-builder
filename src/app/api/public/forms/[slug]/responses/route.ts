import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { formEvents, formResponses } from "@/db/schema";
import { handleApiError, parseDeviceFromUA, rateLimit } from "@/lib/api";
import { submitResponseSchema } from "@/lib/validations";
import {
  loadFormBySlug,
  loadFormFields,
  readFormSettings,
} from "@/lib/forms.server";
import { generateId } from "@/lib/slug";
import { isFieldVisible } from "@/lib/form-helpers";

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
    if (!rateLimit(`submit:${ip}:${slug}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const data = submitResponseSchema.parse(body);

    const form = await loadFormBySlug(slug);
    if (!form || form.status !== "published") {
      return NextResponse.json(
        { error: "Form is not accepting responses." },
        { status: 404 },
      );
    }

    const fields = await loadFormFields(form.id);
    const settings = readFormSettings(form);

    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === "section_heading" || field.type === "page_break") continue;
      const visible = isFieldVisible(field, data.answers);
      if (!visible) continue;
      const value = data.answers[field.id];
      const isEmpty =
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (field.required && isEmpty) {
        errors[field.id] = "This field is required.";
      }
      if (
        field.type === "email" &&
        typeof value === "string" &&
        value.length &&
        !/^\S+@\S+\.\S+$/.test(value)
      ) {
        errors[field.id] = "Enter a valid email.";
      }
    }
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Validation failed", fields: errors },
        { status: 422 },
      );
    }

    if (!settings.allowMultipleSubmissions) {
      // Best-effort dedup placeholder; in production tie to a respondent cookie.
    }

    const ua = req.headers.get("user-agent");
    const { device, browser } = parseDeviceFromUA(ua);
    const referrer = req.headers.get("referer") ?? "";
    const startedAt =
      typeof data.startedAt === "number" && data.startedAt > 0
        ? new Date(data.startedAt)
        : null;
    const submittedAt = new Date();
    const completionTimeSeconds = startedAt
      ? Math.max(
          0,
          Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000),
        )
      : null;

    const responseId = generateId("resp");

    await db.insert(formResponses).values({
      id: responseId,
      formId: form.id,
      respondentId: null,
      answersJson: JSON.stringify(data.answers),
      metadataJson: JSON.stringify({
        ...(data.metadata ?? {}),
        device,
        browser,
        referrer,
        ip,
      }),
      startedAt: startedAt ?? undefined,
      submittedAt,
      completionTimeSeconds: completionTimeSeconds ?? undefined,
    });

    await db.insert(formEvents).values({
      id: generateId("evt"),
      formId: form.id,
      eventType: "submit",
      step: null,
      metadataJson: JSON.stringify({ device, browser, referrer, ip }),
    });

    return NextResponse.json({ ok: true, responseId });
  } catch (err) {
    return handleApiError(err);
  }
}
