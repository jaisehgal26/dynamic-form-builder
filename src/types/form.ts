export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "phone",
  "number",
  "date",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "rating",
  "nps",
  "file_upload",
  "section_heading",
  "page_break",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const CHOICE_FIELD_TYPES: FieldType[] = [
  "single_choice",
  "multiple_choice",
  "dropdown",
];

export const NON_INPUT_FIELD_TYPES: FieldType[] = [
  "section_heading",
  "page_break",
];

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FieldConfig {
  options?: FieldOption[];
  maxRating?: number;
  ratingIcon?: "star" | "heart" | "thumb";
  npsLabels?: { low?: string; high?: string };
  multiline?: boolean;
  acceptTypes?: string[];
  headingLevel?: "h1" | "h2" | "h3";
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  customMessage?: string;
}

export type LogicOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than";

export type LogicAction = "show" | "hide" | "go_to_step";

export interface LogicRule {
  id: string;
  sourceFieldId: string;
  operator: LogicOperator;
  value?: string | number | boolean;
  action: LogicAction;
  targetStep?: number;
}

export interface FormFieldDef {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  position: number;
  step: number;
  config: FieldConfig;
  validation: FieldValidation;
  logic: LogicRule[];
}

export interface FormSettings {
  multiStep: boolean;
  showProgressBar: boolean;
  allowMultipleSubmissions: boolean;
  thankYouMessage: string;
  redirectUrl?: string;
  closedMessage?: string;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  font: string;
}

export interface FormSchema {
  title: string;
  description?: string;
  settings: FormSettings;
  theme: FormTheme;
  fields: FormFieldDef[];
}

export const DEFAULT_SETTINGS: FormSettings = {
  multiStep: false,
  showProgressBar: true,
  allowMultipleSubmissions: true,
  thankYouMessage: "Thanks for submitting! We've received your response.",
};

export const DEFAULT_THEME: FormTheme = {
  primaryColor: "#0a0a0a",
  backgroundColor: "#ffffff",
  font: "Inter",
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  dropdown: "Dropdown",
  rating: "Rating",
  nps: "NPS",
  file_upload: "File upload",
  section_heading: "Section heading",
  page_break: "Page break",
};

export interface FormSummary {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  responseCount: number;
  viewCount: number;
}

export interface PublicFormPayload {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  settings: FormSettings;
  theme: FormTheme;
  fields: FormFieldDef[];
}
