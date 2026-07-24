import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type LandingCtaProps = {
  session: boolean;
  dashboardHref: string;
};

export function LandingCta({ session, dashboardHref }: LandingCtaProps) {
  return (
    <section id="cta" className="py-24 sm:py-28">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-chart-4/10 px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-chart-4/15 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to build your next form?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
              Join teams using FormForge to capture better responses, faster.
              Your first form is minutes away.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 shadow-lg shadow-primary/20">
                <Link href={dashboardHref}>
                  {session ? "Go to dashboard" : "Create your free account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!session && (
                <Button asChild size="lg" variant="outline" className="h-11 px-6">
                  <Link href="/login">I already have an account</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
