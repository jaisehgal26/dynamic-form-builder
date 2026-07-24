"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Layers,
  Lock,
  Palette,
  Sparkles,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeatureDemo } from "@/components/landing/demo/feature-demos";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
};

const features: Feature[] = [
  {
    icon: Workflow,
    title: "Drag-and-drop builder",
    description:
      "Reorder questions, edit inline, and preview changes instantly — no refresh required.",
    tag: "Builder",
  },
  {
    icon: GitBranch,
    title: "Conditional logic",
    description: "Branch, skip, and show fields based on any previous answer.",
    tag: "Logic",
  },
  {
    icon: Layers,
    title: "Multi-step flows",
    description: "Break long forms into steps with a clean progress indicator.",
    tag: "Flows",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    description:
      "Funnel views, per-question drop-off, and completion trends out of the box.",
    tag: "Analytics",
  },
  {
    icon: Zap,
    title: "Autosave",
    description: "Every edit is saved automatically. Never lose your work.",
    tag: "Reliability",
  },
  {
    icon: Palette,
    title: "On-brand public forms",
    description: "Mobile-first, accessible forms that feel native to your product.",
    tag: "Design",
  },
  {
    icon: Lock,
    title: "Password protection",
    description: "Gate sensitive forms with optional password access.",
    tag: "Security",
  },
  {
    icon: Sparkles,
    title: "CSV export",
    description: "Download responses anytime — your data stays yours.",
    tag: "Export",
  },
];

const ROTATE_MS = 5500;

export function LandingFeatures() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive((index + features.length) % features.length);
  }, []);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % features.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const feature = features[active];
  const Icon = feature.icon;

  return (
    <section
      id="features"
      className="relative overflow-hidden border-t border-border/60 bg-subtle/50 py-24 sm:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent_60%)]"
        aria-hidden
      />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to ship forms users love
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
            From first draft to published form to actionable insights — without
            duct-taping five different tools together.
          </p>
        </div>

        <div className="mt-14 lg:grid lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-8 lg:items-stretch">
          <div className="hidden lg:flex lg:flex-col lg:gap-2">
            {features.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-300",
                  index === active
                    ? "border-primary/30 bg-primary/10 shadow-sm shadow-primary/5"
                    : "border-transparent bg-card/40 hover:border-border/60 hover:bg-card/80",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 transition-colors",
                    index === active
                      ? "bg-primary/15 text-primary ring-primary/20"
                      : "bg-muted text-muted-foreground ring-border/60 group-hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium tracking-tightish">
                    {item.title}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl" aria-hidden />

            <article className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl shadow-primary/5 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {feature.tag}
                  </span>
                  <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                    {active + 1} / {features.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={prev}
                    aria-label="Previous feature"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={next}
                    aria-label="Next feature"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-b border-border/60 px-4 py-3 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                      {feature.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:line-clamp-1 sm:text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[380px] bg-muted/15 p-3 sm:min-h-[420px] sm:p-4">
                <FeatureDemo index={active} />
              </div>

              <div className="border-t border-border/60 px-4 py-3 sm:px-5">
                <div className="flex gap-1">
                  {features.map((_, index) => (
                    <button
                      key={features[index].title}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`Show ${features[index].title}`}
                      className="group relative h-1 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300",
                          index < active && "w-full opacity-40",
                          index > active && "w-0",
                          index === active &&
                            (paused
                              ? "w-full"
                              : "animate-feature-progress w-full"),
                        )}
                        style={
                          index === active && !paused
                            ? { animationDuration: `${ROTATE_MS}ms` }
                            : undefined
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {features.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => goTo(index)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    index === active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/60 bg-card text-muted-foreground",
                  )}
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-16 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-subtle/50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-subtle/50 to-transparent" />
          <div className="flex animate-marquee gap-4 whitespace-nowrap">
            {[...features, ...features].map((item, index) => (
              <span
                key={`${item.title}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
              >
                <item.icon className="h-3.5 w-3.5 text-primary" />
                {item.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
