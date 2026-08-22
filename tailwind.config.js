/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mn: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "oklch(97.5% 0.004 260)",
        surface: "oklch(100% 0 0)",
        "surface-alt": "oklch(97% 0.006 260)",
        border: {
          DEFAULT: "oklch(90% 0.006 260)",
          strong: "oklch(83% 0.008 260)",
        },
        ink: {
          DEFAULT: "oklch(24% 0.02 260)",
          secondary: "oklch(48% 0.02 260)",
          tertiary: "oklch(63% 0.015 260)",
        },
        accent: {
          DEFAULT: "oklch(46% 0.15 262)",
          tint: "oklch(94% 0.03 262)",
        },
        good: {
          DEFAULT: "oklch(56% 0.15 148)",
          tint: "oklch(94% 0.045 148)",
          text: "oklch(38% 0.12 148)",
        },
        warn: {
          DEFAULT: "oklch(68% 0.16 70)",
          tint: "oklch(95% 0.05 75)",
          text: "oklch(42% 0.11 70)",
        },
        bad: {
          DEFAULT: "oklch(55% 0.19 25)",
          tint: "oklch(94% 0.045 25)",
          text: "oklch(45% 0.17 25)",
        },
      },
    },
  },
  plugins: [],
};
