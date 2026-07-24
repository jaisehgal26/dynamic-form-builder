"use client";

import * as React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  size?: "icon-sm" | "icon";
  className?: string;
  align?: "start" | "center" | "end";
}

const OPTIONS: {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSegmentedToggle({
  className,
  showLabels = true,
}: {
  className?: string;
  showLabels?: boolean;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn("flex rounded-lg bg-muted/80 p-1 ring-1 ring-border/50", className)}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {showLabels && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggle({
  size = "icon-sm",
  className,
  align = "end",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          aria-label="Toggle theme"
          className={cn("text-muted-foreground hover:text-foreground", className)}
        >
          <Sun
            className={cn(
              "transition-all",
              resolvedTheme === "dark" && "rotate-90 scale-0",
            )}
          />
          <Moon
            className={cn(
              "absolute transition-all",
              resolvedTheme === "light" && "-rotate-90 scale-0",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="w-36">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="gap-2"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="flex-1">{opt.label}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
