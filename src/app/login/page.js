export const dynamic = "force-dynamic";
// src/app/login/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign In — Motorke Standard" };

export default async function LoginPage(props) {
  try {
    // Handle searchParams safely - might already be a plain object in some Next.js versions
    let searchParams = {};
    if (props.searchParams) {
      if (typeof props.searchParams.then === "function") {
        searchParams = await props.searchParams;
      } else {
        searchParams = props.searchParams;
      }
    }

    // Get session safely
    let session = null;
    try {
      session = await getSession();
    } catch (err) {
      console.error("Error fetching session:", err);
      // Continue without session info - they can still log in
    }

    // Redirect if already logged in
    const role = session?.user?.role;
    if (role) {
      if (role === "ADMIN") redirect("/admin");
      if (role === "DEALER") redirect("/portal");
      redirect("/");
    }

    const error = searchParams?.error || null;

    return (
      <div className="min-h-screen w-full bg-white">
        <LoginForm error={error} />
      </div>
    );
  } catch (error) {
    // If anything goes wrong, still show the login form
    console.error("Login page error:", error);
    return (
      <div className="min-h-screen w-full bg-white">
        <LoginForm error={null} />
      </div>
    );
  }
}
