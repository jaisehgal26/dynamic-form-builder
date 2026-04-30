import "server-only";
import { SignJWT, jwtVerify } from "jose";

/**
 * Short-lived signed cookies used to gate password-protected public forms.
 * Cookie name is per-slug so multiple gated forms can be unlocked
 * independently in the same browser. 6-hour TTL.
 */

export const FORM_ACCESS_COOKIE_PREFIX = "ff_pf_";
const TTL_HOURS = 6;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is not set or too short.");
  }
  return new TextEncoder().encode(s);
}

export function cookieNameForSlug(slug: string): string {
  return FORM_ACCESS_COOKIE_PREFIX + slug.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function issueAccessToken(slug: string): Promise<string> {
  return new SignJWT({ slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_HOURS}h`)
    .sign(secret());
}

export async function verifyAccessToken(
  token: string | undefined,
  slug: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.slug === slug;
  } catch {
    return false;
  }
}

export const ACCESS_COOKIE_TTL_SECONDS = TTL_HOURS * 60 * 60;
