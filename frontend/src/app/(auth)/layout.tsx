import Link from "next/link";
import { Boxes } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-foreground">
            <Boxes className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-medium tracking-tightish">
            FormForge
          </span>
        </Link>
        <div className="space-y-4">
          <p className="text-pretty text-2xl font-medium leading-snug tracking-tightish">
            "FormForge replaced three tools in our stack. The builder is fast,
            the analytics actually answer questions, and our team ships forms
            in minutes."
          </p>
          <p className="text-sm text-background/60">
            — Onboarding lead at a YC-backed SaaS
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium tracking-tightish lg:hidden"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Boxes className="h-3.5 w-3.5" />
            </span>
            FormForge
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
