"use client";
// src/components/SignupForm.js
import { useState } from "react";
import { UserPlus, Building2, User, Loader2, ArrowLeft, ShieldCheck, ChevronRight, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import LocationPicker from "./LocationPicker";
import Link from "next/link";
import Image from "next/image";

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
      <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] text-right">{label}</p>
    </div>
  );
}

export default function SignupForm({ error: initialError }) {
  const [role, setRole] = useState("BUYER");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError || "");
  const [loading, setLoading] = useState(false);

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

  const inputCls = "w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-black outline-none focus:border-emerald-500 transition-all placeholder:text-white shadow-sm shadow-slate-100";
  const labelCls = "text-[10px] font-black text-white uppercase tracking-[0.25em] ml-1";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
       {/* ── VISUAL SECTION (Left) ── */}
       <section className="hidden lg:flex lg:w-[40%] xl:w-[45%] relative items-end p-20 overflow-hidden bg-slate-900">
          <Image 
            src="/auth_hero.png" 
            alt="Premium Car" 
            fill 
            priority
            className="object-cover opacity-90 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          
          <div className="relative z-10 max-w-sm">
             <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Verified Network</span>
             </div>
             <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.95] mb-8">
                Join the<br />
                <span className="text-black">Elite Fleet.</span>
            </h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed">
               Start your journey with the country's most trusted automotive network.
            </p>
          </div>
       </section>

       {/* ── FORM SECTION (Right) ── */}
       <section className={clsx(
         "flex-1 flex flex-col items-center justify-center p-8 sm:p-20 bg-[#FCFCFD] relative overflow-y-auto",
         role === "DEALER" ? "lg:items-start lg:pl-32" : ""
       )}>
          
          <Link 
            href="/" 
            className="absolute top-10 right-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-black transition-all hover:gap-4"
          >
            Showroom <ArrowLeft className="w-3 h-3 rotate-180" />
          </Link>

          <div className={clsx("w-full transition-all duration-700", role === "DEALER" ? "max-w-4xl" : "max-w-[440px]")}>
             {/* Logo & Header */}
             <header className="mb-12">
                <div className="inline-flex items-center gap-3 mb-8">
                   <img src="/logo.png" alt="Motorske" className="h-10 w-auto object-contain" />
                   <div className="h-4 w-px bg-slate-200 mx-1" />
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Register</span>
                </div>
                <h1 className="text-4xl font-black text-black tracking-tighter mb-3">Create Account.</h1>
                <p className="text-white font-medium text-sm">Select your profile type to get started.</p>
             </header>

             {/* Role Switcher */}
             <div className="flex p-1.5 bg-slate-100 rounded-3xl gap-1.5 mb-12 w-fit">
                <button type="button" onClick={() => setRole("BUYER")}
                  className={clsx("flex items-center gap-2.5 px-8 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                    role === "BUYER" ? "bg-white text-black shadow-xl shadow-slate-200" : "text-white hover:text-black")}>
                  <User size={14} /> Personal
                </button>
                <button type="button" onClick={() => setRole("DEALER")}
                  className={clsx("flex items-center gap-2.5 px-8 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                    role === "DEALER" ? "bg-slate-950 text-white shadow-xl shadow-slate-900/20" : "text-white hover:text-black")}>
                  <Building2 size={14} /> Dealership
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-10">
                <input type="hidden" name="role" value={role} />

                {errorMsg && (
                   <div className="p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
                      <div className="w-8 h-8 bg-rose-200 rounded-xl flex items-center justify-center text-black shadow-sm shrink-0">
                         <ShieldCheck size={16} />
                      </div>
                      <p className="text-[11px] font-bold text-black leading-tight flex items-center min-h-[32px]">{errorMsg}</p>
                   </div>
                )}

                <div className={clsx("grid gap-x-12 gap-y-10 items-start transition-all", role === "DEALER" ? "md:grid-cols-2" : "grid-cols-1")}>
                   {/* Personal Info */}
                   <div className="space-y-10">
                      <div className="space-y-4">
                         <label className={labelCls}>Identity Verification</label>
                         <div className="space-y-4">
                            <input name="name" required placeholder="Full Legal Name" className={inputCls} />
                            <input name="email" type="email" required placeholder="Email Address" className={inputCls} />
                         </div>
                      </div>

                      {role === "DEALER" && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <label className={labelCls}>Business Entity</label>
                            <div className="space-y-4">
                               <input name="dealerName" required placeholder="Registered Dealership Name" className={inputCls} />
                               <div className="grid grid-cols-2 gap-4">
                                  <input name="phone" required placeholder="Business Phone" className={inputCls} />
                                  <input name="whatsapp" placeholder="WhatsApp (Optional)" className={inputCls} />
                               </div>
                               <textarea name="description" rows={3} placeholder="Dealer Bio & Specialty..." className={clsx(inputCls, "resize-none")} />
                            </div>
                         </div>
                      )}

                      <div className="space-y-4 pt-4 border-t border-slate-50">
                         <label className={labelCls}>Security Configuration</label>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                               <input 
                                 name="password" 
                                 type={showPassword ? "text" : "password"}
                                 required minLength={8} placeholder="Password" 
                                 value={password} onChange={e => setPassword(e.target.value)}
                                 className={inputCls} 
                               />
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white hover:text-black">
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                               </button>
                               <PasswordMeter password={password} />
                            </div>
                            <input name="confirm" type="password" required minLength={8} placeholder="Confirm" className={inputCls} />
                         </div>
                      </div>
                   </div>

                   {/* Dealer Details (Column 2) */}
                   {role === "DEALER" && (
                      <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                         <div className="space-y-4">
                            <label className={labelCls}>Geographic Coverage</label>
                            <div className="grid grid-cols-2 gap-4">
                               <select name="county" required className={clsx(inputCls, "appearance-none")}>
                                 {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                               <input name="location" required placeholder="Primary Area (e.g. Kilimani)" className={inputCls} />
                            </div>
                            <input name="address" placeholder="Physical Business Address" className={inputCls} />
                         </div>
                         
                         <div className="space-y-4">
                            <label className={labelCls}>Precise Location</label>
                            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-100">
                               <LocationPicker />
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-10">
                   <div className="flex-1">
                      <button type="submit" disabled={loading}
                        className="w-full bg-slate-950 hover:bg-black text-white rounded-[1.75rem] py-5 font-black text-[10px] uppercase tracking-[0.25em] transition-all shadow-2xl shadow-slate-950/20 flex items-center justify-center gap-3 active:scale-[0.98]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus size={16} /> Finalize Registration</>}
                      </button>
                   </div>
                   <p className="text-[11px] font-bold text-white max-w-[200px] text-center sm:text-left leading-relaxed">
                      By proceeding, you agree to our <Link href="#" className="text-black border-b border-slate-950/10">Terms</Link> and <Link href="#" className="text-black border-b border-slate-950/10">Privacy</Link>.
                   </p>
                </div>
             </form>

             <footer className="mt-20 pt-12 border-t border-slate-50 text-center lg:text-left">
                <p className="text-sm font-bold text-white">
                   Part of our network?{" "}
                   <Link href="/login" className="text-black hover:text-black transition-colors border-b-2 border-slate-900/10 hover:border-emerald-500/10">Sign in to your portal</Link>
                </p>
             </footer>
          </div>
       </section>
    </div>
  );
}
