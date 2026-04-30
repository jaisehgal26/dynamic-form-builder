"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordGateProps {
  slug: string;
  title: string;
  description?: string | null;
  primaryColor?: string;
}

export function PasswordGate({
  slug,
  title,
  description,
  primaryColor,
}: PasswordGateProps) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/public/forms/${slug}/verify-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect password.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Incorrect password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tightish">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {description ||
            "This form is password-protected. Enter the password to continue."}
        </p>
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="form-password">Password</Label>
          <Input
            id="form-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            placeholder="Enter password"
            className="h-11 text-base"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={loading || !password}
          className="w-full"
          size="lg"
          style={
            primaryColor
              ? { backgroundColor: primaryColor, color: "#fff" }
              : undefined
          }
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </Button>
      </form>
    </div>
  );
}
