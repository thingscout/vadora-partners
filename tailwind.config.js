/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ╔══════════════════════════════════════════════════╗
      // ║  VADORA THEME — Change brand colors here only   ║
      // ╚══════════════════════════════════════════════════╝
      colors: {
        brand: {
          DEFAULT: "#8B5E83",
          dark:    "#6B4063",
          light:   "#F3ECF1",
          bg:      "#FAF7F4",
        },
        tier: {
          gold:   "#C9A84C",
          silver: "#9EAAB0",
          bronze: "#B87D5E",
        },
        v: {
          text:    "#2C2326",
          muted:   "#8A7F83",
          border:  "#EDE7E9",
          success: "#5A8F6B",
          error:   "#C0616B",
          warning: "#D4A843",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        btn:  "10px",
      },
      boxShadow: {
        card:      "0 2px 12px rgba(44,35,38,0.06)",
        "card-lg": "0 8px 32px rgba(44,35,38,0.10)",
      },
    },
  },
  plugins: [],
};
