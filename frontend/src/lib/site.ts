export const siteConfig = {
  name: "FormForge",
  tagline: "Build beautiful forms in minutes",
  description:
    "FormForge is the modern form builder for SaaS teams. Drag and drop questions, add conditional logic, publish branded forms, and analyze responses with real-time analytics — all in one place.",
  keywords: [
    "form builder",
    "online forms",
    "dynamic forms",
    "conditional logic forms",
    "form analytics",
    "drag and drop form builder",
    "Typeform alternative",
    "survey builder",
    "lead capture forms",
    "multi-step forms",
    "form SaaS",
    "no-code forms",
  ],
  creator: "FormForge",
  twitterHandle: "@formforge",
} as const;

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path = ""): string {
  const base = getSiteUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
