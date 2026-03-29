"use client";

import { useState } from "react";
import { UserPlus, Building2, User, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import LocationPicker from "./LocationPicker";

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
    score >= 1 ? (score < 3 ? "bg-rose-500" : (score === 3 ? "bg-yellow-500" : "bg-emerald-500")) : "bg-white/10",
    score >= 2 ? (score < 3 ? "bg-rose-500" : (score === 3 ? "bg-yellow-500" : "bg-emerald-500")) : "bg-white/10",
    score >= 3 ? (score === 3 ? "bg-yellow-500" : "bg-emerald-500") : "bg-white/10",
    score >= 4 ? "bg-emerald-500" : "bg-white/10"
  ];
  
  let label = "Enter password";
  if (score === 0 && password) label = "Very Weak";
  else if (score === 1) label = "Weak";
  else if (score === 2) label = "Fair";
  else if (score === 3) label = "Good";
  else if (score === 4) label = "Strong";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1 h-1.5">
        {segments.map((bg, i) => (
          <div key={i} className={`flex-1 rounded-full ${bg} transition-colors duration-300`} />
        ))}
      </div>
      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-right">{label}</p>
    </div>
  );
}

export default function SignupForm() {
  const [role, setRole] = useState("BUYER");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData(e.target);
    
    // Passwords match check
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
      setErrorMsg("Network connection failed. Please check your internet and try again.");
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-white/20 focus:bg-surface transition-all placeholder:text-white/20";
  const labelCls = "text-[10px] font-black text-white/40 uppercase tracking-widest ml-1";
  
  const dealerInputCls = "w-full bg-orange-500/5 border border-orange-500/10 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-orange-500/50 focus:bg-surface transition-all placeholder:text-white/20";
  const dealerLabelCls = "text-[10px] font-black text-orange-400/60 uppercase tracking-widest ml-1";

  return (
    <div className={clsx(
      "bg-surface/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-2xl mx-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
      role === "DEALER" ? "max-w-4xl" : "max-w-[440px]"
    )}>
      
      {errorMsg && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 shadow-sm shrink-0 mt-0.5">
            <span className="text-[10px] font-black">!</span>
          </div>
          <p className="text-xs font-bold text-red-400 leading-relaxed">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl gap-1">
          <button type="button" onClick={() => { setRole("BUYER"); setErrorMsg(""); }}
            className={clsx("flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all duration-300",
              role === "BUYER" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60")}>
            <User className="w-4 h-4" /> Personal
          </button>
          <button type="button" onClick={() => { setRole("DEALER"); setErrorMsg(""); }}
            className={clsx("flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all duration-300",
              role === "DEALER" ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20" : "text-white/40 hover:text-white/60")}>
            <Building2 className="w-4 h-4" /> Dealership
          </button>
        </div>
        <input type="hidden" name="role" value={role} />

        <div className={clsx(
          "grid gap-8 transition-all duration-500 items-start",
          role === "DEALER" ? "md:grid-cols-2" : "grid-cols-1"
        )}>
          {/* Left Column (Identity & Auth) */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={labelCls}>Full Name *</label>
              <input name="name" required placeholder="John Kamau" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Email Address *</label>
              <input name="email" type="email" required placeholder="name@example.com" className={inputCls} />
            </div>

            {role === "DEALER" && (
              <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className={dealerLabelCls}>Dealership Name *</label>
                  <input name="dealerName" required placeholder="e.g. Prestige Auto" className={dealerInputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={dealerLabelCls}>Business Phone *</label>
                    <input name="phone" required placeholder="0700 000 000" className={dealerInputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className={dealerLabelCls}>WhatsApp</label>
                    <input name="whatsapp" placeholder="0700 000 000" className={dealerInputCls} />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className={dealerLabelCls}>Short Description</label>
                   <textarea name="description" rows={3} placeholder="Tell buyers about your dealership..." className={clsx(dealerInputCls, "resize-none")} />
                </div>
              </div>
            )}

            {/* Auth Fields at bottom of Left Column */}
            <div className="space-y-6 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className={labelCls}>Password *</label>
                  <input name="password" type="password" required minLength={8} placeholder="8+ chars" 
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={inputCls} />
                  <PasswordMeter password={password} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Confirm *</label>
                  <input name="confirm" type="password" required minLength={8} placeholder="Repeat" className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Dealer Extension) */}
          {role === "DEALER" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={dealerLabelCls}>County *</label>
                    <select name="county" required className={clsx(dealerInputCls, "bg-[#0a0a0a]")}>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={dealerLabelCls}>Location (Area) *</label>
                    <input name="location" required placeholder="e.g. Kilimani" className={dealerInputCls} />
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className={dealerLabelCls}>Physical Address</label>
                  <input name="address" placeholder="e.g. 2nd Floor, Apex Building" className={dealerInputCls} />
               </div>

               <div className="pt-2">
                  <LocationPicker />
               </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-white/10 hover:bg-orange-600 disabled:opacity-50 text-pureWhite rounded-2xl py-4 font-black text-sm tracking-wide transition-all hover:shadow-[0_0_15px_rgba(234,88,12,0.4)] flex items-center justify-center gap-2 group mt-8 relative overflow-hidden">
          {loading ? (
             <><Loader2 className="w-5 h-5 animate-spin" /> Authorizing...</>
          ) : (
             <><UserPlus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /> Create Account</>
          )}
        </button>
      </form>
    </div>
  );
}
