import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { formFields, formResponses, forms } from "@/db/schema";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  type FormFieldDef,
  type FormSettings,
  type FormTheme,
  type PublicFormPayload,
  type PublicAccessState,
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

export interface PublicFormResolution {
  state: PublicAccessState;
  /** Public payload — populated when state is "ok" or "password_required". */
  form?: PublicFormPayload;
  /** Required to display closed-message screen. */
  closedMessage?: string;
}

export async function resolvePublicForm(
  slug: string,
): Promise<PublicFormResolution> {
  const form = await loadFormBySlug(slug);
  if (!form || form.status !== "published") {
    return { state: "not_found" };
  }

  const settings = readFormSettings(form);

  // Expiry check
  if (form.expiresAt && Number(form.expiresAt) < Date.now()) {
    return { state: "expired", closedMessage: settings.closedMessage };
  }

  // Response limit check
  if (form.responseLimit && form.responseLimit > 0) {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(formResponses)
      .where(eq(formResponses.formId, form.id));
    const total = Number(count[0]?.count ?? 0);
    if (total >= form.responseLimit) {
      return { state: "limit_reached", closedMessage: settings.closedMessage };
    }
  }

  const fields = await loadFormFields(form.id);

  // Password check is the responsibility of the page (after a token check),
  // so we don't refuse here, just signal it.
  if (form.passwordHash) {
    return {
      state: "password_required",
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description,
        settings,
        theme: readFormTheme(form),
        fields: [],
        collectEmail: !!form.collectEmail,
      },
    };
  }

  return {
    state: "ok",
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      settings,
      theme: readFormTheme(form),
      fields,
      collectEmail: !!form.collectEmail,
    },
  };
}

/** Backwards-compatible helper for code that just wants the form when it's ok. */
export async function loadPublicForm(
  slug: string,
): Promise<PublicFormPayload | null> {
  const r = await resolvePublicForm(slug);
  return r.state === "ok" ? r.form ?? null : null;
}

export async function loadFormsForUser(userId: string) {
  const rows = await db
    .select()
    .from(forms)
    .where(eq(forms.userId, userId))
    .orderBy(desc(forms.updatedAt));
  return rows;
}
