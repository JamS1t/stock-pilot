/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./offline/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F6F5EF",
        surface: "#FFFFFF",
        sunken: "#EFEEE6",
        line: { DEFAULT: "#E3E1D6", strong: "#CFCDBF" },
        ink: { DEFAULT: "#0E1A16", soft: "#16261F" },
        muted: "#6B7268",
        faint: "#9AA096",
        peso: { DEFAULT: "#0B6E50", deep: "#095B41", tint: "#E7F2EC" },
        gcash: { DEFAULT: "#1C5FD6", tint: "#E7EEFB" },
        utang: { DEFAULT: "#B26A00", tint: "#FBF0DA" },
        danger: { DEFAULT: "#C0392B", tint: "#FBE9E7" },
        rail: {
          text: "#C8D2CC",
          muted: "#7C8B82",
          active: "#1C8C66",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,26,22,0.05), 0 1px 3px rgba(14,26,22,0.04)",
        pop: "0 8px 30px rgba(14,26,22,0.14), 0 2px 8px rgba(14,26,22,0.08)",
        rail: "1px 0 0 rgba(0,0,0,0.25)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.28s ease-out both",
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
