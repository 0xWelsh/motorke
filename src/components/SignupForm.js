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
  
  // Google OAuth only available if client ID is configured
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasGoogleAuth = Boolean(googleClientId);
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
    <div className="min-h-screen bg-white">
      {hasGoogleAuth && (
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
              width: "100%",
              text: "signup_with",
              shape: "rectangular",
              logo_alignment: "center",
            });
          }}
        />
      )}

      <section className="min-h-dvh px-4 py-8 sm:px-6 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/favicon.png" alt="Motorke" className="h-8 w-8 object-contain" />
              <h1 className="text-2xl font-bold text-slate-900">Motorke</h1>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
            <p className="text-sm text-slate-600">Join as buyer or dealer to get started</p>
          </div>

          {/* Role Toggle */}
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
            <button 
              type="button" 
              onClick={() => setRole("BUYER")}
              className={clsx(
                "flex-1 py-2 px-3 rounded-md font-semibold text-sm transition-all",
                role === "BUYER" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Personal
            </button>
            <button 
              type="button" 
              onClick={() => setRole("DEALER")}
              className={clsx(
                "flex-1 py-2 px-3 rounded-md font-semibold text-sm transition-all",
                role === "DEALER" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Dealership
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900">{errorMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <input type="hidden" name="role" value={role} />

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
              <input 
                id="email"
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                autoComplete="email"
                placeholder="you@dealership.com" 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
              <div className="relative">
                <input 
                  id="password"
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  autoComplete="new-password"
                  placeholder="•••••••••" 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && <PasswordMeter password={password} />}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
              <input 
                id="confirm"
                name="confirm" 
                type={showPassword ? "text" : "password"}
                required 
                autoComplete="new-password"
                placeholder="•••••••••" 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all"
              />
            </div>

            {/* Dealer Fields */}
            {role === "DEALER" && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div>
                  <label htmlFor="dealerName" className="block text-sm font-semibold text-slate-900 mb-2">Dealership Name</label>
                  <input 
                    id="dealerName"
                    name="dealerName" 
                    type="text" 
                    placeholder="Your dealership name" 
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="county" className="block text-sm font-semibold text-slate-900 mb-2">County</label>
                  <select 
                    id="county"
                    name="county"
                    required
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all"
                  >
                    <option value="">Select a county</option>
                    {COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Security Check */}
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-2 block">Security</label>
              <HumanCheck
                value={captchaToken}
                onChange={setCaptchaToken}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Creating account..." : "Create Account"}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-600">or sign up with</span>
              </div>
            </div>

            {/* Google Button */}
            <div id="google-signup-button" className="w-full" />
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-slate-500 mt-4">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-slate-700">
                Terms
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
