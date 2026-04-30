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
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              FormForge
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#analytics"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Analytics
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="ml-1 h-4 w-4" />
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
        <div className="container relative pt-20 pb-24 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Production-ready form builder for modern SaaS
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
              Build forms your users
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
                {" "}
                actually finish.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              FormForge gives you a Typeform-grade builder, conditional logic,
              multi-step flows, and real-time analytics — all powered by your
              own data.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={dashboardHref}>
                  {session ? "Go to dashboard" : "Start building free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">See features</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · Open standards · Self-host friendly
            </p>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border bg-card shadow-2xl shadow-zinc-900/5">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="ml-2 text-xs text-muted-foreground">
                  formforge.app/dashboard
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                <PreviewCard
                  title="Forms"
                  value="12"
                  delta="+3 this week"
                  icon={<Layers className="h-4 w-4" />}
                />
                <PreviewCard
                  title="Responses"
                  value="2,418"
                  delta="+184 today"
                  icon={<Zap className="h-4 w-4" />}
                />
                <PreviewCard
                  title="Completion rate"
                  value="74%"
                  delta="+6% vs last 7d"
                  icon={<BarChart3 className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything you need to ship a great form
            </h2>
            <p className="mt-3 text-muted-foreground">
              All the building blocks of a modern form product, with none of
              the bloat.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Workflow className="h-5 w-5" />}
              title="Drag-and-drop builder"
              description="Reorder questions, edit inline, and preview live as you build."
            />
            <Feature
              icon={<GitBranch className="h-5 w-5" />}
              title="Conditional logic"
              description="Show, hide, and jump between steps based on previous answers."
            />
            <Feature
              icon={<Layers className="h-5 w-5" />}
              title="Multi-step flows"
              description="Break long forms into bite-sized steps with progress indicators."
            />
            <Feature
              icon={<BarChart3 className="h-5 w-5" />}
              title="Real-time analytics"
              description="Views, starts, drop-off and per-question insights out of the box."
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Autosave & versioning"
              description="Never lose work. Builder autosaves with debounce and dirty-state."
            />
            <Feature
              icon={<Sparkles className="h-5 w-5" />}
              title="Beautiful public forms"
              description="Mobile-first, accessible, and styled to match your brand."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              From idea to insight in minutes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps. Zero ops overhead.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Step number="1" title="Build" description="Drag and drop fields, configure validation, and add logic." />
            <Step number="2" title="Publish" description="Get a shareable public link the moment you publish your form." />
            <Step number="3" title="Analyze" description="Watch responses pour in, track drop-off, and export to CSV." />
          </div>
        </div>
      </section>

      <section id="analytics" className="border-t bg-muted/30 py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ship your next form today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sign up for free, build your first form in under a minute, and get
            real analytics from day one.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={dashboardHref}>
                {session ? "Open dashboard" : "Create free account"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            <span>FormForge © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
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
    <div className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PreviewCard({
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
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-emerald-600">{delta}</div>
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
    <div className="rounded-xl border bg-card p-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {number}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
