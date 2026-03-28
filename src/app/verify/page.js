// src/app/verify/page.js
import { db } from "@/lib/db";
import Link from "next/link";
import { ShieldCheck, XCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Profile Verification — Motorke Standard" };

export default async function VerifyPage({ searchParams }) {
  const sp = await searchParams;
  const token = sp.token;

  if (!token) {
    return <StatusCard 
      icon={<XCircle className="w-10 h-10 text-rose-500" />}
      title="Missing Token"
      message="No verification token was provided. Please check your email link."
    />;
  }

  // Find token
  const existingToken = await db.verificationToken.findUnique({
    where: { token }
  });

  if (!existingToken || existingToken.expires < new Date()) {
    return <StatusCard 
      icon={<XCircle className="w-10 h-10 text-rose-500" />}
      title="Token Expired"
      message="This verification link is no longer valid or has expired. Please sign in to request a new one."
    />;
  }

  // Update user
  await db.$transaction([
    db.user.update({
      where: { email: existingToken.identifier },
      data:  { emailVerified: new Date() }
    }),
    db.verificationToken.delete({
      where: { token }
    })
  ]);

  return <StatusCard 
    icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
    title="Profile Verified"
    message="Your Motorske Standard profile has been successfully verified. You now have full access to the marketplace."
    success
  />;
}

function StatusCard({ icon, title, message, success }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-12">
          <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">
            Motor<span className="text-orange-600">ke</span>
          </span>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <span className="text-[9px] font-black dark:text-slate-400 text-slate-600 uppercase tracking-[0.2em]">Standard</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 shadow-sm">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner">
              {icon}
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-4">{title}</h1>
          <p className="dark:text-slate-500 text-slate-600 text-sm font-medium leading-relaxed mb-10">
            {message}
          </p>

          <Link 
            href={success ? "/" : "/login"} 
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-orange-600 text-pureWhite px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200"
          >
            {success ? "Go to Showcase" : "Back to Sign In"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2">
           <ShieldCheck className="w-3 h-3 dark:text-slate-300 text-slate-500" />
           <span className="text-[9px] font-black dark:text-slate-300 text-slate-500 uppercase tracking-widest">Motorke Trust & Safety</span>
        </div>
      </div>
    </div>
  );
}
