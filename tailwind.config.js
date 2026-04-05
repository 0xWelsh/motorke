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
          900: "#0f172a",
          600: "#475569",
          500: "#64748b",
          100: "#f1f5f9",
          50:  "#f8fafc",
        },
      },
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      animation: {
        'glow-pulse': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 20px rgba(8,145,178,0)' },
          '100%': { boxShadow: '0 0 40px rgba(8,145,178,0.3)' },
        }
      }
    },
  },
  plugins: [],
};
