import { Suspense } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import LoginForm from "./login-form";

export const metadata: Metadata = createPageMetadata({
  title: "Log in",
  description:
    "Log in to FormForge to build dynamic forms, publish branded experiences, and track responses with real-time analytics.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <AuthFormShell
      title="Welcome back"
      description="Log in to continue building forms."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthFormShell>
  );
}
