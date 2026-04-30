import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { formFields, forms } from "@/db/schema";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  type FormFieldDef,
  type FormSettings,
  type FormTheme,
  type PublicFormPayload,
} from "@/types/form";
import { safeJsonParse } from "@/lib/utils";

export async function loadFormForOwner(formId: string, userId: string) {
  const rows = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), eq(forms.userId, userId)))
    .limit(1);
  const form = rows[0];
  if (!form) throw new ApiError("Form not found", 404);
  return form;
}

export async function loadFormBySlug(slug: string) {
  const rows = await db
    .select()
    .from(forms)
    .where(eq(forms.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function loadFormFields(formId: string) {
  const rows = await db
    .select()
    .from(formFields)
    .where(eq(formFields.formId, formId))
    .orderBy(asc(formFields.step), asc(formFields.position));
  return rows.map(rowToFieldDef);
}

export function rowToFieldDef(row: typeof formFields.$inferSelect): FormFieldDef {
  return {
    id: row.id,
    type: row.type as FormFieldDef["type"],
    label: row.label,
    description: row.description ?? "",
    placeholder: row.placeholder ?? "",
    required: !!row.required,
    position: row.position,
    step: row.step,
    config: safeJsonParse(row.configJson, {}),
    validation: safeJsonParse(row.validationJson, {}),
    logic: safeJsonParse(row.logicJson, []),
  };
}

export function readFormSettings(form: typeof forms.$inferSelect): FormSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...safeJsonParse<Partial<FormSettings>>(form.settingsJson, {}),
  };
}

export function readFormTheme(form: typeof forms.$inferSelect): FormTheme {
  return {
    ...DEFAULT_THEME,
    ...safeJsonParse<Partial<FormTheme>>(form.themeJson, {}),
  };
}

export async function loadPublicForm(slug: string): Promise<PublicFormPayload | null> {
  const form = await loadFormBySlug(slug);
  if (!form || form.status !== "published") return null;
  const fields = await loadFormFields(form.id);
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    settings: readFormSettings(form),
    theme: readFormTheme(form),
    fields,
  };
}

export async function loadFormsForUser(userId: string) {
  const rows = await db
    .select()
    .from(forms)
    .where(eq(forms.userId, userId))
    .orderBy(desc(forms.updatedAt));
  return rows;
}
