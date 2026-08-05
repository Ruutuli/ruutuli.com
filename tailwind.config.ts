import type { Config } from "tailwindcss";

/** Brand pink #D95970 and complementary shades */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FFFBFB",
          100: "#FFF4F6",
          200: "#FCEAED",
          300: "#F5D6DC",
        },
        closet: {
          // Soft border / muted accent
          pink: "rgb(232 154 171 / <alpha-value>)",
          // Primary brand pink #D95970
          rose: "rgb(217 89 112 / <alpha-value>)",
          // Soft panel / hover wash
          blush: "rgb(251 232 236 / <alpha-value>)",
          // Darker hover / pressed
          mauve: "rgb(184 68 90 / <alpha-value>)",
          // Body text
          brown: "rgb(79 48 56 / <alpha-value>)",
          "brown-light": "rgb(138 101 112 / <alpha-value>)",
          surface: "rgb(255 252 252 / <alpha-value>)",
          // Mid accent for gradients
          peach: "rgb(229 110 130 / <alpha-value>)",
          "peach-light": "rgb(240 176 188 / <alpha-value>)",
          "peach-dark": "rgb(217 89 112 / <alpha-value>)",
          coral: "rgb(217 89 112 / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        closet: "0 2px 8px rgba(79, 48, 56, 0.05), 0 8px 24px rgba(217, 89, 112, 0.1)",
        "closet-lg": "0 4px 12px rgba(79, 48, 56, 0.04), 0 16px 40px rgba(217, 89, 112, 0.14)",
        "closet-soft": "0 10px 30px rgba(217, 89, 112, 0.18)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease-out both",
        "fade-in": "fadeIn 0.6s ease-out both",
        "fade-up-stagger": "fadeUp 0.65s ease-out both",
        float: "float 4s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        wiggle: "wiggle 2.5s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "bounce-soft": "bounceSoft 2s ease-in-out infinite",
        "scale-in": "scaleIn 0.5s ease-out forwards",
        "progress-fill": "progressFill 1s ease-out forwards",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
        "spin-slow": "spinSlow 24s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.85)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        progressFill: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        pulseSoft: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(217, 89, 112, 0.25)" },
          "50%": { boxShadow: "0 0 0 6px rgba(217, 89, 112, 0)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
