"use client";

import Link from "next/link";
import { Activity, BarChart3, Eye, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Stats {
  totalForms: number;
  totalResponses: number;
  totalViews: number;
  conversionRate: number;
}

export function DashboardHome({
  stats,
  hasForms,
}: {
  stats: Stats;
  hasForms: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tightish">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview across your workspace. Pick a form from the sidebar to edit, or
          create a new one.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Forms"
          value={stats.totalForms.toLocaleString()}
        />
        <StatTile
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Responses"
          value={stats.totalResponses.toLocaleString()}
        />
        <StatTile
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Views"
          value={stats.totalViews.toLocaleString()}
        />
        <StatTile
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label="Conversion"
          value={`${stats.conversionRate}%`}
          accent
        />
      </div>

      {!hasForms && (
        <div className="mt-10 rounded-xl border border-dashed border-border/70 bg-card/50 px-6 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/70" />
          <h2 className="mt-4 text-sm font-medium">No forms yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first form to start collecting responses.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/dashboard/forms/new">
              <Plus className="h-4 w-4" />
              New form
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums tracking-tightish",
          accent && "text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}
