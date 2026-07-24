import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import SignupForm from "./signup-form";

export const metadata: Metadata = createPageMetadata({
  title: "Sign up free",
  description:
    "Create your free FormForge account. Build dynamic forms with drag-and-drop, conditional logic, and analytics in minutes.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <AuthFormShell
      title="Create your account"
      description="Build your first form in under a minute."
    >
      <SignupForm />
    </AuthFormShell>
  );
}
