import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export function jsonError(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { error: message, ...(extra ? { details: extra } : {}) },
    { status },
  );
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return jsonError("Validation failed", 422, err.flatten());
  }
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }
  if (err instanceof ApiError) {
    return jsonError(err.message, err.status);
  }
  console.error("[api] unexpected error", err);
  return jsonError("Internal server error", 500);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function parseDeviceFromUA(ua: string | null): {
  device: "mobile" | "tablet" | "desktop" | "unknown";
  browser: string;
} {
  if (!ua) return { device: "unknown", browser: "unknown" };
  const lower = ua.toLowerCase();
  let device: "mobile" | "tablet" | "desktop" | "unknown" = "desktop";
  if (/mobile|iphone|android(?!.*tablet)/i.test(lower)) device = "mobile";
  else if (/ipad|tablet/i.test(lower)) device = "tablet";

  let browser = "unknown";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome/") && !lower.includes("edg/")) browser = "Chrome";
  else if (lower.includes("safari/") && !lower.includes("chrome/")) browser = "Safari";
  else if (lower.includes("firefox/")) browser = "Firefox";

  return { device, browser };
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}
