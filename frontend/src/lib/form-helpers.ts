import type {
  FieldType,
  FormFieldDef,
  FormSchema,
  FormSettings,
  FormTheme,
  LogicRule,
} from "@/types/form";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/types/form";
import { generateFieldId } from "./slug";

export function createDefaultField(
  type: FieldType,
  position: number,
  step = 1,
): FormFieldDef {
  const base: FormFieldDef = {
    id: generateFieldId(),
    type,
    label: defaultLabelFor(type),
    description: "",
    placeholder: defaultPlaceholderFor(type),
    required: false,
    position,
    step,
    config: {},
    validation: {},
    logic: [],
  };

  if (
    type === "single_choice" ||
    type === "multiple_choice" ||
    type === "dropdown"
  ) {
    base.config.options = [
      { id: generateFieldId(), label: "Option 1", value: "option_1" },
      { id: generateFieldId(), label: "Option 2", value: "option_2" },
    ];
  }
  if (type === "rating") {
    base.config.maxRating = 5;
    base.config.ratingIcon = "star";
  }
  if (type === "nps") {
    base.config.npsLabels = { low: "Not likely", high: "Very likely" };
  }
  if (type === "section_heading") {
    base.config.headingLevel = "h2";
  }
  return base;
}

function defaultLabelFor(type: FieldType): string {
  switch (type) {
    case "short_text":
      return "Short answer question";
    case "long_text":
      return "Long answer question";
    case "email":
      return "What's your email?";
    case "phone":
      return "What's your phone number?";
    case "number":
      return "Enter a number";
    case "date":
      return "Pick a date";
    case "single_choice":
      return "Choose one";
    case "multiple_choice":
      return "Choose any that apply";
    case "dropdown":
      return "Select an option";
    case "rating":
      return "Rate your experience";
    case "nps":
      return "How likely are you to recommend us?";
    case "file_upload":
      return "Upload a file";
    case "section_heading":
      return "Section heading";
    case "page_break":
      return "Page break";
    default:
      return "Question";
  }
}

function defaultPlaceholderFor(type: FieldType): string | undefined {
  switch (type) {
    case "short_text":
      return "Type your answer…";
    case "long_text":
      return "Type your answer…";
    case "email":
      return "name@example.com";
    case "phone":
      return "+1 555 555 5555";
    case "number":
      return "0";
    default:
      return undefined;
  }
}

export function buildFormSchema(opts: {
  title: string;
  description?: string | null;
  settings?: FormSettings;
  theme?: FormTheme;
  fields: FormFieldDef[];
}): FormSchema {
  return {
    title: opts.title,
    description: opts.description ?? "",
    settings: opts.settings ?? DEFAULT_SETTINGS,
    theme: opts.theme ?? DEFAULT_THEME,
    fields: [...opts.fields].sort((a, b) => a.position - b.position),
  };
}

export function evaluateLogic(
  rule: LogicRule,
  answers: Record<string, unknown>,
): boolean {
  const value = answers[rule.sourceFieldId];
  switch (rule.operator) {
    case "is_empty":
      return value === null || value === undefined || value === "" ||
        (Array.isArray(value) && value.length === 0);
    case "is_not_empty":
      return !(
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    case "equals":
      if (Array.isArray(value)) return value.includes(rule.value as string);
      return String(value ?? "") === String(rule.value ?? "");
    case "not_equals":
      if (Array.isArray(value)) return !value.includes(rule.value as string);
      return String(value ?? "") !== String(rule.value ?? "");
    case "contains":
      if (Array.isArray(value)) return value.includes(rule.value as string);
      return String(value ?? "").includes(String(rule.value ?? ""));
    case "not_contains":
      if (Array.isArray(value)) return !value.includes(rule.value as string);
      return !String(value ?? "").includes(String(rule.value ?? ""));
    case "greater_than":
      return Number(value) > Number(rule.value);
    case "less_than":
      return Number(value) < Number(rule.value);
    default:
      return false;
  }
}

export function isFieldVisible(
  field: FormFieldDef,
  answers: Record<string, unknown>,
): boolean {
  if (!field.logic || field.logic.length === 0) return true;

  const showRules = field.logic.filter((r) => r.action === "show");
  const hideRules = field.logic.filter((r) => r.action === "hide");

  if (hideRules.some((r) => evaluateLogic(r, answers))) return false;

  if (showRules.length > 0) {
    return showRules.some((r) => evaluateLogic(r, answers));
  }

  return true;
}

export function groupFieldsByStep(
  fields: FormFieldDef[],
): Map<number, FormFieldDef[]> {
  const sorted = [...fields].sort(
    (a, b) => a.step - b.step || a.position - b.position,
  );
  const map = new Map<number, FormFieldDef[]>();
  for (const f of sorted) {
    if (!map.has(f.step)) map.set(f.step, []);
    map.get(f.step)!.push(f);
  }
  return map;
}

export function maxStep(fields: FormFieldDef[]): number {
  return fields.reduce((max, f) => Math.max(max, f.step), 1);
}
