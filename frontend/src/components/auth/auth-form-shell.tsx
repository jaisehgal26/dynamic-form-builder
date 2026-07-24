import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

type AuthFormShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthFormShell({
  title,
  description,
  children,
}: AuthFormShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 sm:p-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex lg:hidden">
          <LogoMark />
        </Link>
        <div className="mb-8 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tightish">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
