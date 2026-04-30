"use client";

import * as React from "react";
import { Heart, Star, ThumbsUp } from "lucide-react";
import type { FormFieldDef } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FieldRendererProps {
  field: FormFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string | null;
  primaryColor?: string;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  primaryColor,
}: FieldRendererProps) {
  if (field.type === "section_heading") {
    const level = field.config.headingLevel ?? "h2";
    const headingClass = cn(
      "tracking-tightish",
      level === "h1" && "text-3xl font-semibold",
      level === "h3" && "text-base font-semibold",
      level === "h2" && "text-xl font-semibold",
    );
    return (
      <div className="space-y-1 pt-2">
        {level === "h1" && <h1 className={headingClass}>{field.label}</h1>}
        {level === "h2" && <h2 className={headingClass}>{field.label}</h2>}
        {level === "h3" && <h3 className={headingClass}>{field.label}</h3>}
        {field.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {field.description}
          </p>
        )}
      </div>
    );
  }

  if (field.type === "page_break") {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor={field.id}
        className="block text-base font-medium leading-snug tracking-tightish"
      >
        {field.label}
        {field.required && (
          <span className="ml-1 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {field.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {field.description}
        </p>
      )}
      <FieldControl
        field={field}
        value={value}
        onChange={onChange}
        primaryColor={primaryColor}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  primaryColor,
}: {
  field: FormFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  primaryColor?: string;
}) {
  switch (field.type) {
    case "short_text":
    case "email":
    case "phone":
      return (
        <Input
          id={field.id}
          type={
            field.type === "email"
              ? "email"
              : field.type === "phone"
              ? "tel"
              : "text"
          }
          inputMode={field.type === "phone" ? "tel" : undefined}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          required={field.required}
          className="h-11 text-base"
        />
      );
    case "long_text":
      return (
        <Textarea
          id={field.id}
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          required={field.required}
          className="text-base"
        />
      );
    case "number":
      return (
        <Input
          id={field.id}
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          required={field.required}
          className="h-11 text-base"
        />
      );
    case "date":
      return (
        <Input
          id={field.id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="h-11 text-base"
        />
      );
    case "single_choice": {
      const options = field.config.options ?? [];
      const current = (value as string) ?? "";
      return (
        <RadioGroup
          value={current}
          onValueChange={(v) => onChange(v)}
          className="gap-2"
        >
          {options.map((opt) => {
            const checked = current === opt.value;
            return (
              <label
                key={opt.id}
                htmlFor={`${field.id}_${opt.id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border bg-background p-3.5 text-sm transition-all",
                  checked
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/70 hover:border-border hover:bg-muted/50",
                )}
              >
                <RadioGroupItem
                  id={`${field.id}_${opt.id}`}
                  value={opt.value}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </RadioGroup>
      );
    }
    case "multiple_choice": {
      const options = field.config.options ?? [];
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {options.map((opt) => {
            const checked = arr.includes(opt.value);
            return (
              <label
                key={opt.id}
                htmlFor={`${field.id}_${opt.id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border bg-background p-3.5 text-sm transition-all",
                  checked
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/70 hover:border-border hover:bg-muted/50",
                )}
              >
                <Checkbox
                  id={`${field.id}_${opt.id}`}
                  checked={checked}
                  onCheckedChange={(c) => {
                    if (c) onChange([...arr, opt.value]);
                    else onChange(arr.filter((v) => v !== opt.value));
                  }}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "dropdown": {
      const options = field.config.options ?? [];
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className="h-11 text-base">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "rating": {
      const max = field.config.maxRating ?? 5;
      const current = Number(value ?? 0);
      const Icon =
        field.config.ratingIcon === "heart"
          ? Heart
          : field.config.ratingIcon === "thumb"
          ? ThumbsUp
          : Star;
      return (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: max }).map((_, i) => {
            const v = i + 1;
            const active = v <= current;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className="rounded-md p-1 transition-transform duration-150 ease-smooth hover:scale-110 active:scale-95"
                aria-label={`Rate ${v}`}
              >
                <Icon
                  className={cn(
                    "h-7 w-7 transition-colors",
                    active ? "fill-current" : "stroke-current",
                  )}
                  style={
                    active
                      ? { color: primaryColor ?? "hsl(var(--primary))" }
                      : { color: "hsl(var(--muted-foreground) / 0.5)" }
                  }
                />
              </button>
            );
          })}
        </div>
      );
    }
    case "nps": {
      const current =
        value === null || value === undefined ? null : Number(value);
      return (
        <div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 11 }).map((_, i) => {
              const active = current === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange(i)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-all duration-150 ease-smooth",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/70 bg-background text-foreground hover:border-border hover:bg-muted",
                  )}
                  style={
                    active && primaryColor
                      ? {
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                          color: "#fff",
                        }
                      : undefined
                  }
                >
                  {i}
                </button>
              );
            })}
          </div>
          {(field.config.npsLabels?.low || field.config.npsLabels?.high) && (
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{field.config.npsLabels?.low}</span>
              <span>{field.config.npsLabels?.high}</span>
            </div>
          )}
        </div>
      );
    }
    case "file_upload":
      return (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          File upload is not enabled in this preview build.
        </div>
      );
    default:
      return null;
  }
}
