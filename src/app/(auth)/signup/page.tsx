import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tightish">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Build your first form in under a minute.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
