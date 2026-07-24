import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingDemoApp } from "@/components/landing/demo/landing-demo-app";

type LandingHeroProps = {
  session: boolean;
  dashboardHref: string;
};

const stats = [
  { label: "Avg. completion rate", value: "74%" },
  { label: "Forms published", value: "12k+" },
  { label: "Response time", value: "<50ms" },
];

export function LandingHero({ session, dashboardHref }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)]"
        aria-hidden
      />

      <div className="container relative pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="outline"
            className="animate-fade-in gap-1.5 rounded-full border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            Built for SaaS teams who care about conversion
          </Badge>

          <h1 className="mt-8 animate-slide-up text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Beautiful forms that{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-chart-4 bg-clip-text text-transparent">
              convert
            </span>
            <br className="hidden sm:block" />
            {" "}and insights you can act on
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg [animation-delay:60ms]">
            FormForge combines a Typeform-grade builder, branching logic, and
            real-time analytics — so you can launch polished forms in minutes
            and understand every drop-off.
          </p>

          <div className="mt-10 flex animate-slide-up flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:120ms]">
            <Button asChild size="lg" className="h-11 px-6 shadow-lg shadow-primary/20">
              <Link href={dashboardHref}>
                {session ? "Open dashboard" : "Start building — it's free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <Link href="#features">Explore features</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card · Publish in under 60 seconds · Export anytime
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl animate-scale-in sm:mt-20 [animation-delay:180ms]">
          <div
            className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-2xl"
            aria-hidden
          />
          <LandingDemoApp />
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-6 border-t border-border/60 pt-10 sm:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
