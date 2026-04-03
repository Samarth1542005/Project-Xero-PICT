/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a",
        secondary: "#0ea5e9",
        surface: "#1e293b",
        accent: "#14b8a6",
        danger: "#dc2626",
        success: "#15803d",
        warning: "#d97706",  
        muted: "#334155",     
      },
      boxShadow: {
        glow: "0 0 20px rgba(20, 184, 166, 0.35)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
