import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);
    const email = data.email.toLowerCase().trim();

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];
    if (!user) return jsonError("Invalid email or password.", 401);

    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) return jsonError("Invalid email or password.", 401);

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
