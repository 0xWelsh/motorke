/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface:    "var(--surface)",
        brand: {
          DEFAULT: "var(--brand)",
          muted:   "var(--brand-muted)",
          dim:     "var(--brand-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover:   "var(--accent-hover)",
          dim:     "var(--accent-dim)",
          red:     "var(--accent-red)",
          orange:  "var(--accent-orange)",
          blue:    "var(--accent-blue)",
        },
        surface: {
          glass:    "var(--surface-glass)",
          hover:    "var(--surface-hover)",
          overlay:  "var(--surface-overlay)",
        },
        card: {
          bg:      "var(--card-bg)",
          hover:   "var(--card-bg-hover)",
          border:  "var(--card-border)",
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
        sans:    ["var(--font-sans)"],
        serif:   ["var(--font-serif)", "Lora", "ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["var(--font-sans)"],
        mono:    ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        'xs':  ['0.75rem', { lineHeight: '1.25rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.5rem' }],
        'base': ['1rem', { lineHeight: '1.75rem' }],
      },
      borderRadius: {
        'sm':   '4px',
        'DEFAULT': '4px',
        'md':   '4px',
        'lg':   '4px',
        'xl':   '4px',
        '2xl': '4px',
        '3xl': '4px',
        '4xl': '4px',
        'full': '9999px',
      },
      boxShadow: {
        'glow':       '0 0 20px rgba(22, 163, 74, 0.12), 0 0 60px rgba(22, 163, 74, 0.04)',
        'glow-lg':    '0 0 40px rgba(22, 163, 74, 0.16), 0 0 80px rgba(22, 163, 74, 0.06)',
        'glow-sm':    '0 0 12px rgba(22, 163, 74, 0.08)',
        'glass':      '0 1px 2px rgba(17, 24, 39, 0.04), 0 8px 24px rgba(17, 24, 39, 0.08)',
        'glass-lg':   '0 2px 4px rgba(17, 24, 39, 0.05), 0 16px 48px rgba(17, 24, 39, 0.12)',
        'elevated':   '0 2px 12px rgba(17, 24, 39, 0.08)',
        'elevated-lg':'0 4px 24px rgba(17, 24, 39, 0.1)',
      },
      animation: {
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'dealers-hero-image': 'dealersHeroImage 1.35s ease-out forwards',
        'dealers-hero-content': 'dealersHeroContent 0.85s ease-out 0.12s both',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(34, 197, 94, 0.15)' },
          '50%': { borderColor: 'rgba(34, 197, 94, 0.35)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        dealersHeroImage: {
          '0%': { opacity: '0.4', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        dealersHeroContent: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
