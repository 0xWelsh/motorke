// src/app/signup/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import SignupForm from "@/components/SignupForm";

export const metadata = { title: "Create Account — Motorke Standard" };

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect("/");

  const error = sp.error;

  return (
    <div className="min-h-screen w-full bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-[#050505] to-[#050505] flex flex-col items-center justify-center py-20 px-6 overflow-y-auto relative">
      {/* Back to Home */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Showcase
      </Link>

      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="Motorke" className="h-8 w-auto object-contain brightness-0 invert" />
            <div className="h-4 w-px bg-white/10 mx-1" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Standard</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Join the Standard.</h1>
          <p className="text-white/50 text-sm font-medium">Create your verified automotive profile today.</p>
        </div>

        {/* Signup Card */}
        <div className="bg-surface/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-2xl">
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 shadow-sm shrink-0 mt-0.5">
                <span className="text-[10px] font-black">!</span>
              </div>
              <p className="text-xs font-bold text-red-400 leading-relaxed">
                {error === "exists" && "An account with that email already exists."}
                {error === "mismatch" && "The passwords you entered do not match."}
                {error === "short" && "Password must be at least 8 characters long."}
                {error === "unknown" && "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          <SignupForm />

          <div className="mt-10 pt-8 border-t border-white/5 text-center w-full max-w-md mx-auto">
            <p className="text-sm font-medium text-white/50">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-black hover:text-orange-500 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-white/5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Secure Bank-Level Encryption</span>
          </div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter text-center max-w-xs">
            By creating an account, you agree to the Motorke Standard Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
