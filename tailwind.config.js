/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        "ink-soft": "#2C2C2A",
        "ink-mute": "rgba(26,26,26,0.6)",
        "ink-quiet": "rgba(26,26,26,0.4)",
        rule: "rgba(26,26,26,0.12)",
        paper: "#F7F4EE",
        cream: "#EDE6D6",
        accent: "#FF5C39",
        "accent-deep": "#E84A28",
        moss: "#4A6741",
        flag: "#C8472D",
        sky: "#A8C5DA",
        gold: "#C8A348",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["General Sans", "-apple-system", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SF Mono", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(64px,9vw,140px)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display-l": ["clamp(56px,6vw,78px)", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        "2": "12px",
        "3": "14px",
        "4": "16px",
        "5": "18px",
        "6": "22px",
        "7": "24px",
        pill: "999px",
      },
      boxShadow: {
        "soft-card": "0 1px 0 rgba(26,26,26,0.12), 0 8px 24px -16px rgba(0,0,0,0.18)",
        photo: "0 10px 36px -16px rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.05)",
        "btn-cta": "0 1px 0 rgba(255,255,255,0.25) inset, 0 12px 28px -10px rgba(255,92,57,0.5)",
        modal: "0 30px 80px -20px rgba(0,0,0,0.5)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.32, 0.72, 0, 1)",
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-20vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
        flameFlicker: {
          "0%, 100%": { transform: "scale(1) rotate(-2deg)" },
          "50%": { transform: "scale(1.06) rotate(2deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fadeUp 400ms cubic-bezier(0.32,0.72,0,1) both",
        "scale-in": "scaleIn 360ms cubic-bezier(0.32,0.72,0,1) both",
        "confetti-fall": "confettiFall var(--dur) var(--delay) linear forwards",
        "flame-flicker": "flameFlicker 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
