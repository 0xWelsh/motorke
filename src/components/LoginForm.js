"use client";

import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import Script from "next/script";

export default function LoginForm({ error }) {
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
            type="button"
            onClick={() => {
              if (typeof window === 'undefined') return;
              const client = window.google?.accounts?.id;
              if (!client) return;
              
              client.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "660578051558-vigoibi56aj4elh0r9gh4cvjtff9asee.apps.googleusercontent.com",
                use_fedcm_for_prompt: false,
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
            className="w-full bg-white text-black hover:bg-white/90 rounded-2xl py-4 font-black text-sm tracking-wide transition-all flex items-center justify-center gap-3 group shadow-xl"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 overflow-visible">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.82z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
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
