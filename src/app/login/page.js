// src/app/login/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign In — Motorke Standard" };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  const role = session?.user?.role;
  
  if (role) {
    if (role === "ADMIN")  redirect("/admin");
    if (role === "DEALER") redirect("/portal");
    redirect("/");
  }

  const error = sp.error;

  return (
    <div className="min-h-screen w-full bg-[#FCFCFD]">
      <LoginForm error={error} />
    </div>
  );
}
