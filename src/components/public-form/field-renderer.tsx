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
      level === "h1" && "text-3xl font-semibold",
      level === "h3" && "text-base font-semibold",
      level === "h2" && "text-xl font-semibold",
    );
    return (
      <div className="py-2">
        {level === "h1" && <h1 className={headingClass}>{field.label}</h1>}
        {level === "h2" && <h2 className={headingClass}>{field.label}</h2>}
        {level === "h3" && <h3 className={headingClass}>{field.label}</h3>}
        {field.description && (
          <p className="mt-1 text-sm text-muted-foreground">
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
        className="block text-base font-medium leading-snug"
      >
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <FieldControl
        field={field}
        value={value}
        onChange={onChange}
        primaryColor={primaryColor}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
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
        />
      );
    case "single_choice": {
      const options = field.config.options ?? [];
      return (
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
        >
          {options.map((opt) => (
            <label
              key={opt.id}
              htmlFor={`${field.id}_${opt.id}`}
              className="flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
            >
              <RadioGroupItem id={`${field.id}_${opt.id}`} value={opt.value} />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
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
                className="flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  id={`${field.id}_${opt.id}`}
                  checked={checked}
                  onCheckedChange={(c) => {
                    if (c) onChange([...arr, opt.value]);
                    else onChange(arr.filter((v) => v !== opt.value));
                  }}
                />
                <span className="text-sm">{opt.label}</span>
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
          <SelectTrigger>
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
        <div className="flex items-center gap-1">
          {Array.from({ length: max }).map((_, i) => {
            const v = i + 1;
            const active = v <= current;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className="rounded p-1 transition-transform hover:scale-110"
                aria-label={`Rate ${v}`}
              >
                <Icon
                  className={cn(
                    "h-7 w-7",
                    active ? "fill-current" : "stroke-current",
                  )}
                  style={
                    active
                      ? { color: primaryColor ?? "#0a0a0a" }
                      : { color: "#a1a1aa" }
                  }
                />
              </button>
            );
          })}
        </div>
      );
    }
    case "nps": {
      const current = value === null || value === undefined ? null : Number(value);
      return (
        <div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 11 }).map((_, i) => {
              const active = current === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange(i)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted",
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
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          File upload is not enabled in this preview build.
        </div>
      );
    default:
      return null;
  }
}
