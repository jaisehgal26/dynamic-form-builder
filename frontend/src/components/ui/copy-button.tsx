"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  size?: "sm" | "default" | "icon" | "icon-sm";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  label?: string;
}

export function CopyButton({
  value,
  size = "icon-sm",
  variant = "outline",
  className,
  label,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleCopy}
      className={cn(className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label && <span>{label}</span>}
    </Button>
  );
}
