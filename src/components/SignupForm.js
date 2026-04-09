"use client";
// src/components/SignupForm.js
import { useState } from "react";
import { UserPlus, Building2, User, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff, MapPin, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import LocationPicker from "./LocationPicker";
import Link from "next/link";
import Script from "next/script";
import HumanCheck from "./HumanCheck";

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos",
  "Kajiado","Muranga","Nyeri","Meru","Embu","Kilifi","Kwale","Laikipia","Other"
];

function PasswordMeter({ password }) {
  let score = 0;
  if (!password) score = 0;
  else {
    if (password.length > 7) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;
  }
  
  const segments = [
    score >= 1 ? (score < 3 ? "bg-rose-400" : (score === 3 ? "bg-amber-400" : "bg-emerald-500")) : "bg-slate-100",
    score >= 2 ? (score < 3 ? "bg-rose-400" : (score === 3 ? "bg-amber-400" : "bg-emerald-500")) : "bg-slate-100",
    score >= 3 ? (score === 3 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-100",
    score >= 4 ? "bg-emerald-500" : "bg-slate-100"
  ];
  
  let label = "Security Level";
  if (score === 0 && password) label = "Very Weak";
  else if (score === 1) label = "Weak";
  else if (score === 2) label = "Fair";
  else if (score === 3) label = "Good";
  else if (score === 4) label = "Strong";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1.5 h-1">
        {segments.map((bg, i) => (
          <div key={i} className={`flex-1 rounded-full ${bg} transition-all duration-500`} />
        ))}
      </div>
      <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] text-right">{label}</p>
    </div>
  );
}

export default function SignupForm({ error: initialError }) {
  const initialErrorMessage =
    initialError === "invalid"
      ? "Please fill all required fields correctly."
      : initialError === "exists"
        ? "An account with that email already exists."
        : initialError === "captcha"
          ? "Please complete the security check and try again."
          : initialError || "";

  const [role, setRole] = useState("BUYER");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMapPin, setShowMapPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialErrorMessage);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [website, setWebsite] = useState("");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "660578051558-vigoibi56aj4elh0r9gh4cvjtff9asee.apps.googleusercontent.com";
  const requiresHumanCheck = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const isValidEmail = email.includes("@") && email.includes(".");

  const handleAutoFillLocation = () => {
    alert("Location automatically filled using device Geolocation.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData(e.target);
    if (formData.get("password") !== formData.get("confirm")) {
       setErrorMsg("The passwords you entered do not match.");
       setLoading(false);
       return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || "An error occurred during registration.");
        setLoading(false);
      } else if (data.success && data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      setErrorMsg("Network connection failed. Please try again.");
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100";
  const labelCls = "text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] ml-1 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_14%,rgba(16,185,129,0.08),transparent_38%),radial-gradient(circle_at_84%_86%,rgba(15,23,42,0.08),transparent_40%),#FCFCFD]">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (!window.google || !googleClientId) return;
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            use_fedcm_for_prompt: false,
            callback: async (response) => {
              try {
                const res = await fetch("/api/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: response.credential, action: "signup" }),
                });
                const data = await res.json();
                if (data.success) {
                  window.location.href = data.destination || "/";
                } else {
                  setErrorMsg("Google signup failed.");
                }
              } catch (err) {
                setErrorMsg("Network error during Google signup.");
              }
            },
          });

          const googleSignupContainer = document.getElementById("google-signup-button");
          if (!googleSignupContainer) return;

          window.google.accounts.id.renderButton(googleSignupContainer, {
            theme: "outline",
            size: "large",
            width: "320",
            text: "signup_with",
            shape: "pill",
            logo_alignment: "left",
          });
        }}
      />

      <section className="h-dvh px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-center overflow-hidden">
        <div
          className={clsx(
            "w-full rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_56px_rgba(15,23,42,0.08)] p-4 sm:p-6 lg:p-7 relative",
            role === "DEALER" ? "max-w-5xl" : "max-w-[560px]"
          )}
        >
        <div className="max-h-[94dvh] overflow-y-auto">
          <Link
            href="/"
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-black transition-all hover:gap-4"
          >
            Showroom <ArrowLeft className="w-3 h-3 rotate-180" />
          </Link>

          <div className={clsx("w-full mx-auto transition-all duration-700 mt-8 sm:mt-6", role === "DEALER" ? "max-w-4xl" : "max-w-[440px]") }>
             <header className="mb-4">
                <div className="inline-flex items-center gap-3 mb-2.5">
                   <img src="/favicon.svg" alt="Motorke" className="h-10 w-10 object-contain rounded-xl" />
                   <div className="h-4 w-px bg-slate-200 mx-1" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Register</span>
                </div>
                <h1 className="text-3xl sm:text-[2rem] font-black text-slate-900 tracking-tighter mb-1.5">Create Account</h1>
                <p className="text-slate-700 font-medium text-xs sm:text-sm">Choose buyer or dealer and get started.</p>
             </header>

             <div className="flex w-full sm:w-fit p-1 bg-slate-100 rounded-2xl gap-1 mb-3">
                <button type="button" onClick={() => setRole("BUYER")}
                  className={clsx("flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                    role === "BUYER" ? "bg-white text-slate-950 shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-600")}>
                  <User size={14} /> Personal
                </button>
                <button type="button" onClick={() => setRole("DEALER")}
                  className={clsx("flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                    role === "DEALER" ? "bg-slate-950 text-white shadow-xl shadow-slate-900/20" : "text-slate-400 hover:text-slate-600")}>
                  <Building2 size={14} /> Dealership
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4 relative" id="signup-form">
                <input type="hidden" name="role" value={role} />
                <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {errorMsg && (
                   <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="w-7 h-7 bg-rose-200 rounded-lg flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                       <ShieldCheck size={14} />
                      </div>
                      <p className="text-[11px] font-bold text-rose-900 leading-tight flex items-center min-h-[32px]">{errorMsg}</p>
                   </div>
                )}

                 <div className={clsx("grid gap-x-8 gap-y-4 items-start transition-all", role === "DEALER" ? "md:grid-cols-2" : "grid-cols-1") }>
                   {/* Personal Info */}
                   <div className="space-y-4">
                     <div className="space-y-2">
                         <label htmlFor="regName" className={labelCls}>Identity Verification</label>
                       <div className="space-y-3">
                            <input id="regName" name="name" required placeholder="Full Legal Name" className={inputCls} />
                            <div className="relative">
                              <input id="regEmail" name="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email Address" className={clsx(inputCls, isValidEmail && "border-emerald-500", "pr-12")} />
                              {isValidEmail && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />}
                            </div>
                         </div>
                      </div>

                      {role === "DEALER" && (
                         <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <label htmlFor="dealerName" className={labelCls}>Business Entity</label>
                           <div className="space-y-3">
                               <input id="dealerName" name="dealerName" required placeholder="Registered Dealership Name" className={inputCls} />
                             <div className="grid grid-cols-2 gap-3">
                                  <input id="dealerPhone" name="phone" required placeholder="Business Phone" className={inputCls} />
                                  <input id="dealerWhatsapp" name="whatsapp" placeholder="WhatsApp (Optional)" className={inputCls} />
                               </div>
                             <textarea id="dealerDesc" name="description" rows={2} placeholder="Dealer Bio & Specialty..." className={clsx(inputCls, "resize-none")} />
                            </div>
                         </div>
                      )}

                        <div className="space-y-3 pt-3 border-t border-slate-100">
                         <label htmlFor="regPassword" className={labelCls}>Security Configuration</label>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="relative group">
                               <input 
                                 id="regPassword"
                                 name="password" 
                                 type={showPassword ? "text" : "password"}
                                 required minLength={8} placeholder="Password" 
                                 value={password} onChange={e => setPassword(e.target.value)}
                                 className={inputCls} 
                               />
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">
                                 <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                               </button>
                               <PasswordMeter password={password} />
                            </div>
                            <input id="regConfirm" name="confirm" type="password" required minLength={8} placeholder="Confirm" className={inputCls} />
                         </div>
                      </div>
                   </div>

                   {/* Dealer Details (Column 2) */}
                   {role === "DEALER" && (
                     <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-700">
                       <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label htmlFor="county" className={labelCls}>Geographic Coverage</label>
                              <button type="button" onClick={handleAutoFillLocation} className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-700 flex items-center gap-1"><MapPin size={12}/> Auto-fill</button>
                            </div>
                         <div className="grid grid-cols-2 gap-3">
                               <select id="county" name="county" required className={clsx(inputCls, "appearance-none")}>
                                 {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                               <input id="location" name="location" required placeholder="Primary Area (e.g. Kilimani)" className={inputCls} />
                            </div>
                            <input id="address" name="address" placeholder="Physical Business Address" className={inputCls} />
                         </div>
                         
                         <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className={labelCls}>Precise Mapping</label>
                              <button
                                type="button"
                                onClick={() => setShowMapPin((prev) => !prev)}
                                className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900"
                              >
                                {showMapPin ? "Hide Map" : "Pin on Map"}
                              </button>
                            </div>
                            {showMapPin && (
                              <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-100">
                                <LocationPicker />
                              </div>
                            )}
                         </div>
                      </div>
                   )}
                </div>

                <div className="pt-3 flex flex-col gap-3 border-t border-slate-100 mt-1">
                   <div className="w-full">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] ml-1 mb-1.5">Are You Human?</p>
                      <HumanCheck value={captchaToken} onChange={setCaptchaToken} />
                      <button type="submit" disabled={loading || (requiresHumanCheck && !captchaToken)}
                      className="mt-2 w-full bg-slate-950 hover:bg-black disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-black text-[10px] uppercase tracking-[0.25em] transition-all shadow-2xl shadow-slate-950/20 flex items-center justify-center gap-2.5 active:scale-[0.98]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus size={16} /> Sign Up</>}
                      </button>
                   </div>
                   <p className="text-[11px] font-bold text-slate-700 text-center leading-relaxed">
                     By proceeding, you agree to our <Link href="/terms" className="text-slate-900 border-b border-slate-950/10">Terms</Link> and <Link href="/privacy" className="text-slate-900 border-b border-slate-950/10">Privacy</Link>.
                   </p>
                </div>

                <div className="relative pt-0.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.25em]">
                    <span className="bg-white px-5 text-slate-600">Continue with Google</span>
                  </div>
                </div>

                <div className="flex justify-center w-full overflow-hidden">
                  <div id="google-signup-button" className="w-full max-w-[320px]" />
                </div>
             </form>

             <footer className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[440px]">
                <p className="text-sm font-bold text-slate-900">
                 Already have an account?{" "}
                   <Link href="/login" className="text-slate-900 hover:text-emerald-500 transition-colors border-b-2 border-slate-900/10 hover:border-emerald-500/10">Sign in to your portal</Link>
                </p>
             </footer>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
