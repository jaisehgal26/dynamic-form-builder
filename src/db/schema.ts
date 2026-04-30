import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

export const forms = sqliteTable(
  "forms",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    schemaJson: text("schema_json").notNull().default("{}"),
    themeJson: text("theme_json").notNull().default("{}"),
    settingsJson: text("settings_json").notNull().default("{}"),
    // Access controls
    passwordHash: text("password_hash"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    responseLimit: integer("response_limit"),
    collectEmail: integer("collect_email", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    slugIdx: uniqueIndex("forms_slug_idx").on(t.slug),
    userIdx: index("forms_user_idx").on(t.userId),
    statusIdx: index("forms_status_idx").on(t.status),
  }),
);

export const formFields = sqliteTable(
  "form_fields",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    placeholder: text("placeholder"),
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    position: integer("position").notNull().default(0),
    step: integer("step").notNull().default(1),
    configJson: text("config_json").notNull().default("{}"),
    validationJson: text("validation_json").notNull().default("{}"),
    logicJson: text("logic_json").notNull().default("[]"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    formIdx: index("form_fields_form_idx").on(t.formId),
    formPosIdx: index("form_fields_form_pos_idx").on(t.formId, t.position),
  }),
);

export const formResponses = sqliteTable(
  "form_responses",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    respondentId: text("respondent_id"),
    respondentEmail: text("respondent_email"),
    answersJson: text("answers_json").notNull().default("{}"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    completionTimeSeconds: integer("completion_time_seconds"),
  },
  (t) => ({
    formIdx: index("form_responses_form_idx").on(t.formId),
    submittedIdx: index("form_responses_submitted_idx").on(t.submittedAt),
  }),
);

export const formEvents = sqliteTable(
  "form_events",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    eventType: text("event_type", {
      enum: [
        "view",
        "start",
        "step_view",
        "field_focus",
        "field_blur",
        "field_change",
        "field_error",
        "submit",
        "drop_off",
      ],
    }).notNull(),
    step: integer("step"),
    fieldId: text("field_id"),
    sessionId: text("session_id"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    formIdx: index("form_events_form_idx").on(t.formId),
    typeIdx: index("form_events_type_idx").on(t.eventType),
    sessionIdx: index("form_events_session_idx").on(t.sessionId),
    fieldIdx: index("form_events_field_idx").on(t.fieldId),
    createdIdx: index("form_events_created_idx").on(t.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;
export type FormResponse = typeof formResponses.$inferSelect;
export type NewFormResponse = typeof formResponses.$inferInsert;
export type FormEvent = typeof formEvents.$inferSelect;
export type NewFormEvent = typeof formEvents.$inferInsert;
