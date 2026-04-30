import Link from "next/link";
import { Boxes } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-zinc-950 p-10 text-zinc-100 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
            <Boxes className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold">FormForge</span>
        </Link>
        <div className="hidden lg:block">
          <p className="text-2xl font-medium leading-snug">
            "FormForge replaced three tools in our stack. The builder is fast,
            the analytics actually answer questions, and our team ships forms
            in minutes."
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            — Onboarding lead at a YC-backed SaaS
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
