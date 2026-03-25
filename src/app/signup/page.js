// src/app/signup/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, ShieldCheck } from "lucide-react";

export const metadata = { title: "Create Account — Motorke Standard" };

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect("/");

  const error = sp.error;

  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Back to Home */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Showcase
      </Link>

      <div className="w-full max-w-[440px]">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
              Motor<span className="text-orange-600">ke</span>
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Join the Standard.</h1>
          <p className="text-slate-500 text-sm font-medium">Create your verified automotive profile today.</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 sm:p-10 shadow-sm">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-red-600 shadow-sm shrink-0 mt-0.5">
                <span className="text-[10px] font-black">!</span>
              </div>
              <p className="text-xs font-bold text-red-600 leading-relaxed">
                {error === "exists" && "An account with that email already exists."}
                {error === "mismatch" && "The passwords you entered do not match."}
                {error === "short" && "Password must be at least 8 characters long."}
                {error === "unknown" && "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          <form action="/api/auth/signup" method="POST" className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                name="name" 
                required 
                placeholder="John Kamau" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                name="email" 
                type="email" 
                required 
                placeholder="name@example.com" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input 
                  name="password" 
                  type="password" 
                  required 
                  minLength={8} 
                  placeholder="Min. 8 chars" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm</label>
                <input 
                  name="confirm" 
                  type="password" 
                  required 
                  minLength={8} 
                  placeholder="Repeat" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-orange-600 text-white rounded-2xl py-4 font-black text-sm tracking-wide transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-2 group mt-4"
            >
              Create Account <UserPlus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm font-medium text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-slate-900 font-black hover:text-orange-600 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Bank-Level Encryption</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter text-center max-w-xs">
            By creating an account, you agree to the Motorke Standard Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
