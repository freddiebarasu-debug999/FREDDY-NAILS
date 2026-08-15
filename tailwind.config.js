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
    },
  },
  plugins: [],
};
