"use client";

import * as React from "react";
import {
  Eye,
  Lock,
  CalendarClock,
  CheckCircle2,
  Mail,
  PaintBucket,
  Settings as SettingsIcon,
  Hash,
} from "lucide-react";
import { useBuilderStore } from "@/stores/use-builder-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SettingsPanel() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <SectionCard
        icon={<SettingsIcon className="h-3.5 w-3.5" />}
        title="General"
        description="Basic behavior of your form."
      >
        <GeneralSection />
      </SectionCard>

      <SectionCard
        icon={<Lock className="h-3.5 w-3.5" />}
        title="Access"
        description="Who can view and submit this form."
      >
        <AccessSection />
      </SectionCard>

      <SectionCard
        icon={<Hash className="h-3.5 w-3.5" />}
        title="Submission"
        description="What happens when someone submits."
      >
        <SubmissionSection />
      </SectionCard>

      <SectionCard
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        title="After submit"
        description="Customize the post-submission experience."
      >
        <AfterSubmitSection />
      </SectionCard>

      <SectionCard
        icon={<PaintBucket className="h-3.5 w-3.5" />}
        title="Appearance"
        description="Brand colors used on the public form."
      >
        <AppearanceSection />
      </SectionCard>
    </div>
  );
}

function GeneralSection() {
  const settings = useBuilderStore((s) => s.settings);
  const updateSettings = useBuilderStore((s) => s.updateSettings);

  return (
    <div className="space-y-3">
      <SettingRow
        label="Multi-step form"
        description="Break the form into multiple pages."
      >
        <Switch
          checked={settings.multiStep}
          onCheckedChange={(v) => updateSettings({ multiStep: !!v })}
        />
      </SettingRow>
      <SettingRow
        label="Show progress bar"
        description="Display step progress to respondents."
      >
        <Switch
          checked={settings.showProgressBar}
          onCheckedChange={(v) => updateSettings({ showProgressBar: !!v })}
        />
      </SettingRow>
      <SettingRow
        label="Show question numbers"
        description="Display Question 1, 2, 3… above each field."
      >
        <Switch
          checked={!!settings.showQuestionNumbers}
          onCheckedChange={(v) =>
            updateSettings({ showQuestionNumbers: !!v })
          }
        />
      </SettingRow>
    </div>
  );
}

function AccessSection() {
  const access = useBuilderStore((s) => s.access);
  const updateAccess = useBuilderStore((s) => s.updateAccess);
  const [pwInput, setPwInput] = React.useState("");

  const expiryDate = access.expiresAt
    ? new Date(access.expiresAt).toISOString().slice(0, 16)
    : "";

  return (
    <div className="space-y-3">
      <SettingRow
        label="Password protect"
        description="Require a password before viewing or submitting."
      >
        <Switch
          checked={access.hasPassword || !!access.password}
          onCheckedChange={(v) => {
            if (v) {
              updateAccess({ clearPassword: false });
            } else {
              updateAccess({
                password: null,
                clearPassword: true,
                hasPassword: false,
              });
              setPwInput("");
            }
          }}
        />
      </SettingRow>

      {(access.hasPassword || !!access.password) && (
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-background px-3.5 py-3">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            {access.hasPassword
              ? "Update password (leave blank to keep current)"
              : "Set password (min. 4 characters)"}
          </Label>
          <Input
            type="password"
            value={pwInput}
            placeholder={access.hasPassword ? "••••••" : "Enter a password"}
            onChange={(e) => {
              setPwInput(e.target.value);
              updateAccess({
                password: e.target.value || null,
                clearPassword: false,
              });
            }}
          />
        </div>
      )}

      <SettingRow
        label="Set an expiry date"
        description="Form stops accepting responses after this time."
      >
        <Switch
          checked={!!access.expiresAt}
          onCheckedChange={(v) =>
            updateAccess({
              expiresAt: v ? Date.now() + 7 * 24 * 60 * 60 * 1000 : null,
            })
          }
        />
      </SettingRow>
      {!!access.expiresAt && (
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-background px-3.5 py-3">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            Closes at (your local time)
          </Label>
          <Input
            type="datetime-local"
            value={expiryDate}
            onChange={(e) => {
              const v = e.target.value
                ? new Date(e.target.value).getTime()
                : null;
              updateAccess({ expiresAt: v });
            }}
          />
        </div>
      )}

      <SettingRow
        label="Limit total responses"
        description="Stop accepting responses after a maximum is reached."
      >
        <Switch
          checked={!!access.responseLimit}
          onCheckedChange={(v) =>
            updateAccess({ responseLimit: v ? 100 : null })
          }
        />
      </SettingRow>
      {!!access.responseLimit && (
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-background px-3.5 py-3">
          <Label className="text-xs text-muted-foreground">
            Maximum responses
          </Label>
          <Input
            type="number"
            min={1}
            value={access.responseLimit ?? ""}
            onChange={(e) =>
              updateAccess({
                responseLimit: e.target.value
                  ? Math.max(1, Number(e.target.value))
                  : null,
              })
            }
          />
        </div>
      )}
    </div>
  );
}

function SubmissionSection() {
  const access = useBuilderStore((s) => s.access);
  const updateAccess = useBuilderStore((s) => s.updateAccess);
  const settings = useBuilderStore((s) => s.settings);
  const updateSettings = useBuilderStore((s) => s.updateSettings);

  return (
    <div className="space-y-3">
      <SettingRow
        label="Collect respondent email"
        description="Add an email field automatically before submit."
      >
        <Switch
          checked={!!access.collectEmail}
          onCheckedChange={(v) => updateAccess({ collectEmail: !!v })}
        />
      </SettingRow>
      <SettingRow
        label="Allow multiple submissions"
        description="Let the same person submit more than once."
      >
        <Switch
          checked={settings.allowMultipleSubmissions}
          onCheckedChange={(v) =>
            updateSettings({ allowMultipleSubmissions: !!v })
          }
        />
      </SettingRow>
      <div className="space-y-1.5">
        <Label className="text-sm">Submit button text</Label>
        <Input
          placeholder="Submit"
          value={settings.submitButtonText ?? ""}
          onChange={(e) =>
            updateSettings({ submitButtonText: e.target.value || undefined })
          }
        />
      </div>
    </div>
  );
}

function AfterSubmitSection() {
  const settings = useBuilderStore((s) => s.settings);
  const updateSettings = useBuilderStore((s) => s.updateSettings);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm">Thank-you message</Label>
        <Textarea
          value={settings.thankYouMessage}
          onChange={(e) =>
            updateSettings({ thankYouMessage: e.target.value })
          }
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Redirect URL (optional)</Label>
        <Input
          placeholder="https://example.com/thanks"
          value={settings.redirectUrl ?? ""}
          onChange={(e) =>
            updateSettings({ redirectUrl: e.target.value || undefined })
          }
        />
        <p className="text-xs text-muted-foreground">
          Send respondents here after submitting. Leave blank to show the
          thank-you message.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Closed-form message</Label>
        <Textarea
          value={settings.closedMessage ?? ""}
          onChange={(e) =>
            updateSettings({ closedMessage: e.target.value || undefined })
          }
          rows={2}
          placeholder="Shown when the form is expired or has reached its response limit."
        />
      </div>
    </div>
  );
}

function AppearanceSection() {
  const theme = useBuilderStore((s) => s.theme);
  const updateTheme = useBuilderStore((s) => s.updateTheme);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-sm">Primary color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.primaryColor}
            onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background"
          />
          <Input
            value={theme.primaryColor}
            onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Background</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.backgroundColor}
            onChange={(e) =>
              updateTheme({ backgroundColor: e.target.value })
            }
            className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background"
          />
          <Input
            value={theme.backgroundColor}
            onChange={(e) =>
              updateTheme({ backgroundColor: e.target.value })
            }
            className="font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-6 shadow-xs">
      <div className="mb-5 flex items-center gap-2">
        {icon && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-sm font-medium tracking-tightish">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background px-3.5 py-2.5",
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </div>
      </div>
      {children}
    </div>
  );
}
