"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ simple = false }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  if (simple) {
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 bg-transparent border-none shadow-none hover:bg-transparent hover:text-[#ff5a2f] transition-colors shrink-0"
        aria-label="Toggle Dark Mode"
        style={{ boxShadow: "none", border: "none", background: "none" }}
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#111] border border-[#ddd4c8] dark:border-zinc-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors shrink-0"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
