module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        caprasimo: ["var(--font-caprasimo)", "serif"],
      },
    },
  },
  plugins: [],
};