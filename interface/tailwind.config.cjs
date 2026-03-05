/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0d0d14", 2: "#13131f", 3: "#1a1a2e" },
        border: "#252540",
        accent: { DEFAULT: "#8b5cf6", 2: "#6d28d9" },
        gold: { DEFAULT: "#f5a623", 2: "#d4891a" },
        txt: { DEFAULT: "#e2e2f0", 2: "#9090b0", 3: "#60607a" },
        ok: "#22c55e",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
      },
    },
  },
  plugins: [],
};
