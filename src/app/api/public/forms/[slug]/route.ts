import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleApiError } from "@/lib/api";
import { resolvePublicForm, loadFormFields } from "@/lib/forms.server";
import {
  cookieNameForSlug,
  verifyAccessToken,
} from "@/lib/public-tokens";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const r = await resolvePublicForm(slug);
    if (r.state === "not_found") {
      return NextResponse.json(
        { state: "not_found", error: "Form not found or not published" },
        { status: 404 },
      );
    }
    if (r.state === "expired" || r.state === "limit_reached") {
      return NextResponse.json({
        state: r.state,
        closedMessage: r.closedMessage,
      });
    }
    if (r.state === "password_required") {
      const cookieStore = await cookies();
      const token = cookieStore.get(cookieNameForSlug(slug))?.value;
      const allowed = await verifyAccessToken(token, slug);
      if (!allowed) {
        return NextResponse.json({
          state: "password_required",
          form: r.form,
        });
      }
      // unlocked: load fields fully
      if (r.form) {
        const fields = await loadFormFields(r.form.id);
        return NextResponse.json({
          state: "ok",
          form: { ...r.form, fields },
        });
      }
    }
    return NextResponse.json({ state: "ok", form: r.form });
  } catch (err) {
    return handleApiError(err);
  }
}
