import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { handleApiError, jsonError, rateLimit } from "@/lib/api";
import { verifyPasswordSchema } from "@/lib/validations";
import { loadFormBySlug } from "@/lib/forms.server";
import {
  ACCESS_COOKIE_TTL_SECONDS,
  cookieNameForSlug,
  issueAccessToken,
} from "@/lib/public-tokens";

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
    if (!rateLimit(`pwd:${ip}:${slug}`, 8, 60_000)) {
      return jsonError("Too many attempts. Try again in a minute.", 429);
    }

    const body = await req.json();
    const { password } = verifyPasswordSchema.parse(body);

    const form = await loadFormBySlug(slug);
    if (!form || form.status !== "published") {
      return jsonError("Form not found.", 404);
    }
    if (!form.passwordHash) {
      return NextResponse.json({ ok: true });
    }

    const ok = await bcrypt.compare(password, form.passwordHash);
    if (!ok) return jsonError("Incorrect password.", 401);

    const token = await issueAccessToken(slug);
    const cookieStore = await cookies();
    cookieStore.set(cookieNameForSlug(slug), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACCESS_COOKIE_TTL_SECONDS,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
