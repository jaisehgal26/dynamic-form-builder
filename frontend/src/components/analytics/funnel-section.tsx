"use client";

import * as React from "react";
import type { FunnelSummary } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface FunnelSectionProps {
  funnel: FunnelSummary;
}

export function FunnelSection({ funnel }: FunnelSectionProps) {
  if (funnel.steps.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Funnel data appears once respondents start moving between steps.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {funnel.steps.map((s, i) => (
        <div key={s.step}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Step {s.step}</span>
            <span className="tabular-nums">
              <span className="font-medium text-foreground">
                {s.views.toLocaleString()}
              </span>
              <span className="ml-1 text-muted-foreground">views</span>
              <span className="ml-2 text-muted-foreground">
                · {s.retention}% retention
              </span>
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300 ease-smooth",
                i === 0
                  ? "bg-primary"
                  : "bg-primary/70",
              )}
              style={{ width: `${Math.max(2, s.retention)}%` }}
            />
          </div>
          {i > 0 && s.dropFromPrev > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <span
                className={cn(
                  "tabular-nums",
                  s.dropFromPrev >= 50 && "text-destructive",
                )}
              >
                ▾ {s.dropFromPrev}% drop from step {s.step - 1}
              </span>
            </div>
          )}
        </div>
      ))}
      {funnel.worstStep != null && (
        <p className="pt-1 text-[11px] text-muted-foreground">
          Largest drop happens at <strong>step {funnel.worstStep}</strong> —
          consider shortening or simplifying it.
        </p>
      )}
    </div>
  );
}
