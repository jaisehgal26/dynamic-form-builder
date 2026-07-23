import { Clock, Lock } from "lucide-react";

interface ClosedScreenProps {
  title?: string;
  message?: string;
  variant?: "expired" | "limit_reached" | "not_found";
}

export function ClosedScreen({
  title,
  message,
  variant = "expired",
}: ClosedScreenProps) {
  const display = {
    expired: {
      icon: <Clock className="h-5 w-5" />,
      defaultTitle: "This form has expired",
      defaultMessage:
        "The form is no longer accepting responses. Please reach out to the owner if you need help.",
    },
    limit_reached: {
      icon: <Clock className="h-5 w-5" />,
      defaultTitle: "Submissions are closed",
      defaultMessage:
        "This form has reached its submission limit and is no longer accepting responses.",
    },
    not_found: {
      icon: <Lock className="h-5 w-5" />,
      defaultTitle: "Form not found",
      defaultMessage:
        "This form is not published, has been deleted, or never existed.",
    },
  }[variant];

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {display.icon}
      </div>
      <h1 className="text-xl font-semibold tracking-tightish">
        {title || display.defaultTitle}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
        {message || display.defaultMessage}
      </p>
    </div>
  );
}
