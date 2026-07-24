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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  /** Use app card surface (dark/light) instead of form theme background. */
  inheritSurface?: boolean;
}

const HIDDEN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "userId",
];

const SESSION_KEY = "ff-session-id";

function readSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Replace {{name}}-style tokens with values from query params (or empty). */
function interpolate(text: string, params: URLSearchParams): string {
  if (!text || !text.includes("{{")) return text;
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const v = params.get(key);
    return v ? v : "";
  });
}

function buildInitialAnswers(
  fields: FormFieldDef[],
  params: URLSearchParams,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "section_heading" || f.type === "page_break") continue;
    const candidates = [
      f.id,
      // by exact label slug
      f.label?.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    ].filter(Boolean) as string[];
    for (const key of candidates) {
      const v = params.get(key);
      if (v !== null) {
        if (f.type === "multiple_choice") {
          out[f.id] = v.split(",").map((s) => s.trim()).filter(Boolean);
        } else if (f.type === "number" || f.type === "rating" || f.type === "nps") {
          const n = Number(v);
          if (!isNaN(n)) out[f.id] = n;
        } else {
          out[f.id] = v;
        }
        break;
      }
    }
  }
  return out;
}

function collectHidden(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of HIDDEN_PARAMS) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

export function PublicFormRenderer({ form, preview, inheritSurface }: PublicFormRendererProps) {
  const params = React.useMemo<URLSearchParams>(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  // Personalised title/description via {{name}} tokens
  const title = React.useMemo(
    () => interpolate(form.title, params),
    [form.title, params],
  );
  const description = React.useMemo(
    () => (form.description ? interpolate(form.description, params) : null),
    [form.description, params],
  );

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
  const [answers, setAnswers] = React.useState<Record<string, unknown>>(() =>
    buildInitialAnswers(form.fields, params),
  );
  const [respondentEmail, setRespondentEmail] = React.useState<string>(
    () => params.get("email") || "",
  );
  const hidden = React.useMemo(() => collectHidden(params), [params]);

  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);
  const startTimeRef = React.useRef<number | null>(null);
  const eventSentRef = React.useRef<{ view?: boolean; steps: Set<number> }>({
    steps: new Set(),
  });
  const sessionIdRef = React.useRef<string>("");

  const currentStep = useMultiStep ? stepKeys[stepIndex] : stepKeys[0] ?? 1;
  const currentFields = stepsMap.get(currentStep) ?? [];
  const visibleFields = currentFields.filter((f) => isFieldVisible(f, answers));
  const isLastStep = !useMultiStep || stepIndex === stepKeys.length - 1;
  const progress = useMultiStep
    ? Math.round(((stepIndex + 1) / stepKeys.length) * 100)
    : 0;

  // Question numbering — only for input fields and based on order
  const numbering = React.useMemo(() => {
    if (!form.settings.showQuestionNumbers) return new Map<string, number>();
    const m = new Map<string, number>();
    let n = 0;
    for (const f of form.fields) {
      if (f.type === "section_heading" || f.type === "page_break") continue;
      n++;
      m.set(f.id, n);
    }
    return m;
  }, [form.fields, form.settings.showQuestionNumbers]);

  React.useEffect(() => {
    if (!preview && typeof window !== "undefined") {
      sessionIdRef.current = readSessionId();
    }
  }, [preview]);

  React.useEffect(() => {
    if (preview) return;
    if (eventSentRef.current.view) return;
    eventSentRef.current.view = true;
    sendEvent(form.slug, {
      eventType: "view",
      sessionId: sessionIdRef.current,
    });
  }, [preview, form.slug]);

  React.useEffect(() => {
    if (preview) return;
    if (eventSentRef.current.steps.has(currentStep)) return;
    eventSentRef.current.steps.add(currentStep);
    sendEvent(form.slug, {
      eventType: "step_view",
      step: currentStep,
      sessionId: sessionIdRef.current,
    });
  }, [preview, form.slug, currentStep]);

  // Best-effort drop-off tracking on unload
  React.useEffect(() => {
    if (preview) return;
    const onUnload = () => {
      if (done) return;
      if (!startedRef.current) return;
      sendEvent(form.slug, {
        eventType: "drop_off",
        step: currentStep,
        sessionId: sessionIdRef.current,
      });
    };
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, [preview, form.slug, currentStep, done]);

  const onValueChange = (fieldId: string, value: unknown) => {
    if (!preview && !startedRef.current) {
      startedRef.current = true;
      startTimeRef.current = Date.now();
      sendEvent(form.slug, {
        eventType: "start",
        sessionId: sessionIdRef.current,
        metadata: collectClientMetadata(),
      });
    }
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: null }));
    if (!preview) {
      sendEvent(form.slug, {
        eventType: "field_change",
        step: currentStep,
        fieldId,
        sessionId: sessionIdRef.current,
      });
    }
  };

  const onFieldFocus = (fieldId: string) => {
    if (preview) return;
    sendEvent(form.slug, {
      eventType: "field_focus",
      step: currentStep,
      fieldId,
      sessionId: sessionIdRef.current,
    });
  };
  const onFieldBlur = (fieldId: string) => {
    if (preview) return;
    sendEvent(form.slug, {
      eventType: "field_blur",
      step: currentStep,
      fieldId,
      sessionId: sessionIdRef.current,
    });
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string | null> = {};
    let valid = true;
    for (const f of visibleFields) {
      const err = validateField(f, answers[f.id]);
      newErrors[f.id] = err;
      if (err) {
        valid = false;
        if (!preview) {
          sendEvent(form.slug, {
            eventType: "field_error",
            step: currentStep,
            fieldId: f.id,
            sessionId: sessionIdRef.current,
            metadata: { message: err },
          });
        }
      }
    }
    if (form.collectEmail && isLastStep) {
      if (!respondentEmail || !/^\S+@\S+\.\S+$/.test(respondentEmail)) {
        newErrors["__email"] = "Enter a valid email.";
        valid = false;
      } else {
        newErrors["__email"] = null;
      }
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    // Honor "go_to_step" or "end_form" logic on visible fields
    for (const f of visibleFields) {
      for (const rule of f.logic ?? []) {
        if (rule.action !== "go_to_step" && rule.action !== "end_form") continue;
        if (!matchRule(rule, answers)) continue;
        if (rule.action === "end_form") {
          void handleSubmit();
          return;
        }
        if (rule.action === "go_to_step" && rule.targetStep) {
          const idx = stepKeys.indexOf(rule.targetStep);
          if (idx >= 0) {
            setStepIndex(idx);
            return;
          }
        }
      }
    }

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
          sessionId: sessionIdRef.current,
          hidden,
          respondentEmail: form.collectEmail ? respondentEmail : undefined,
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

  const submitText = form.settings.submitButtonText || "Submit";

  return (
    <div
      className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-9"
      style={
        inheritSurface
          ? undefined
          : { backgroundColor: form.theme.backgroundColor }
      }
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
            {title}
          </h1>
          {description && (
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      <div key={currentStep} className="space-y-6 animate-fade-in">
        {visibleFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This step has no visible fields.
          </p>
        ) : (
          visibleFields.map((field) => (
            <div key={field.id} className="space-y-1">
              {numbering.has(field.id) && field.type !== "section_heading" && (
                <div className="text-[11px] font-medium tabular-nums tracking-wider text-muted-foreground/70">
                  Question {numbering.get(field.id)}
                </div>
              )}
              <FieldRenderer
                field={field}
                value={answers[field.id]}
                onChange={(v) => onValueChange(field.id, v)}
                onFocus={() => onFieldFocus(field.id)}
                onBlur={() => onFieldBlur(field.id)}
                error={errors[field.id]}
                primaryColor={form.theme.primaryColor}
              />
            </div>
          ))
        )}

        {form.collectEmail && isLastStep && (
          <div className="space-y-2">
            <Label htmlFor="ff-respondent-email" className="text-base font-medium">
              Your email
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We'll use this only to follow up on your response.
            </p>
            <Input
              id="ff-respondent-email"
              type="email"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 text-base"
              required
            />
            {errors["__email"] && (
              <p className="text-sm text-destructive">{errors["__email"]}</p>
            )}
          </div>
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
            submitText
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

function matchRule(
  rule: import("@/types/form").LogicRule,
  answers: Record<string, unknown>,
): boolean {
  const value = answers[rule.sourceFieldId];
  switch (rule.operator) {
    case "is_empty":
      return (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    case "is_not_empty":
      return !(
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    case "equals":
      if (Array.isArray(value)) return value.includes(rule.value as string);
      return String(value ?? "") === String(rule.value ?? "");
    case "not_equals":
      if (Array.isArray(value)) return !value.includes(rule.value as string);
      return String(value ?? "") !== String(rule.value ?? "");
    case "contains":
      if (Array.isArray(value)) return value.includes(rule.value as string);
      return String(value ?? "").includes(String(rule.value ?? ""));
    case "not_contains":
      if (Array.isArray(value)) return !value.includes(rule.value as string);
      return !String(value ?? "").includes(String(rule.value ?? ""));
    case "greater_than":
      return Number(value) > Number(rule.value);
    case "less_than":
      return Number(value) < Number(rule.value);
    default:
      return false;
  }
}

function validateField(
  field: FormFieldDef,
  value: unknown,
): string | null {
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
  body: {
    eventType: string;
    step?: number;
    fieldId?: string;
    sessionId?: string;
    metadata?: unknown;
  },
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
