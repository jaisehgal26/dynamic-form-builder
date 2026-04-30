"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FieldRenderer } from "./field-renderer";
import type {
  FormFieldDef,
  PublicFormPayload,
} from "@/types/form";
import { groupFieldsByStep, isFieldVisible } from "@/lib/form-helpers";
import { cn } from "@/lib/utils";

interface PublicFormRendererProps {
  form: PublicFormPayload;
  preview?: boolean;
}

export function PublicFormRenderer({ form, preview }: PublicFormRendererProps) {
  const stepsMap = React.useMemo(
    () => groupFieldsByStep(form.fields),
    [form.fields],
  );
  const stepKeys = React.useMemo(
    () => Array.from(stepsMap.keys()).sort((a, b) => a - b),
    [stepsMap],
  );
  const useMultiStep = form.settings.multiStep && stepKeys.length > 1;

  const [stepIndex, setStepIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);
  const startTimeRef = React.useRef<number | null>(null);
  const eventSentRef = React.useRef<{ view?: boolean; steps: Set<number> }>({
    steps: new Set(),
  });

  const currentStep = useMultiStep ? stepKeys[stepIndex] : stepKeys[0] ?? 1;
  const currentFields = stepsMap.get(currentStep) ?? [];
  const visibleFields = currentFields.filter((f) => isFieldVisible(f, answers));
  const isLastStep = !useMultiStep || stepIndex === stepKeys.length - 1;
  const progress = useMultiStep
    ? Math.round(((stepIndex + 1) / stepKeys.length) * 100)
    : 0;

  React.useEffect(() => {
    if (preview) return;
    if (eventSentRef.current.view) return;
    eventSentRef.current.view = true;
    sendEvent(form.slug, { eventType: "view" });
  }, [preview, form.slug]);

  React.useEffect(() => {
    if (preview) return;
    if (eventSentRef.current.steps.has(currentStep)) return;
    eventSentRef.current.steps.add(currentStep);
    sendEvent(form.slug, { eventType: "step_view", step: currentStep });
  }, [preview, form.slug, currentStep]);

  const onValueChange = (fieldId: string, value: unknown) => {
    if (!preview && !startedRef.current) {
      startedRef.current = true;
      startTimeRef.current = Date.now();
      sendEvent(form.slug, {
        eventType: "start",
        metadata: collectClientMetadata(),
      });
    }
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: null }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string | null> = {};
    let valid = true;
    for (const f of visibleFields) {
      const err = validateField(f, answers[f.id]);
      newErrors[f.id] = err;
      if (err) valid = false;
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (isLastStep) {
      void handleSubmit();
    } else {
      setStepIndex((i) => Math.min(stepKeys.length - 1, i + 1));
    }
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleSubmit = async () => {
    if (preview) {
      setDone(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public/forms/${form.slug}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          startedAt: startTimeRef.current ?? Date.now(),
          metadata: collectClientMetadata(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setDone(true);
      if (form.settings.redirectUrl) {
        window.location.href = form.settings.redirectUrl;
      }
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit form",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <ThankYouScreen
        message={form.settings.thankYouMessage}
        primaryColor={form.theme.primaryColor}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-9",
      )}
      style={{ backgroundColor: form.theme.backgroundColor }}
    >
      {useMultiStep && form.settings.showProgressBar && (
        <div className="mb-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>
              Step {stepIndex + 1} of {stepKeys.length}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {stepIndex === 0 && (
        <div className="mb-7 space-y-2">
          <h1 className="text-balance text-2xl font-semibold tracking-tightish sm:text-3xl">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {form.description}
            </p>
          )}
        </div>
      )}

      <div
        key={currentStep}
        className="space-y-6 animate-fade-in"
      >
        {visibleFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This step has no visible fields.
          </p>
        ) : (
          visibleFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(v) => onValueChange(field.id, v)}
              error={errors[field.id]}
              primaryColor={form.theme.primaryColor}
            />
          ))
        )}
      </div>

      {submitError && (
        <p className="mt-4 text-sm text-destructive">{submitError}</p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 pt-1">
        {useMultiStep && stepIndex > 0 ? (
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={submitting}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button
          onClick={handleNext}
          disabled={submitting || form.fields.length === 0}
          size="lg"
          style={{
            backgroundColor: form.theme.primaryColor,
            color: "#fff",
          }}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLastStep ? (
            "Submit"
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ThankYouScreen({
  message,
  primaryColor,
}: {
  message: string;
  primaryColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-sm animate-scale-in">
      <div
        className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: primaryColor ?? "hsl(var(--primary))",
          color: "#fff",
        }}
      >
        <Check className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold tracking-tightish">Thanks!</h2>
      <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function validateField(field: FormFieldDef, value: unknown): string | null {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);
  if (field.required && isEmpty) {
    return field.validation.customMessage || "This field is required.";
  }
  if (isEmpty) return null;
  if (field.type === "email") {
    if (typeof value !== "string" || !/^\S+@\S+\.\S+$/.test(value)) {
      return field.validation.customMessage || "Enter a valid email.";
    }
  }
  if (
    field.type === "short_text" ||
    field.type === "long_text" ||
    field.type === "phone"
  ) {
    const str = typeof value === "string" ? value : String(value);
    if (
      field.validation.minLength &&
      str.length < field.validation.minLength
    ) {
      return (
        field.validation.customMessage ||
        `Minimum ${field.validation.minLength} characters.`
      );
    }
    if (
      field.validation.maxLength &&
      str.length > field.validation.maxLength
    ) {
      return (
        field.validation.customMessage ||
        `Maximum ${field.validation.maxLength} characters.`
      );
    }
    if (field.validation.pattern) {
      try {
        if (!new RegExp(field.validation.pattern).test(str)) {
          return (
            field.validation.patternMessage ||
            field.validation.customMessage ||
            "Doesn't match the required pattern."
          );
        }
      } catch {
        // ignore invalid regex
      }
    }
  }
  if (field.type === "number") {
    const n = Number(value);
    if (isNaN(n)) return "Enter a valid number.";
    if (field.validation.min !== undefined && n < field.validation.min) {
      return (
        field.validation.customMessage ||
        `Must be at least ${field.validation.min}.`
      );
    }
    if (field.validation.max !== undefined && n > field.validation.max) {
      return (
        field.validation.customMessage ||
        `Must be at most ${field.validation.max}.`
      );
    }
  }
  return null;
}

function collectClientMetadata() {
  if (typeof window === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    timezoneOffset: new Date().getTimezoneOffset(),
    locale: navigator.language,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  };
}

async function sendEvent(
  slug: string,
  body: { eventType: string; step?: number; metadata?: unknown },
) {
  try {
    await fetch(`/api/public/forms/${slug}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Silent fail; analytics are best-effort.
  }
}
