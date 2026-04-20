// src/app/signup/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignupForm from "@/components/SignupForm";

export const metadata = { title: "Create Account — Motorke Premium" };

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin");
    if (session.user.role === "DEALER") redirect("/portal");
    redirect("/");
  }

  const error = sp.error;
  const role = sp.role;

  return (
    <div className="min-h-screen w-full bg-[#FCFCFD]">
      <SignupForm error={error} initialRole={role} />
    </div>
  );
}
