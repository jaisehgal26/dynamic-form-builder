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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "./metric-card";
import {
  ChoiceDistributionChart,
  DropoffChart,
  ResponsesByDayChart,
} from "./charts";
import type { AnalyticsSummary } from "@/types/response";
import { cn, formatDuration } from "@/lib/utils";

interface AnalyticsDashboardProps {
  formId: string;
  formTitle: string;
  analytics: AnalyticsSummary;
}

export function AnalyticsDashboard({
  formId,
  formTitle,
  analytics,
}: AnalyticsDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
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
        <div className="flex flex-wrap gap-2">
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title="Responses · last 14 days">
          <ResponsesByDayChart data={analytics.responsesByDay} />
        </Section>
        <Section title="Drop-off by step">
          {analytics.dropoffByStep.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Multi-step data will appear once respondents move between steps.
            </p>
          ) : (
            <DropoffChart data={analytics.dropoffByStep} />
          )}
        </Section>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-medium tracking-tightish">
          Question analytics
        </h2>
        {analytics.questions.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            No question-level data yet. Once you receive responses, you'll see
            breakdowns here.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {analytics.questions.map((q) => (
              <QuestionAnalyticsCard key={q.fieldId} q={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
      <h3 className="mb-3 text-sm font-medium tracking-tightish">{title}</h3>
      {children}
    </section>
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
        {!q.choiceDistribution &&
          q.ratingAverage === undefined &&
          q.npsScore === undefined && (
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
