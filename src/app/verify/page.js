"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { Loader2, Mail, ShieldCheck, Copy, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

function VerifyForm() {
  const sp = useSearchParams();
  const email = sp.get("email");

  const [emailOtp, setEmailOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copied, setCopied] = useState(false);

  // Resend code cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    setResendLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Could not resend code right now.");
        setResendLoading(false);
        return;
      }

      setSuccessMsg(data.message || "A new verification code has been sent.");
      setResendCooldown(60);
      setResendLoading(false);
    } catch (err) {
      setErrorMsg("Network error while resending code. Please try again.");
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, emailOtp })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || "Verification failed. Please check the code and try again.");
        setLoading(false);
      } else if (data.success && data.redirect) {
        setSuccessMsg("✓ Email verified! Redirecting...");
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 1500);
      }
    } catch (err) {
      setErrorMsg("Network connection failed. Please try again.");
      setLoading(false);
    }
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!email) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-slate-500 mb-6 font-medium">Invalid verification request. Missing credentials.</p>
        <Link href="/signup" className="btn btn-primary btn-sm">
          Return to Signup
        </Link>
      </div>
    );
  }

  const inputCls = "w-full bg-slate-50 border-b-2 border-slate-300 rounded-none px-5 py-4 text-2xl sm:text-3xl tracking-[0.3em] font-black text-center text-slate-900 outline-none focus:border-[var(--accent)] transition-all placeholder:text-slate-400";

  return (
    <>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Setup Progress</p>
          <p className="text-xs font-bold text-slate-500">Step 2 of 2</p>
        </div>
        <div className="w-full bg-slate-200 rounded-none h-1.5 overflow-hidden">
          <div className="h-full bg-[var(--accent)] w-1/2 transition-all"></div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-5 sm:mb-6">
          <ShieldCheck size={32} className="text-[var(--accent)]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Verify Your Email</h1>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">We sent a 6-digit code to your email address</p>
      </div>

      {/* Email Display */}
      <div className="mb-8 p-4 bg-slate-50 shadow-sm rounded-xl">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Verification Email</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-black tracking-wide text-slate-900 break-all">{email}</p>
          <button
            type="button"
            onClick={copyEmailToClipboard}
            className="ml-2 p-2 hover:bg-slate-100 rounded-xl transition-colors"
            title="Copy email"
          >
            {copied ? (
              <Check size={18} className="text-[var(--accent)]" />
            ) : (
              <Copy size={18} className="text-slate-500 hover:text-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-6 p-4 bg-accent-wash rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="w-5 h-5 bg-[var(--accent)] rounded-full flex items-center justify-center text-white shrink-0 mt-0.5">
            <Check size={14} strokeWidth={3} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">{successMsg}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="w-5 h-5 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 shrink-0 mt-0.5">
            <AlertCircle size={14} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-3">
            <Mail size={14} /> Enter 6-Digit Code
          </label>
          <input 
            required 
            minLength={6} 
            maxLength={6} 
            pattern="[0-9]{6}"
            placeholder="000000"
            value={emailOtp} 
            onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
            className={inputCls}
            disabled={loading}
            autoComplete="one-time-code"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || emailOtp.length !== 6}
          className="w-full btn btn-primary btn-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> 
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Verify & Continue</span>
            </>
          )}
        </button>
      </form>

      {/* Resend Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center mb-4">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendCooldown > 0 || resendLoading}
          className="w-full btn btn-neutral btn-lg"
        >
          {resendLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : resendCooldown > 0 ? (
            `Resend Code in ${resendCooldown}s`
          ) : (
            "Resend Code"
          )}
        </button>
      </div>

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 pb-8">
        <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">Having issues?</p>
        <div className="space-y-2 text-xs font-medium text-slate-500">
          <p>• Check your spam/junk folder for the verification email</p>
          <p>• Enter only the 6-digit code (no spaces or dashes)</p>
          <p>• Code expires in 30 minutes</p>
        </div>
        <Link 
          href="/contact" 
          className="inline-block text-[10px] font-black tracking-widest uppercase text-[var(--accent)] hover:text-[var(--accent)] transition-colors mt-3"
        >
          Contact Support →
        </Link>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full bg-[var(--bg)] flex items-start sm:items-center justify-center p-0 sm:p-6 relative overflow-hidden">
      <div className="w-full max-w-md bg-white sm:border border-slate-200 rounded-xl p-6 sm:p-10 shadow-sm relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-500 min-h-screen sm:min-h-0">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-[var(--accent)] mb-4" size={40} />
            <p className="text-slate-500 font-medium">Loading verification...</p>
          </div>
        }>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
