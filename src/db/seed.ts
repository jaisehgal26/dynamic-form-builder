import "dotenv/config";
import { db } from "./client";
import { formFields, forms, users } from "./schema";
import { hashPassword } from "@/lib/auth";
import { generateFieldId, generateFormSlug, generateId } from "@/lib/slug";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/types/form";

async function main() {
  console.log("Seeding…");

  const userId = generateId("user");
  const passwordHash = await hashPassword("password123");
  await db.insert(users).values({
    id: userId,
    name: "Demo User",
    email: "demo@formforge.app",
    passwordHash,
  });

  const formId = generateId("form");
  const now = new Date();
  await db.insert(forms).values({
    id: formId,
    userId,
    title: "Customer Feedback",
    description: "Help us understand what you love and what we can improve.",
    slug: generateFormSlug("Customer Feedback"),
    status: "published",
    schemaJson: "{}",
    themeJson: JSON.stringify(DEFAULT_THEME),
    settingsJson: JSON.stringify({
      ...DEFAULT_SETTINGS,
      multiStep: true,
      thankYouMessage: "Thanks for the feedback — we read every response.",
    }),
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  });

  const fields = [
    {
      id: generateFieldId(),
      type: "short_text",
      label: "What's your name?",
      required: true,
      step: 1,
      position: 0,
      placeholder: "Jane Doe",
    },
    {
      id: generateFieldId(),
      type: "email",
      label: "What's your email?",
      required: true,
      step: 1,
      position: 1,
    },
    {
      id: generateFieldId(),
      type: "rating",
      label: "How would you rate your experience?",
      required: true,
      step: 2,
      position: 2,
      config: { maxRating: 5, ratingIcon: "star" },
    },
    {
      id: generateFieldId(),
      type: "long_text",
      label: "What can we improve?",
      required: false,
      step: 2,
      position: 3,
      placeholder: "Tell us what you think…",
    },
  ];

  await db.insert(formFields).values(
    fields.map((f) => ({
      id: f.id,
      formId,
      type: f.type,
      label: f.label,
      description: null,
      placeholder: (f as { placeholder?: string }).placeholder ?? null,
      required: f.required,
      position: f.position,
      step: f.step,
      configJson: JSON.stringify((f as { config?: unknown }).config ?? {}),
      validationJson: "{}",
      logicJson: "[]",
      createdAt: now,
      updatedAt: now,
    })),
  );

  console.log("Seed complete.");
  console.log("Login as: demo@formforge.app / password123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
