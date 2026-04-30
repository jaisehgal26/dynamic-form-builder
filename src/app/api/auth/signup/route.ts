import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
import { handleApiError, jsonError } from "@/lib/api";
import { generateId } from "@/lib/slug";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);
    const email = data.email.toLowerCase().trim();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length) {
      return jsonError("An account with this email already exists.", 409);
    }

    const userId = generateId("user");
    const passwordHash = await hashPassword(data.password);

    await db.insert(users).values({
      id: userId,
      name: data.name.trim(),
      email,
      passwordHash,
    });

    const token = await createSessionToken({
      userId,
      email,
      name: data.name.trim(),
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: userId, email, name: data.name.trim() },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
