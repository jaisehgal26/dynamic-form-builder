"use client";

import * as React from "react";
import { Activity, Check, Clock, Eye, Inbox, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/analytics/metric-card";
import { ResponsesByDayChart } from "@/components/analytics/charts";
import { FunnelSection } from "@/components/analytics/funnel-section";
import { DEMO_ANALYTICS, DEMO_FUNNEL, DEMO_INSIGHTS } from "./demo-data";
import { formatDuration } from "@/lib/utils";

type Range = "7d" | "14d" | "30d";

const RANGE_SCALE: Record<Range, number> = {
  "7d": 0.55,
  "14d": 1,
  "30d": 1.35,
};

export function DemoAnalyticsPanel({ compact = false }: { compact?: boolean }) {
  const [range, setRange] = React.useState<Range>("14d");
  const scale = RANGE_SCALE[range];

  const analytics = React.useMemo(() => {
    const slice =
      range === "7d" ? DEMO_ANALYTICS.responsesByDay.slice(-7) : DEMO_ANALYTICS.responsesByDay;
    return {
      ...DEMO_ANALYTICS,
      totalViews: Math.round(DEMO_ANALYTICS.totalViews * scale),
      totalStarts: Math.round(DEMO_ANALYTICS.totalStarts * scale),
      totalSubmissions: Math.round(DEMO_ANALYTICS.totalSubmissions * scale),
      responsesByDay: slice.map((d) => ({
        ...d,
        count: Math.max(1, Math.round(d.count * scale)),
      })),
    };
  }, [range, scale]);

  return (
    <div className={compact ? "p-4 sm:p-6" : "mx-auto max-w-6xl p-4 sm:p-6"}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Customer onboarding</p>
          <h3 className="text-lg font-semibold tracking-tight">Analytics</h3>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
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
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Submissions"
          value={analytics.totalSubmissions.toLocaleString()}
          icon={<Inbox className="h-3.5 w-3.5" />}
          accent
        />
        <MetricCard
          label="Completion"
          value={`${analytics.completionRate}%`}
          icon={<Check className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Avg. time"
          value={formatDuration(analytics.avgCompletionSeconds)}
          icon={<Clock className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Responses by day
          </p>
          <div className="mt-3">
            <ResponsesByDayChart data={analytics.responsesByDay} />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Step funnel
          </p>
          <div className="mt-4">
            <FunnelSection funnel={DEMO_FUNNEL} />
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Interaction insights
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <InsightCard
              label="Most focused field"
              value={DEMO_INSIGHTS.mostInteractedField?.label ?? "—"}
              hint={`${DEMO_INSIGHTS.mostInteractedField?.count ?? 0} interactions`}
            />
            <InsightCard
              label="Most errors"
              value={DEMO_INSIGHTS.mostErroredField?.label ?? "—"}
              hint={`${DEMO_INSIGHTS.mostErroredField?.count ?? 0} validation errors`}
            />
            <InsightCard
              label="Largest drop-off"
              value={
                DEMO_INSIGHTS.worstStep
                  ? `Step ${DEMO_INSIGHTS.worstStep.step}`
                  : "—"
              }
              hint={`${DEMO_INSIGHTS.worstStep?.dropOffs ?? 0} abandonments`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
