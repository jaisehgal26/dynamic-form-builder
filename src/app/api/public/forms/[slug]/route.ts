import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { loadPublicForm } from "@/lib/forms.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const form = await loadPublicForm(slug);
    if (!form) {
      return NextResponse.json(
        { error: "Form not found or not published" },
        { status: 404 },
      );
    }
    return NextResponse.json({ form });
  } catch (err) {
    return handleApiError(err);
  }
}
