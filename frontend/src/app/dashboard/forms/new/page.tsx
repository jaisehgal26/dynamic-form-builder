import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { serverFetchJson } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { form } = await serverFetchJson<{ form: { id: string } }>("/api/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Untitled form" }),
  });

  redirect(`/dashboard/forms/${form.id}/builder`);
}
