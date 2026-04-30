import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import {
  loadFormFields,
  loadFormForOwner,
  readFormSettings,
  readFormTheme,
} from "@/lib/forms.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const session = await requireSession();
    const { formId } = await params;
    const form = await loadFormForOwner(formId, session.userId);
    const fields = await loadFormFields(formId);

    const schema = {
      title: form.title,
      description: form.description ?? "",
      settings: readFormSettings(form),
      theme: readFormTheme(form),
      fields,
    };

    const safeTitle = (form.title || "form")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "form";

    return new Response(JSON.stringify(schema, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}.schema.json"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
