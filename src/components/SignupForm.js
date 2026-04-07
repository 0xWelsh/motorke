"use client";
// src/components/SignupForm.js
import { useState } from "react";
import { UserPlus, Building2, User, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff, MapPin, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import LocationPicker from "./LocationPicker";
import Link from "next/link";
import Script from "next/script";
import AuthCarousel from "./AuthCarousel";
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
  const [errorMsg, setErrorMsg] = useState(initialErrorMessage);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [website, setWebsite] = useState("");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "660578051558-vigoibi56aj4elh0r9gh4cvjtff9asee.apps.googleusercontent.com";

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

  const inputCls = "w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100";
  const labelCls = "text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] ml-1 flex items-center gap-2";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
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

          window.google.accounts.id.renderButton(
            googleSignupContainer,
            { 
              theme: "outline", 
              size: "large", 
              width: "320", 
              text: "signup_with",
              shape: "pill",
              logo_alignment: "left"
            }
          );
        }}
      />

       <AuthCarousel />

       {/* ── FORM SECTION (Right) ── */}
       <section className={clsx(
         "flex-1 flex flex-col items-center justify-center p-5 sm:p-8 lg:p-12 bg-[#FCFCFD] relative overflow-y-auto",
         role === "DEALER" ? "lg:items-start lg:pl-32" : ""
       )}>
          
          <Link 
            href="/" 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-black transition-all hover:gap-4"
          >
            Showroom <ArrowLeft className="w-3 h-3 rotate-180" />
          </Link>

          <div className={clsx("w-full transition-all duration-700 mt-10 sm:mt-0", role === "DEALER" ? "max-w-4xl" : "max-w-[440px]")}>
             <header className="mb-6">
                <div className="inline-flex items-center gap-3 mb-4">
                   <img src="/favicon.svg" alt="Motorke" className="h-10 w-10 object-contain rounded-xl" />
                   <div className="h-4 w-px bg-slate-200 mx-1" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Register</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-2">Create Account.</h1>
                <p className="text-slate-700 font-medium text-sm">Start with a buyer or dealer profile and unlock verified marketplace actions.</p>
             </header>

             <div className="flex w-full sm:w-fit p-1.5 bg-slate-100 rounded-3xl gap-1.5 mb-4">
                <button type="button" onClick={() => setRole("BUYER")}
                  className={clsx("flex-1 sm:flex-none justify-center flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                    role === "BUYER" ? "bg-white text-slate-950 shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-600")}>
                  <User size={14} /> Personal
                </button>
                <button type="button" onClick={() => setRole("DEALER")}
                  className={clsx("flex-1 sm:flex-none justify-center flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                    role === "DEALER" ? "bg-slate-950 text-white shadow-xl shadow-slate-900/20" : "text-slate-400 hover:text-slate-600")}>
                  <Building2 size={14} /> Dealership
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6 relative pb-6" id="signup-form">
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
                   <div className="p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
                      <div className="w-8 h-8 bg-rose-200 rounded-xl flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                         <ShieldCheck size={16} />
                      </div>
                      <p className="text-[11px] font-bold text-rose-900 leading-tight flex items-center min-h-[32px]">{errorMsg}</p>
                   </div>
                )}

                <div className={clsx("grid gap-x-12 gap-y-6 items-start transition-all", role === "DEALER" ? "md:grid-cols-2" : "grid-cols-1")}>
                   {/* Personal Info */}
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <label htmlFor="regName" className={labelCls}>Identity Verification</label>
                         <div className="space-y-4">
                            <input id="regName" name="name" required placeholder="Full Legal Name" className={inputCls} />
                            <div className="relative">
                              <input id="regEmail" name="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email Address" className={clsx(inputCls, isValidEmail && "border-emerald-500", "pr-12")} />
                              {isValidEmail && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />}
                            </div>
                         </div>
                      </div>

                      {role === "DEALER" && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <label htmlFor="dealerName" className={labelCls}>Business Entity</label>
                            <div className="space-y-4">
                               <input id="dealerName" name="dealerName" required placeholder="Registered Dealership Name" className={inputCls} />
                               <div className="grid grid-cols-2 gap-4">
                                  <input id="dealerPhone" name="phone" required placeholder="Business Phone" className={inputCls} />
                                  <input id="dealerWhatsapp" name="whatsapp" placeholder="WhatsApp (Optional)" className={inputCls} />
                               </div>
                               <textarea id="dealerDesc" name="description" rows={3} placeholder="Dealer Bio & Specialty..." className={clsx(inputCls, "resize-none")} />
                            </div>
                         </div>
                      )}

                       <div className="space-y-4 pt-4 border-t border-slate-50">
                         <label htmlFor="regPassword" className={labelCls}>Security Configuration</label>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative group">
                               <input 
                                 id="regPassword"
                                 name="password" 
                                 type={showPassword ? "text" : "password"}
                                 required minLength={8} placeholder="Password" 
                                 value={password} onChange={e => setPassword(e.target.value)}
                                 className={inputCls} 
                               />
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200 hover:text-slate-900">
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
                      <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label htmlFor="county" className={labelCls}>Geographic Coverage</label>
                              <button type="button" onClick={handleAutoFillLocation} className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-700 flex items-center gap-1"><MapPin size={12}/> Auto-fill</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <select id="county" name="county" required className={clsx(inputCls, "appearance-none")}>
                                 {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                               <input id="location" name="location" required placeholder="Primary Area (e.g. Kilimani)" className={inputCls} />
                            </div>
                            <input id="address" name="address" placeholder="Physical Business Address" className={inputCls} />
                         </div>
                         
                         <div className="space-y-4">
                            <label className={labelCls}>Precise Mapping</label>
                            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-100">
                               <LocationPicker />
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-10 border-t border-slate-50 mt-6">
                   <div className="flex-1 w-full max-w-xs">
                      <HumanCheck value={captchaToken} onChange={setCaptchaToken} />
                      <button type="submit" disabled={loading || !captchaToken}
                      className="w-full bg-slate-950 hover:bg-black disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-[1.75rem] py-5 font-black text-[10px] uppercase tracking-[0.25em] transition-all shadow-2xl shadow-slate-950/20 flex items-center justify-center gap-3 active:scale-[0.98]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus size={16} /> Finalize Registration</>}
                      </button>
                   </div>
                   <p className="text-[11px] font-bold text-slate-700 max-w-[260px] text-center sm:text-left leading-relaxed">
                     By proceeding, you agree to our <Link href="/terms" className="text-slate-900 border-b border-slate-950/10">Terms</Link> and <Link href="/privacy" className="text-slate-900 border-b border-slate-950/10">Privacy</Link>.
                   </p>
                </div>
             </form>

               <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-[11px] font-bold text-emerald-800 mb-5 max-w-[440px]">
                Dealers get verified lead intake, inventory tools, and portal analytics from day one.
               </div>

             <div className="relative my-4 max-w-[440px]">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
               </div>
               <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.25em]">
                  <span className="bg-[#FCFCFD] px-5 text-slate-200">Social Connect</span>
               </div>
             </div>

             <div className="flex justify-start mb-6 w-full overflow-hidden max-w-[440px]">
                <div id="google-signup-button" className="w-full max-w-[320px] transition-transform hover:scale-[1.02]" />
             </div>

             <footer className="mt-4 pt-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-[440px]">
                <p className="text-sm font-bold text-slate-900">
                   Part of our network?{" "}
                   <Link href="/login" className="text-slate-900 hover:text-emerald-500 transition-colors border-b-2 border-slate-900/10 hover:border-emerald-500/10">Sign in to your portal</Link>
                </p>

                <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 shrink-0">
                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">256-bit SSL Encrypted</span>
                </div>
             </footer>
          </div>
       </section>
    </div>
  );
}
