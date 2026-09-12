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
      // ║  Cream & Orange palette                          ║
      // ╚══════════════════════════════════════════════════╝
      colors: {
        brand: {
          DEFAULT: "#E8792B",        // Primary orange
          dark:    "#C25F1C",        // Primary pressed/hover
          light:   "#FBE4D3",        // Primary tint 10%
          bg:      "#FBF3DC",        // Screen background (cream)
          surface: "#FFFDF6",        // Card surface
          accent:  "#E8792B",        // Alias of primary
          "accent-light": "#FBE4D3", // Alias of primary tint
        },
        ink: {
          DEFAULT: "#3D3D22",        // Dark surface base (hero/nav gradients)
          dark:    "#242217",        // Darkest ink (gradient end, dark-mode bg)
        },
        tier: {
          gold:   "#E8792B",        // Uses brand orange
          silver: "#9EAAB0",
          bronze: "#B87D5E",
        },
        v: {
          text:     "#3D3D22",
          muted:    "#6E6E4B",
          disabled: "#B5B399",
          border:   "#E7DCB8",
          success:  "#4C7A4C",
          error:    "#C6483B",
          warning:  "#E0A94C",
          info:     "#5C7A8A",
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
