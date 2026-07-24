import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export function AuthShowcase() {
  return (
    <div className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex">
      <Link href="/" className="w-fit">
        <LogoMark textClassName="text-background" />
      </Link>

      <blockquote className="max-w-md space-y-4">
        <p className="text-pretty text-2xl font-medium leading-snug tracking-tightish">
          &ldquo;FormForge replaced three tools in our stack. The builder is fast,
          the analytics actually answer questions, and our team ships forms in
          minutes.&rdquo;
        </p>
        <footer className="text-sm text-background/60">
          — Onboarding lead at a YC-backed SaaS
        </footer>
      </blockquote>

      <div />
    </div>
  );
}
