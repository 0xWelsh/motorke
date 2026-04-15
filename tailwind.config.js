/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface:    "var(--surface)",
        brand: {
          DEFAULT: "var(--brand)",
          light:   "var(--brand-light)",
          accent:  "var(--brand-accent)",
        },
        slate: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
          50:  "#f8fafc",
        },
      },
      fontFamily: {
        sans:    ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif:   ["Lora", "ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["Satoshi", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        'xs':  ['0.75rem', { lineHeight: '1.25rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.5rem' }],
        'base': ['1rem', { lineHeight: '1.75rem' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'glow-pulse': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 20px rgba(16,185,129,0)' },
          '100%': { boxShadow: '0 0 40px rgba(16,185,129,0.3)' },
        }
      }
    },
  },
  plugins: [],
};
