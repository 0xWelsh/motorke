"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

function VerifyForm() {
  const sp = useSearchParams();
  const email = sp.get("email");

  const [emailOtp, setEmailOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, emailOtp })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || "Verification failed.");
        setLoading(false);
      } else if (data.success && data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      setErrorMsg("Network connection failed.");
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-white/40 mb-6">Invalid verification request. Missing credentials.</p>
        <Link href="/signup" className="text-black font-black tracking-widest uppercase text-[10px] hover:text-white transition-colors">
          Return to Signup
        </Link>
      </div>
    );
  }

  const inputCls = "w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-xl tracking-[0.2em] font-black text-center text-white outline-none focus:border-orange-500/50 focus:bg-surface transition-all placeholder:text-white/10";

  return (
    <>
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/20">
          <ShieldCheck size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">Verify Your Email</h1>
        <p className="text-sm font-bold text-white/40">We sent a 6-digit code to your email address.</p>
      </div>

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center text-black shadow-sm shrink-0 mt-0.5">
            <span className="text-[10px] font-black">!</span>
          </div>
          <p className="text-xs font-bold text-white leading-relaxed">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 ml-2">
             <Mail size={12} className="text-black" /> Email Code ({email})
           </div>
           <input required minLength={6} maxLength={6} placeholder="######"
             value={emailOtp} onChange={e => setEmailOtp(e.target.value)}
             className={inputCls} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-pureWhite rounded-2xl py-5 font-black text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] flex items-center justify-center gap-2 group mt-8">
          {loading ? (
             <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
          ) : (
             <>Confirm Security Code</>
          )}
        </button>
      </form>
    </>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[500px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-[420px] bg-surface/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-500">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-black" size={32} /></div>}>
           <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
