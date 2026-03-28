// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "rgba(var(--tw-white) / <alpha-value>)",
        black: "rgba(var(--tw-black) / <alpha-value>)",
        pureWhite: "#ffffff",
        pureBlack: "#000000",
        background: "var(--bg)",
        orange: {
          DEFAULT: "#ea580c", // A slightly deeper, premium orange
          dark:    "#c2410c",
          glow:    "rgba(234, 88, 12, 0.5)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          dark:    "#0a0a0a",
          card:    "#111111",
          border:  "#1f1f1f",
        }
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
          '0%': { boxShadow: '0 0 20px rgba(234, 88, 12, 0)' },
          '100%': { boxShadow: '0 0 40px rgba(234, 88, 12, 0.3)' },
        }
      }
    },
  },
  plugins: [],
};
