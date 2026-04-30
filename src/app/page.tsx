import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  GitBranch,
  Layers,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  const dashboardHref = session ? "/dashboard" : "/signup";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Boxes className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-medium tracking-tightish">
              FormForge
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#cta"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-1">
            {session ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="container relative pt-24 pb-20 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              The form builder built for modern SaaS
            </div>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Forms your users
              <br />
              actually finish.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              FormForge gives you a Typeform-grade builder, conditional logic,
              multi-step flows, and real-time analytics — all on top of your
              own database.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
              <Button asChild size="lg">
                <Link href={dashboardHref}>
                  {session ? "Go to dashboard" : "Start building free"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="#features">See features</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · Open standards · Self-host friendly
            </p>
          </div>

          <div className="relative mx-auto mt-20 max-w-5xl">
            <div className="rounded-2xl border border-border/70 bg-card shadow-md">
              <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="ml-3 text-xs text-muted-foreground">
                  formforge.app/dashboard
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
                <PreviewTile
                  title="Forms"
                  value="12"
                  delta="+3 this week"
                  icon={<Layers className="h-3.5 w-3.5" />}
                />
                <PreviewTile
                  title="Responses"
                  value="2,418"
                  delta="+184 today"
                  icon={<Zap className="h-3.5 w-3.5" />}
                />
                <PreviewTile
                  title="Completion rate"
                  value="74%"
                  delta="+6% vs last 7d"
                  icon={<BarChart3 className="h-3.5 w-3.5" />}
                />
              </div>
            </div>
            <div
              className="pointer-events-none absolute inset-x-12 -bottom-6 h-12 rounded-full bg-primary/15 blur-3xl"
              aria-hidden
            />
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border/60 bg-subtle/40 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Everything you need to ship a great form
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-pretty text-muted-foreground">
              All the building blocks of a modern form product — none of the
              bloat.
            </p>
          </div>
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Workflow className="h-4 w-4" />}
              title="Drag-and-drop builder"
              description="Reorder questions, edit inline, and preview live as you build."
            />
            <Feature
              icon={<GitBranch className="h-4 w-4" />}
              title="Conditional logic"
              description="Show, hide, and jump between steps based on previous answers."
            />
            <Feature
              icon={<Layers className="h-4 w-4" />}
              title="Multi-step flows"
              description="Break long forms into bite-sized steps with clean progress."
            />
            <Feature
              icon={<BarChart3 className="h-4 w-4" />}
              title="Real-time analytics"
              description="Views, starts, drop-off and per-question insights, included."
            />
            <Feature
              icon={<Zap className="h-4 w-4" />}
              title="Autosave"
              description="Never lose work. The builder autosaves with debounce."
            />
            <Feature
              icon={<Sparkles className="h-4 w-4" />}
              title="Beautiful public forms"
              description="Mobile-first, accessible, and styled to match your brand."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              From idea to insight in minutes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps. Zero ops overhead.
            </p>
          </div>
          <div className="mt-14 grid gap-3 md:grid-cols-3">
            <Step
              number="01"
              title="Build"
              description="Drag and drop fields, configure validation, and add logic."
            />
            <Step
              number="02"
              title="Publish"
              description="Get a shareable public link the moment you publish your form."
            />
            <Step
              number="03"
              title="Analyze"
              description="Watch responses pour in, track drop-off, and export to CSV."
            />
          </div>
        </div>
      </section>

      <section id="cta" className="border-t border-border/60 bg-subtle/40 py-24">
        <div className="container text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            Ship your next form today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
            Sign up for free, build your first form in under a minute, and get
            real analytics from day one.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={dashboardHref}>
                {session ? "Open dashboard" : "Create free account"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground text-background">
              <Boxes className="h-2.5 w-2.5" />
            </span>
            <span>FormForge © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border/60 bg-card p-6 transition-colors hover:bg-muted/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-medium tracking-tightish">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function PreviewTile({
  title,
  value,
  delta,
  icon,
}: {
  title: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background px-4 py-3.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{title}</span>
        <span>{icon}</span>
      </div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tightish">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-success">{delta}</div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="text-xs font-medium tabular-nums tracking-wider text-primary">
        {number}
      </div>
      <h3 className="mt-3 text-sm font-medium tracking-tightish">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
