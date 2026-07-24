import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LogoMark } from "@/components/brand/logo";

type LandingHeaderProps = {
  session: boolean;
  dashboardHref: string;
};

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#testimonials", label: "Stories" },
  { href: "#cta", label: "Get started" },
];

export function LandingHeader({ session, dashboardHref }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="group">
          <LogoMark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {session ? (
            <Button asChild size="sm" className="shadow-md shadow-primary/15">
              <Link href={dashboardHref}>
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="shadow-md shadow-primary/15">
                <Link href="/signup">Get started free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
