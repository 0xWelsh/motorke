// src/app/not-found.js
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-black text-white/5 mb-4">404</p>
      <h1 className="text-2xl font-black mb-2">Page not found</h1>
      <p className="text-white/40 text-sm mb-8">
        This page doesn't exist or the car may have been sold.
      </p>
      <div className="flex gap-3">
        <Link href="/cars"
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
          Browse cars
        </Link>
        <Link href="/"
          className="border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
          Go home
        </Link>
      </div>
    </div>
  );
}
