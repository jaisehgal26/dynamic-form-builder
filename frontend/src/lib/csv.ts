import type { FormFieldDef } from "@/types/form";
import type { ResponseAnswers } from "@/types/response";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (Array.isArray(value)) str = value.join("; ");
  else if (typeof value === "object") str = JSON.stringify(value);
  else str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvResponseRow {
  id: string;
  submittedAt: number;
  startedAt: number | null;
  completionTimeSeconds: number | null;
  answers: ResponseAnswers;
}

export function responsesToCsv(
  fields: FormFieldDef[],
  rows: CsvResponseRow[],
): string {
  const inputFields = fields.filter(
    (f) => f.type !== "section_heading" && f.type !== "page_break",
  );

  const header = [
    "Response ID",
    "Submitted At",
    "Started At",
    "Completion Time (s)",
    ...inputFields.map((f) => f.label),
  ];

  const lines = [header.map(csvEscape).join(",")];

  for (const row of rows) {
    const values = [
      row.id,
      new Date(row.submittedAt).toISOString(),
      row.startedAt ? new Date(row.startedAt).toISOString() : "",
      row.completionTimeSeconds ?? "",
      ...inputFields.map((f) => row.answers[f.id]),
    ];
    lines.push(values.map(csvEscape).join(","));
  }

  return lines.join("\n");
}
