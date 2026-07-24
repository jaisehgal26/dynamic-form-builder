import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-subtle/30 py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          <div className="text-center sm:text-left">
            <LogoMark size="sm" className="justify-center sm:justify-start" />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              The modern form builder for teams who want beautiful UX and
              actionable analytics in one place.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} FormForge. All rights reserved.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div>
              <p className="font-medium">Product</p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>
                  <a href="#features" className="transition-colors hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition-colors hover:text-foreground">
                    How it works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Account</p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>
                  <Link href="/login" className="transition-colors hover:text-foreground">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="transition-colors hover:text-foreground">
                    Sign up
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
