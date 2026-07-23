import { cookies } from "next/headers";

function apiBase(): string {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:8000";
}

export async function serverFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieStore = await cookies();
  const session = cookieStore.get("ff_session")?.value;
  const headers = new Headers(init?.headers);
  if (session) {
    headers.set("Cookie", `ff_session=${session}`);
  }
  const url = path.startsWith("http") ? path : `${apiBase()}${path}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function serverFetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await serverFetch(path, init);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}
