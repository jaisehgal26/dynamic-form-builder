import type { FormFieldDef } from "@/types/form";
import type {
  AnalyticsSummary,
  QuestionAnalytics,
  ResponseAnswers,
} from "@/types/response";

export interface EventInput {
  eventType: string;
  step: number | null;
  fieldId: string | null;
  sessionId: string | null;
  createdAt: number;
}

export interface ResponseInput {
  submittedAt: number;
  completionTimeSeconds: number | null;
  answers: ResponseAnswers;
}

interface ComputeAnalyticsInput {
  fields: FormFieldDef[];
  events: EventInput[];
  responses: ResponseInput[];
  rangeDays?: number;
}

export function computeAnalytics({
  fields,
  events,
  responses,
  rangeDays = 14,
}: ComputeAnalyticsInput): AnalyticsSummary {
  const totalViews = events.filter((e) => e.eventType === "view").length;
  const totalStarts = events.filter((e) => e.eventType === "start").length;
  const totalSubmissions = responses.length;

  const completionRate = totalStarts
    ? Math.min(100, Math.round((totalSubmissions / totalStarts) * 100))
    : totalViews
    ? Math.round((totalSubmissions / totalViews) * 100)
    : 0;

  const completionTimes = responses
    .map((r) => r.completionTimeSeconds)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgCompletionSeconds = completionTimes.length
    ? Math.round(
        completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length,
      )
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const responsesByDay: { date: string; count: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const count = responses.filter((r) => {
      const d = new Date(r.submittedAt);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10) === key;
    }).length;
    responsesByDay.push({ date: key, count });
  }

  const stepNumbers = Array.from(
    new Set(fields.map((f) => f.step).filter((s) => s > 0)),
  ).sort((a, b) => a - b);
  const dropoffByStep = stepNumbers.map((step) => ({
    step,
    views: events.filter(
      (e) => e.eventType === "step_view" && e.step === step,
    ).length,
  }));

  const inputFields = fields.filter(
    (f) => f.type !== "section_heading" && f.type !== "page_break",
  );

  const questions: QuestionAnalytics[] = inputFields.map((field) => {
    const values = responses.map((r) => r.answers[field.id]);
    const answeredCount = values.filter(
      (v) =>
        v !== null &&
        v !== undefined &&
        v !== "" &&
        !(Array.isArray(v) && v.length === 0),
    ).length;
    const emptyCount = responses.length - answeredCount;

    const q: QuestionAnalytics = {
      fieldId: field.id,
      type: field.type,
      label: field.label,
      answeredCount,
      emptyCount,
    };

    if (
      field.type === "single_choice" ||
      field.type === "multiple_choice" ||
      field.type === "dropdown"
    ) {
      const counts = new Map<string, number>();
      const options = field.config.options ?? [];
      for (const opt of options) counts.set(opt.value, 0);
      for (const v of values) {
        if (Array.isArray(v)) {
          for (const item of v) {
            counts.set(String(item), (counts.get(String(item)) ?? 0) + 1);
          }
        } else if (v !== null && v !== undefined && v !== "") {
          counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
        }
      }
      q.choiceDistribution = options.map((opt) => ({
        label: opt.label,
        count: counts.get(opt.value) ?? 0,
      }));
    }

    if (field.type === "rating") {
      const nums = values
        .map((v) => Number(v))
        .filter((n) => !isNaN(n) && n > 0);
      if (nums.length) {
        q.ratingAverage =
          Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) /
          10;
      }
    }

    if (field.type === "nps") {
      const nums = values
        .map((v) => Number(v))
        .filter((n) => !isNaN(n) && n >= 0 && n <= 10);
      if (nums.length) {
        const promoters = nums.filter((n) => n >= 9).length;
        const passives = nums.filter((n) => n >= 7 && n <= 8).length;
        const detractors = nums.filter((n) => n <= 6).length;
        const score = Math.round(
          ((promoters - detractors) / nums.length) * 100,
        );
        q.npsScore = score;
        q.npsBreakdown = { promoters, passives, detractors };
      }
    }

    if (field.type === "short_text" || field.type === "long_text") {
      const recent: string[] = [];
      const wordFreq = new Map<string, number>();
      for (const v of values) {
        if (typeof v !== "string" || !v.trim()) continue;
        if (recent.length < 5) recent.push(v.trim());
        const words = v
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .split(/\s+/)
          .filter(
            (w) =>
              w.length > 3 &&
              !STOP_WORDS.has(w),
          );
        for (const w of words) {
          wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
        }
      }
      q.recentAnswers = recent;
      q.topWords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word, count]) => ({ word, count }));
    }

    return q;
  });

  return {
    totalViews,
    totalStarts,
    totalSubmissions,
    completionRate,
    avgCompletionSeconds,
    responsesByDay,
    dropoffByStep,
    questions,
  };
}

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
  "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy",
  "did", "its", "let", "put", "say", "she", "too", "use", "with", "from",
  "this", "that", "have", "they", "your", "what", "would", "there", "their",
  "which", "about", "just", "into", "than", "more", "very", "some", "like",
  "when", "these", "want", "been", "were", "could", "after", "then",
]);

export interface FunnelStep {
  step: number;
  views: number;
  /** Percentage retention vs first step. 0–100. */
  retention: number;
  /** Drop-off vs previous step (positive = lost). 0–100. */
  dropFromPrev: number;
}

export interface FunnelSummary {
  steps: FunnelStep[];
  /** % of starts that reached submit. */
  completionRate: number;
  /** Step where most respondents dropped off, if any. */
  worstStep: number | null;
}

export function computeFunnel({
  events,
  totalSubmissions,
}: {
  fields: FormFieldDef[];
  events: EventInput[];
  totalSubmissions: number;
}): FunnelSummary {
  const stepCounts = new Map<number, number>();
  for (const e of events) {
    if (e.eventType !== "step_view" || e.step == null) continue;
    stepCounts.set(e.step, (stepCounts.get(e.step) ?? 0) + 1);
  }

  const steps = Array.from(stepCounts.keys()).sort((a, b) => a - b);
  const first = steps[0] ? stepCounts.get(steps[0]) ?? 0 : 0;

  const out: FunnelStep[] = steps.map((step, i) => {
    const views = stepCounts.get(step) ?? 0;
    const prev = i > 0 ? stepCounts.get(steps[i - 1]) ?? 0 : views;
    return {
      step,
      views,
      retention: first > 0 ? Math.round((views / first) * 100) : 0,
      dropFromPrev:
        prev > 0 ? Math.max(0, Math.round(((prev - views) / prev) * 100)) : 0,
    };
  });

  const completionRate =
    first > 0 ? Math.round((totalSubmissions / first) * 100) : 0;

  let worstStep: number | null = null;
  let worstDrop = 0;
  for (const s of out) {
    if (s.dropFromPrev > worstDrop) {
      worstDrop = s.dropFromPrev;
      worstStep = s.step;
    }
  }

  return { steps: out, completionRate, worstStep };
}

export interface InteractionInsights {
  mostInteractedField: { fieldId: string; label: string; count: number } | null;
  mostErroredField: { fieldId: string; label: string; count: number } | null;
  worstStep: { step: number; dropOffs: number } | null;
  avgTimePerStepSeconds: { step: number; avgSeconds: number }[];
}

export function computeInteractionInsights({
  fields,
  events,
}: {
  fields: FormFieldDef[];
  events: EventInput[];
}): InteractionInsights {
  const byField = new Map<string, number>();
  const errorByField = new Map<string, number>();
  const dropOffs = new Map<number, number>();

  // Time per step: per-session, time between step_view events.
  const sessionStepTimes = new Map<string, Map<number, number>>(); // session -> step -> ms-spent
  const lastByStepBySession = new Map<string, { step: number; ts: number }>();

  for (const e of events) {
    if (e.eventType === "field_focus" && e.fieldId) {
      byField.set(e.fieldId, (byField.get(e.fieldId) ?? 0) + 1);
    }
    if (e.eventType === "field_change" && e.fieldId) {
      byField.set(e.fieldId, (byField.get(e.fieldId) ?? 0) + 1);
    }
    if (e.eventType === "field_error" && e.fieldId) {
      errorByField.set(
        e.fieldId,
        (errorByField.get(e.fieldId) ?? 0) + 1,
      );
    }
    if (e.eventType === "drop_off" && e.step != null) {
      dropOffs.set(e.step, (dropOffs.get(e.step) ?? 0) + 1);
    }
    if (e.eventType === "step_view" && e.step != null && e.sessionId) {
      const last = lastByStepBySession.get(e.sessionId);
      if (last && last.step !== e.step) {
        const elapsed = Math.max(0, e.createdAt - last.ts);
        const sm =
          sessionStepTimes.get(e.sessionId) ??
          new Map<number, number>();
        sm.set(last.step, (sm.get(last.step) ?? 0) + elapsed);
        sessionStepTimes.set(e.sessionId, sm);
      }
      lastByStepBySession.set(e.sessionId, { step: e.step, ts: e.createdAt });
    }
  }

  const fieldLabel = (id: string) =>
    fields.find((f) => f.id === id)?.label ?? id;

  const top = (m: Map<string, number>) => {
    let best: [string, number] | null = null;
    for (const entry of m.entries()) {
      if (!best || entry[1] > best[1]) best = entry;
    }
    return best;
  };

  const topInteract = top(byField);
  const topError = top(errorByField);

  let worstStep: { step: number; dropOffs: number } | null = null;
  for (const [step, count] of dropOffs.entries()) {
    if (!worstStep || count > worstStep.dropOffs) {
      worstStep = { step, dropOffs: count };
    }
  }

  // Aggregate avg time per step
  const stepSums = new Map<number, { sum: number; n: number }>();
  for (const sm of sessionStepTimes.values()) {
    for (const [step, ms] of sm.entries()) {
      const cur = stepSums.get(step) ?? { sum: 0, n: 0 };
      cur.sum += ms;
      cur.n += 1;
      stepSums.set(step, cur);
    }
  }
  const avgTimePerStepSeconds = Array.from(stepSums.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([step, v]) => ({
      step,
      avgSeconds: v.n > 0 ? Math.round(v.sum / v.n / 1000) : 0,
    }));

  return {
    mostInteractedField: topInteract
      ? {
          fieldId: topInteract[0],
          label: fieldLabel(topInteract[0]),
          count: topInteract[1],
        }
      : null,
    mostErroredField: topError
      ? {
          fieldId: topError[0],
          label: fieldLabel(topError[0]),
          count: topError[1],
        }
      : null,
    worstStep,
    avgTimePerStepSeconds,
  };
}
