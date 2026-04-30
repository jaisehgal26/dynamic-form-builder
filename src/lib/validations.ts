import { z } from "zod";
import { FIELD_TYPES } from "@/types/form";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
});

export const updateFormSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const fieldOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
});

const fieldConfigSchema = z
  .object({
    options: z.array(fieldOptionSchema).optional(),
    maxRating: z.number().int().min(2).max(10).optional(),
    ratingIcon: z.enum(["star", "heart", "thumb"]).optional(),
    npsLabels: z
      .object({
        low: z.string().optional(),
        high: z.string().optional(),
      })
      .optional(),
    multiline: z.boolean().optional(),
    acceptTypes: z.array(z.string()).optional(),
    headingLevel: z.enum(["h1", "h2", "h3"]).optional(),
  })
  .default({});

const fieldValidationSchema = z
  .object({
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    patternMessage: z.string().optional(),
    customMessage: z.string().optional(),
  })
  .default({});

const logicRuleSchema = z.object({
  id: z.string(),
  sourceFieldId: z.string(),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "is_empty",
    "is_not_empty",
    "greater_than",
    "less_than",
  ]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  action: z.enum(["show", "hide", "go_to_step"]),
  targetStep: z.number().int().optional(),
});

export const fieldSchema = z.object({
  id: z.string(),
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1).max(500),
  description: z.string().max(1000).optional().nullable(),
  placeholder: z.string().max(200).optional().nullable(),
  required: z.boolean().default(false),
  position: z.number().int().nonnegative(),
  step: z.number().int().min(1).default(1),
  config: fieldConfigSchema,
  validation: fieldValidationSchema,
  logic: z.array(logicRuleSchema).default([]),
});

export const fullFormSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  settings: z.object({
    multiStep: z.boolean(),
    showProgressBar: z.boolean(),
    allowMultipleSubmissions: z.boolean(),
    thankYouMessage: z.string(),
    redirectUrl: z.string().url().optional().or(z.literal("")).optional(),
    closedMessage: z.string().optional(),
  }),
  theme: z.object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
    font: z.string(),
  }),
  fields: z.array(fieldSchema),
});

export const reorderFieldsSchema = z.object({
  order: z.array(z.string()).min(1),
});

export const createFieldSchema = fieldSchema.partial({ id: true, position: true });

export const updateFieldSchema = fieldSchema.partial();

export const formEventSchema = z.object({
  eventType: z.enum(["view", "start", "step_view", "submit"]),
  step: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const submitResponseSchema = z.object({
  answers: z.record(
    z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.null()]),
  ),
  startedAt: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
