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
      // ║  60% White / 30% Navy / 10% Orange              ║
      // ╚══════════════════════════════════════════════════╝
      colors: {
        brand: {
          DEFAULT: "#2B4C6F",       // Navy blue (primary)
          dark:    "#1A3550",       // Darker navy
          light:   "#EBF0F5",       // Light navy tint
          bg:      "#F8F9FB",       // App background (near-white)
          accent:  "#D4872C",       // Orange accent (10%)
          "accent-light": "#FDF3E8", // Light orange tint
        },
        tier: {
          gold:   "#D4872C",        // Uses brand orange
          silver: "#9EAAB0",
          bronze: "#B87D5E",
        },
        v: {
          text:    "#1A2332",
          muted:   "#7A8694",
          border:  "#E2E7ED",
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
