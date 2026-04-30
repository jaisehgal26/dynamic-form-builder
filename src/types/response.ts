export interface ResponseAnswers {
  [fieldId: string]: string | string[] | number | boolean | null;
}

export interface ResponseMetadata {
  userAgent?: string;
  device?: "mobile" | "tablet" | "desktop" | "unknown";
  browser?: string;
  referrer?: string;
  ip?: string;
  startedAt?: number;
}

export interface ResponseSummary {
  id: string;
  formId: string;
  submittedAt: number;
  startedAt: number | null;
  completionTimeSeconds: number | null;
  preview: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalStarts: number;
  totalSubmissions: number;
  completionRate: number;
  avgCompletionSeconds: number;
  responsesByDay: { date: string; count: number }[];
  dropoffByStep: { step: number; views: number }[];
  questions: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  fieldId: string;
  type: string;
  label: string;
  answeredCount: number;
  emptyCount: number;
  choiceDistribution?: { label: string; count: number }[];
  ratingAverage?: number;
  npsScore?: number;
  npsBreakdown?: {
    promoters: number;
    passives: number;
    detractors: number;
  };
}
