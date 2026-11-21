"use client";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-4 pt-16">
      <div className="w-full max-w-sm">
        <h1 className="text-text font-black tracking-tight text-base mb-5 text-center">
          BIDGARI
        </h1>
        {children}
      </div>
    </div>
  );
}
