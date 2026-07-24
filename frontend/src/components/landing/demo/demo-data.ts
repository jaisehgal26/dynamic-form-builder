import type { FormFieldDef, FormSettings, FormTheme, PublicFormPayload } from "@/types/form";
import type { AnalyticsSummary } from "@/types/response";
import type { FunnelSummary, InteractionInsights } from "@/lib/analytics";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/types/form";

export const DEMO_FORM_ID = "demo-form";
export const DEMO_SLUG = "customer-onboarding";
export const DEMO_PUBLIC_URL = "https://formforge.app/f/customer-onboarding";
export const DEMO_PASSWORD = "welcome";

export const DEMO_SETTINGS: FormSettings = {
  ...DEFAULT_SETTINGS,
  multiStep: true,
  showProgressBar: true,
  showQuestionNumbers: true,
  submitButtonText: "Submit application",
};

export const DEMO_THEME: FormTheme = {
  ...DEFAULT_THEME,
  primaryColor: "hsl(240 65% 56%)",
};

export function createDemoFields(): FormFieldDef[] {
  return [
    {
      id: "demo_name",
      type: "short_text",
      label: "Full name",
      description: "",
      placeholder: "Alex Morgan",
      required: true,
      position: 0,
      step: 1,
      config: {},
      validation: {},
      logic: [],
    },
    {
      id: "demo_email",
      type: "email",
      label: "Work email",
      description: "We'll send your onboarding checklist here.",
      placeholder: "you@company.com",
      required: true,
      position: 1,
      step: 1,
      config: {},
      validation: {},
      logic: [],
    },
    {
      id: "demo_role",
      type: "single_choice",
      label: "What's your role?",
      description: "",
      placeholder: undefined,
      required: true,
      position: 2,
      step: 1,
      config: {
        options: [
          { id: "opt_ic", label: "Individual contributor", value: "ic" },
          { id: "opt_mgr", label: "Manager", value: "manager" },
          { id: "opt_exec", label: "Executive", value: "executive" },
        ],
      },
      validation: {},
      logic: [],
    },
    {
      id: "demo_team",
      type: "number",
      label: "How large is your team?",
      description: "Only shown when role is Manager.",
      placeholder: "12",
      required: false,
      position: 3,
      step: 1,
      config: {},
      validation: { min: 1, max: 500 },
      logic: [
        {
          id: "logic_team_show",
          sourceFieldId: "demo_role",
          operator: "equals",
          value: "manager",
          action: "show",
        },
      ],
    },
    {
      id: "demo_break",
      type: "page_break",
      label: "Page break",
      description: "",
      placeholder: undefined,
      required: false,
      position: 4,
      step: 2,
      config: {},
      validation: {},
      logic: [],
    },
    {
      id: "demo_company",
      type: "dropdown",
      label: "Company size",
      description: "",
      placeholder: undefined,
      required: true,
      position: 5,
      step: 2,
      config: {
        options: [
          { id: "sz_1", label: "1–10", value: "1-10" },
          { id: "sz_2", label: "11–50", value: "11-50" },
          { id: "sz_3", label: "51–200", value: "51-200" },
          { id: "sz_4", label: "200+", value: "200+" },
        ],
      },
      validation: {},
      logic: [],
    },
    {
      id: "demo_nps",
      type: "nps",
      label: "How likely are you to recommend us?",
      description: "",
      placeholder: undefined,
      required: false,
      position: 6,
      step: 2,
      config: {
        npsLabels: { low: "Not likely", high: "Very likely" },
      },
      validation: {},
      logic: [],
    },
    {
      id: "demo_rating",
      type: "rating",
      label: "Rate your onboarding experience",
      description: "",
      placeholder: undefined,
      required: false,
      position: 7,
      step: 2,
      config: { maxRating: 5, ratingIcon: "star" },
      validation: {},
      logic: [],
    },
  ];
}

export function createDemoPublicForm(
  fields: FormFieldDef[],
  overrides?: Partial<PublicFormPayload>,
): PublicFormPayload {
  return {
    id: DEMO_FORM_ID,
    slug: DEMO_SLUG,
    title: "Customer onboarding",
    description: "Tell us a bit about your team so we can tailor your setup.",
    settings: DEMO_SETTINGS,
    theme: DEMO_THEME,
    fields,
    collectEmail: false,
    ...overrides,
  };
}

const last14Days = () => {
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  const counts = [4, 7, 5, 9, 6, 11, 8, 14, 10, 12, 9, 15, 11, 13];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({
      date: d.toISOString().slice(0, 10),
      count: counts[13 - i] ?? 6,
    });
  }
  return out;
};

export const DEMO_ANALYTICS: AnalyticsSummary = {
  totalViews: 248,
  totalStarts: 186,
  totalSubmissions: 142,
  completionRate: 76,
  avgCompletionSeconds: 94,
  responsesByDay: last14Days(),
  dropoffByStep: [
    { step: 1, views: 186 },
    { step: 2, views: 158 },
  ],
  questions: [
    {
      fieldId: "demo_role",
      type: "single_choice",
      label: "What's your role?",
      answeredCount: 168,
      emptyCount: 18,
      choiceDistribution: [
        { label: "Individual contributor", count: 72 },
        { label: "Manager", count: 58 },
        { label: "Executive", count: 38 },
      ],
    },
    {
      fieldId: "demo_company",
      type: "dropdown",
      label: "Company size",
      answeredCount: 154,
      emptyCount: 32,
      choiceDistribution: [
        { label: "1–10", count: 28 },
        { label: "11–50", count: 52 },
        { label: "51–200", count: 48 },
        { label: "200+", count: 26 },
      ],
    },
    {
      fieldId: "demo_nps",
      type: "nps",
      label: "How likely are you to recommend us?",
      answeredCount: 131,
      emptyCount: 11,
      npsScore: 42,
      npsBreakdown: { promoters: 68, passives: 44, detractors: 19 },
    },
    {
      fieldId: "demo_rating",
      type: "rating",
      label: "Rate your onboarding experience",
      answeredCount: 128,
      emptyCount: 14,
      ratingAverage: 4.6,
    },
  ],
};

export const DEMO_FUNNEL: FunnelSummary = {
  steps: [
    { step: 1, views: 186, retention: 100, dropFromPrev: 0 },
    { step: 2, views: 158, retention: 85, dropFromPrev: 15 },
  ],
  completionRate: 76,
  worstStep: 2,
};

export const DEMO_INSIGHTS: InteractionInsights = {
  mostInteractedField: {
    fieldId: "demo_email",
    label: "Work email",
    count: 142,
  },
  mostErroredField: {
    fieldId: "demo_team",
    label: "How large is your team?",
    count: 18,
  },
  worstStep: { step: 2, dropOffs: 28 },
  avgTimePerStepSeconds: [
    { step: 1, avgSeconds: 52 },
    { step: 2, avgSeconds: 42 },
  ],
};

export const DEMO_RESPONSE_ROWS = [
  { name: "Alex Morgan", email: "alex@latticeflow.io", role: "Manager", score: "9" },
  { name: "Priya Nair", email: "priya@stackline.app", role: "Executive", score: "10" },
  { name: "Marcus Webb", email: "marcus@northwind.co", role: "IC", score: "8" },
  { name: "Sarah Chen", email: "sarah@latticeflow.io", role: "Manager", score: "9" },
];
