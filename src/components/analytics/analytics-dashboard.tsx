"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./metric-card";
import {
  ChoiceDistributionChart,
  DropoffChart,
  ResponsesByDayChart,
} from "./charts";
import type { AnalyticsSummary } from "@/types/response";
import { formatDuration } from "@/lib/utils";

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
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to forms
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {formTitle}
          </h1>
          <p className="text-sm text-muted-foreground">Analytics dashboard</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/forms/${formId}/builder`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit form
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/dashboard/forms/${formId}/responses`}>
              <Inbox className="h-3.5 w-3.5" />
              View responses
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total views"
          value={analytics.totalViews.toLocaleString()}
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          label="Total starts"
          value={analytics.totalStarts.toLocaleString()}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Submissions"
          value={analytics.totalSubmissions.toLocaleString()}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Completion rate"
          value={`${analytics.completionRate}%`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          label="Avg completion"
          value={
            analytics.avgCompletionSeconds
              ? formatDuration(analytics.avgCompletionSeconds)
              : "—"
          }
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Responses · last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsesByDayChart data={analytics.responsesByDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Drop-off by step</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.dropoffByStep.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Multi-step data will appear here once respondents move between
                steps.
              </p>
            ) : (
              <DropoffChart data={analytics.dropoffByStep} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Question analytics</h2>
        {analytics.questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No question-level data yet. Once you receive responses, you'll
              see breakdowns here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {analytics.questions.map((q) => (
              <QuestionAnalyticsCard key={q.fieldId} q={q} />
            ))}
          </div>
        )}
      </div>
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug">
            {q.label}
          </CardTitle>
          <Badge variant="outline" className="capitalize">
            {q.type.replace(/_/g, " ")}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {q.answeredCount} answered · {q.emptyCount} empty · {answeredRate}% rate
        </p>
      </CardHeader>
      <CardContent>
        {q.choiceDistribution && q.choiceDistribution.length > 0 && (
          <ChoiceDistributionChart data={q.choiceDistribution} />
        )}
        {typeof q.ratingAverage === "number" && (
          <div className="rounded-lg border bg-muted/20 p-4 text-center">
            <div className="text-3xl font-semibold tracking-tight">
              {q.ratingAverage.toFixed(1)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Average rating
            </div>
          </div>
        )}
        {typeof q.npsScore === "number" && q.npsBreakdown && (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">NPS Score</span>
              <span className="text-2xl font-semibold tracking-tight">
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
            <div className="rounded-lg border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
              {q.answeredCount} responses captured
            </div>
          )}
      </CardContent>
    </Card>
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
    <div className="rounded-md border p-2">
      <div className={`mx-auto h-1 w-6 rounded ${color}`} />
      <div className="mt-1 text-base font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
