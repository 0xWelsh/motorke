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
      // For now, guide users to request a new signup email
      setSuccessMsg("To request a new code, please sign up again with your email address.");
      setResendCooldown(60);
      setResendLoading(false);
    } catch (err) {
      setErrorMsg("Please go back to signup to request a new code.");
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
        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-slate-600 mb-6 font-medium">Invalid verification request. Missing credentials.</p>
        <Link href="/signup" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all">
          Return to Signup
        </Link>
      </div>
    );
  }

  const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 sm:py-4 text-2xl sm:text-3xl tracking-[0.3em] font-black text-center text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-slate-300";

  return (
    <>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Setup Progress</p>
          <p className="text-xs font-bold text-slate-600">Step 2 of 2</p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 w-1/2 transition-all"></div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg shadow-orange-500/30">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">Verify Your Email</h1>
        <p className="text-sm text-slate-600 font-medium">We sent a 6-digit code to your email address</p>
      </div>

      {/* Email Display */}
      <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Verification Email</p>
        <div className="flex items-center justify-between">
          <p className="text-sm sm:text-base font-semibold text-slate-900 break-all">{email}</p>
          <button
            type="button"
            onClick={copyEmailToClipboard}
            className="ml-2 p-2 hover:bg-slate-200 rounded-lg transition-colors"
            title="Copy email"
          >
            {copied ? (
              <Check size={18} className="text-green-600" />
            ) : (
              <Copy size={18} className="text-slate-400 hover:text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5">
            <Check size={14} strokeWidth={3} />
          </div>
          <p className="text-sm font-semibold text-green-700">{successMsg}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center text-red-600 shrink-0 mt-0.5">
            <AlertCircle size={14} />
          </div>
          <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 mb-3">
            <Mail size={14} className="text-orange-600" /> Enter 6-Digit Code
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
          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3.5 sm:py-4 font-bold text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-xl hover:shadow-orange-600/30 flex items-center justify-center gap-2 group"
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
        <p className="text-xs text-slate-600 text-center mb-4">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendCooldown > 0 || resendLoading}
          className="w-full px-4 py-3 text-sm font-bold uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-200 rounded-xl transition-all"
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
      <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Having issues?</p>
        <div className="space-y-2 text-xs text-slate-600">
          <p>• Check your spam/junk folder for the verification email</p>
          <p>• Enter only the 6-digit code (no spaces or dashes)</p>
          <p>• Code expires in 10 minutes</p>
        </div>
        <Link 
          href="/contact" 
          className="inline-block text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wide mt-3"
        >
          Contact Support →
        </Link>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-20 -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-20 -z-10" />
      
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-900/5 relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-500">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-orange-600 mb-4" size={40} />
            <p className="text-slate-600 font-medium">Loading verification...</p>
          </div>
        }>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
