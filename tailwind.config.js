/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        nude: "#EFE6DA",
        "nude-deep": "#E1D2BE",
        ink: "#1B1714",
        "ink-soft": "#332C26",
        gold: "#AD8A4E",
        "gold-bright": "#C9A25E",
        blush: "#D9C2AC",
        line: "rgba(27,23,20,0.12)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-manrope)", "sans-serif"],
      },
      keyframes: {
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "ping-slower": {
          "0%": { transform: "scale(1)", opacity: "0.4" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "ping-slow": "ping-slow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-slower": "ping-slower 2.2s cubic-bezier(0, 0, 0.2, 1) infinite 0.4s",
      },
    },
  },
  plugins: [],
};
