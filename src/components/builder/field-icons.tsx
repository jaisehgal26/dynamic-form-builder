import {
  AlignLeft,
  AtSign,
  Calendar,
  ChevronDownSquare,
  CircleDot,
  FileUp,
  Hash,
  Heading2,
  ListChecks,
  Minus,
  Phone,
  Star,
  Type,
  Gauge,
} from "lucide-react";
import type { FieldType } from "@/types/form";

export function FieldIcon({
  type,
  className,
}: {
  type: FieldType;
  className?: string;
}) {
  const Icon = ICONS[type] ?? Type;
  return <Icon className={className ?? "h-4 w-4"} />;
}

const ICONS: Record<FieldType, React.ComponentType<{ className?: string }>> = {
  short_text: Type,
  long_text: AlignLeft,
  email: AtSign,
  phone: Phone,
  number: Hash,
  date: Calendar,
  single_choice: CircleDot,
  multiple_choice: ListChecks,
  dropdown: ChevronDownSquare,
  rating: Star,
  nps: Gauge,
  file_upload: FileUp,
  section_heading: Heading2,
  page_break: Minus,
};
