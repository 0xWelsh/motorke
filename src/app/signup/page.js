import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignupForm from "@/components/SignupForm";

export const metadata = { title: "Create Account | BIDGARI" };

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin");
    redirect("/");
  }

  const error = sp.error;

  return <SignupForm error={error} />;
}
