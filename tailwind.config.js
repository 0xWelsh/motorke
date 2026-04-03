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
        background: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
        },
        cyan: {
          DEFAULT: "#0891b2",
          dark:    "#0e7490",
          light:   "#e0f2fe",
          glow:    "rgba(8,145,178,0.3)",
        },
        orange: {
          DEFAULT: "#ea580c",
          dark:    "#c2410c",
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
