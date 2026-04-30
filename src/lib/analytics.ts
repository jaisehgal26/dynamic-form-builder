import type { FormFieldDef } from "@/types/form";
import type {
  AnalyticsSummary,
  QuestionAnalytics,
  ResponseAnswers,
} from "@/types/response";

interface ComputeAnalyticsInput {
  fields: FormFieldDef[];
  events: { eventType: string; step: number | null; createdAt: number }[];
  responses: {
    submittedAt: number;
    completionTimeSeconds: number | null;
    answers: ResponseAnswers;
  }[];
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
          Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
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
