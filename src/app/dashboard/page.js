// src/app/dashboard/page.js
// Redirects logged-in users to the right portal.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  redirect("/portal");
}
