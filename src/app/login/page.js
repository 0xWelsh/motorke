// src/app/login/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Login — Motorke" };

export default async function LoginPage({ searchParams }) {
  const session = await getSession();
  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/portal");
  }

  const error = searchParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-black">
            Motor<span className="text-[#f97316]">ke</span>
          </a>
          <p className="text-white/40 text-sm mt-2">Dealer & Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-black mb-6">Sign in</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              {error === "invalid" && "Invalid email or password."}
              {error === "inactive" && "Your account has been deactivated. Contact support."}
              {error === "unknown" && "Something went wrong. Please try again."}
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@dealership.co.ke"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold py-3 rounded-xl transition-colors text-sm mt-2"
            >
              Sign in →
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Don't have an account?{" "}
          <a href="mailto:admin@motorke.co.ke" className="text-white/40 hover:text-white transition-colors">
            Contact Motorke admin
          </a>
        </p>
      </div>
    </div>
  );
}
