/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        paper: "#F7F4EE",
        accent: "#FF5C39",
        moss: "#4A6741",
        flag: "#C8472D",
        sky: "#A8C5DA",
        cream: "#EDE6D6"
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["'General Sans'", "system-ui", "sans-serif"]
      },
      fontSize: {
        "display-xl": ["72px", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display-l": ["48px", { lineHeight: "1.0", letterSpacing: "-0.015em" }]
      },
      letterSpacing: {
        caption: "0.08em"
      },
      boxShadow: {
        card: "0 1px 3px rgba(26,26,26,0.06), 0 8px 24px rgba(26,26,26,0.04)",
        lift: "0 4px 12px rgba(26,26,26,0.10), 0 16px 40px rgba(26,26,26,0.08)"
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(0.32, 0.72, 0, 1)"
      }
    }
  },
  plugins: []
};
