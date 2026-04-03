// src/app/login/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Chrome } from "lucide-react";
import Script from "next/script";

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
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="beforeInteractive"
      />
      {/* Back to Home */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Showcase
      </Link>

      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="text-2xl font-black text-white tracking-tighter uppercase">
              Motor<span className="text-orange-500">ke</span>
            </span>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Standard</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back.</h1>
          <p className="text-white/50 text-sm font-medium">Access your personalized automotive dashboard.</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-2xl">
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 shadow-sm shrink-0 mt-0.5">
                <span className="text-[10px] font-black">!</span>
              </div>
              <p className="text-xs font-bold text-red-400 leading-relaxed">
                {error === "invalid" && "The email or password you entered is incorrect."}
                {error === "inactive" && "This account has been deactivated. Please contact support."}
                {error === "unknown" && "An unexpected error occurred. Please try again."}
              </p>
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                name="email" 
                type="email" 
                required 
                autoComplete="off" 
                placeholder="name@example.com" 
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-white/20 focus:bg-surface transition-all placeholder:text-white/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Password</label>
                <Link href="#" className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-colors">Forgot?</Link>
              </div>
              <input 
                name="password" 
                type="password" 
                required 
                autoComplete="new-password"
                placeholder="••••••••" 
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-white/20 focus:bg-surface transition-all placeholder:text-white/20"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-white/10 hover:bg-orange-600 text-pureWhite rounded-2xl py-4 font-black text-sm tracking-wide transition-all hover:shadow-[0_0_15px_rgba(234,88,12,0.4)] flex items-center justify-center gap-2 group"
            >
              Sign In <Lock className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-surface px-4 text-white/20">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={() => {
              if (typeof window === 'undefined') return;
              const client = window.google?.accounts?.id;
              if (!client) return;
              
              client.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your_google_client_id_here.apps.googleusercontent.com",
                callback: async (response) => {
                  try {
                    const res = await fetch("/api/auth/google", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token: response.credential }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      window.location.href = data.destination || "/";
                    } else {
                      window.location.href = "/login?error=unknown";
                    }
                  } catch (err) {
                    window.location.href = "/login?error=unknown";
                  }
                },
              });
              client.prompt();
            }}
            className="w-full bg-white text-black hover:bg-white/90 rounded-2xl py-4 font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 group shadow-xl"
          >
            <Chrome className="w-4 h-4" /> Sign in with Google
          </button>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-sm font-medium text-white/50">
              New to the standard?{" "}
              <Link href="/signup" className="text-white font-black hover:text-orange-500 transition-colors">Create account</Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-white/5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Secure Bank-Level Encryption</span>
          </div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">
            Dealership Portal? <Link href="/login" className="text-white/40 hover:text-white transition-colors">Login here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
