"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Eye,
  Inbox,
  Pencil,
  Sparkles,
  TrendingDown,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "./metric-card";
import {
  ChoiceDistributionChart,
  ResponsesByDayChart,
} from "./charts";
import { FunnelSection } from "./funnel-section";
import type { AnalyticsSummary } from "@/types/response";
import type {
  FunnelSummary,
  InteractionInsights,
} from "@/lib/analytics";
import { cn, formatDuration, truncate } from "@/lib/utils";
import { toast } from "sonner";

type Range = "all" | "today" | "7d" | "30d";

const RANGE_LABEL: Record<Range, string> = {
  all: "All time",
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

interface AnalyticsDashboardProps {
  formId: string;
  formTitle: string;
  initialAnalytics: AnalyticsSummary;
  initialFunnel: FunnelSummary;
  initialInsights: InteractionInsights;
}

export function AnalyticsDashboard({
  formId,
  formTitle,
  initialAnalytics,
  initialFunnel,
  initialInsights,
}: AnalyticsDashboardProps) {
  const [range, setRange] = React.useState<Range>("all");
  const [analytics, setAnalytics] = React.useState(initialAnalytics);
  const [, startTransition] = React.useTransition();
  const [loading, setLoading] = React.useState(false);

  const refetch = React.useCallback(
    async (next: Range) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/forms/${formId}/analytics?range=${next}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load analytics");
        startTransition(() => setAnalytics(data.analytics));
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setLoading(false);
      }
    },
    [formId],
  );

  const noData =
    analytics.totalViews === 0 &&
    analytics.totalSubmissions === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to forms
          </Link>
          <h1 className="text-2xl font-semibold tracking-tightish">
            {formTitle}
          </h1>
          <p className="text-sm text-muted-foreground">Form analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={range}
            onValueChange={(v) => {
              setRange(v as Range);
              void refetch(v as Range);
            }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RANGE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/forms/${formId}/builder`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <Button asChild size="sm" variant="subtle">
            <Link href={`/dashboard/forms/${formId}/responses`}>
              <Inbox className="h-3.5 w-3.5" />
              Responses
            </Link>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-5",
          loading && "opacity-60",
        )}
      >
        <MetricCard
          label="Views"
          value={analytics.totalViews.toLocaleString()}
          icon={<Eye className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Starts"
          value={analytics.totalStarts.toLocaleString()}
          icon={<Sparkles className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Submissions"
          value={analytics.totalSubmissions.toLocaleString()}
          icon={<Check className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Completion"
          value={`${analytics.completionRate}%`}
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          accent
        />
        <MetricCard
          label="Avg time"
          value={
            analytics.avgCompletionSeconds
              ? formatDuration(analytics.avgCompletionSeconds)
              : "—"
          }
          icon={<Clock className="h-3.5 w-3.5" />}
        />
      </div>

      {noData ? (
        <div className="mt-8 rounded-xl border border-dashed border-border/70 bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Activity className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium tracking-tightish">
            No data yet for this range
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Share your form to start collecting views and responses. Stats
            will appear here in real time.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Section title="Responses · last 14 days">
              <ResponsesByDayChart data={analytics.responsesByDay} />
            </Section>
            <Section
              title="Funnel"
              description={`${initialFunnel.completionRate}% of starters reach submit.`}
            >
              <FunnelSection funnel={initialFunnel} />
            </Section>
          </div>

          <InteractionInsightsSection insights={initialInsights} />

          <div className="mt-10">
            <h2 className="mb-3 text-sm font-medium tracking-tightish">
              Question analytics
            </h2>
            {analytics.questions.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
                No question-level data yet.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {analytics.questions.map((q) => (
                  <QuestionAnalyticsCard key={q.fieldId} q={q} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
      <div className="mb-3">
        <h3 className="text-sm font-medium tracking-tightish">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function InteractionInsightsSection({
  insights,
}: {
  insights: InteractionInsights;
}) {
  const empty =
    !insights.mostInteractedField &&
    !insights.mostErroredField &&
    !insights.worstStep &&
    insights.avgTimePerStepSeconds.length === 0;

  if (empty) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-medium tracking-tightish">
        Interaction insights
      </h2>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Where respondents spend time, hesitate, or drop off. Use this to spot
        confusing or frustrating fields.
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        <InsightCard
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Most interacted field"
          value={
            insights.mostInteractedField
              ? truncate(insights.mostInteractedField.label, 36)
              : "—"
          }
          hint={
            insights.mostInteractedField
              ? `${insights.mostInteractedField.count} interactions`
              : "No data"
          }
        />
        <InsightCard
          icon={<AlertCircle className="h-3.5 w-3.5" />}
          label="Most validation errors"
          value={
            insights.mostErroredField
              ? truncate(insights.mostErroredField.label, 36)
              : "—"
          }
          hint={
            insights.mostErroredField
              ? `${insights.mostErroredField.count} errors`
              : "No errors recorded"
          }
        />
        <InsightCard
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label="Highest drop-off step"
          value={
            insights.worstStep ? `Step ${insights.worstStep.step}` : "—"
          }
          hint={
            insights.worstStep
              ? `${insights.worstStep.dropOffs} respondents left here`
              : "No drop-offs recorded"
          }
        />
      </div>
      {insights.avgTimePerStepSeconds.length > 0 && (
        <div className="mt-3 rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            Avg time per step
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.avgTimePerStepSeconds.map((s) => (
              <div
                key={s.step}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs"
              >
                <span className="text-muted-foreground">Step {s.step}</span>
                <span className="font-medium tabular-nums">
                  {formatDuration(s.avgSeconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1.5 text-base font-medium tracking-tightish">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

function QuestionAnalyticsCard({
  q,
}: {
  q: AnalyticsSummary["questions"][number];
}) {
  const total = q.answeredCount + q.emptyCount;
  const answeredRate = total ? Math.round((q.answeredCount / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug tracking-tightish">
          {q.label}
        </h3>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {q.type.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
        <span>{q.answeredCount.toLocaleString()} answered</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{q.emptyCount.toLocaleString()} empty</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{answeredRate}% rate</span>
      </div>
      <div className="mt-4">
        {q.choiceDistribution && q.choiceDistribution.length > 0 && (
          <ChoiceDistributionChart data={q.choiceDistribution} />
        )}
        {typeof q.ratingAverage === "number" && (
          <div className="rounded-lg bg-muted/50 px-4 py-6 text-center">
            <div className="text-3xl font-semibold tabular-nums tracking-tightish">
              {q.ratingAverage.toFixed(1)}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              Average rating
            </div>
          </div>
        )}
        {typeof q.npsScore === "number" && q.npsBreakdown && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                NPS Score
              </span>
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums tracking-tightish",
                  q.npsScore >= 50 && "text-success",
                  q.npsScore < 0 && "text-destructive",
                )}
              >
                {q.npsScore}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <NpsCell
                label="Promoters"
                value={q.npsBreakdown.promoters}
                color="bg-emerald-500"
              />
              <NpsCell
                label="Passives"
                value={q.npsBreakdown.passives}
                color="bg-amber-500"
              />
              <NpsCell
                label="Detractors"
                value={q.npsBreakdown.detractors}
                color="bg-red-500"
              />
            </div>
          </div>
        )}

        {q.recentAnswers && q.recentAnswers.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Recent answers
            </div>
            <ul className="space-y-1.5">
              {q.recentAnswers.map((a, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm leading-relaxed"
                >
                  {truncate(a, 200)}
                </li>
              ))}
            </ul>
            {q.topWords && q.topWords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {q.topWords.map((w) => (
                  <span
                    key={w.word}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {w.word}{" "}
                    <span className="text-muted-foreground/60 tabular-nums">
                      ×{w.count}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!q.choiceDistribution &&
          q.ratingAverage === undefined &&
          q.npsScore === undefined &&
          (!q.recentAnswers || q.recentAnswers.length === 0) && (
            <div className="rounded-lg bg-muted/50 px-4 py-5 text-center text-xs text-muted-foreground">
              {q.answeredCount} responses captured
            </div>
          )}
      </div>
    </div>
  );
}

function NpsCell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background p-2.5">
      <div className={cn("mx-auto h-1 w-6 rounded-full", color)} />
      <div className="mt-1.5 text-base font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
