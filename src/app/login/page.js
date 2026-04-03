// src/app/login/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign In — Motorke Standard" };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  
  if (session) {
    if (session.user.role === "ADMIN")  redirect("/admin");
    if (session.user.role === "DEALER") redirect("/portal");
    redirect("/");
  }

  const error = sp.error;

  return (
    <div className="h-screen w-full bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-[#050505] to-[#050505] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <LoginForm error={error} />
    </div>
  );
}
