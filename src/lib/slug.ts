import { customAlphabet } from "nanoid";

const idAlphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const shortId = customAlphabet(idAlphabet, 6);

export function generateId(prefix?: string): string {
  const id = customAlphabet(idAlphabet, 16)();
  return prefix ? `${prefix}_${id}` : id;
}

export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function generateFormSlug(title: string): string {
  const base = slugify(title) || "form";
  return `${base}-${shortId()}`;
}

export function generateFieldId(): string {
  return `field_${shortId()}${shortId()}`;
}
