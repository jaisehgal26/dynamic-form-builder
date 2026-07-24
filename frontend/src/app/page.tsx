import { getSession } from "@/lib/auth";
import { createPageMetadata, landingJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingSteps } from "@/components/landing/landing-steps";
import { LandingTestimonials } from "@/components/landing/landing-testimonials";

export const metadata = createPageMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
});

export default async function LandingPage() {
  const session = await getSession();
  const dashboardHref = session ? "/dashboard" : "/signup";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={landingJsonLd()} />
      <LandingHeader session={!!session} dashboardHref={dashboardHref} />
      <main>
        <LandingHero session={!!session} dashboardHref={dashboardHref} />
        <LandingFeatures />
        <LandingSteps />
        <LandingTestimonials />
        <LandingCta session={!!session} dashboardHref={dashboardHref} />
      </main>
      <LandingFooter />
    </div>
  );
}
