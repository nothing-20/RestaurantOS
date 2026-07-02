/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(222 47% 11%)",
        accent: "hsl(142 72% 40%)",
        textPearl: "hsl(210 40% 98%)",
        mutedAsh: "hsl(215 20% 65%)",
        primary: {
          DEFAULT: "hsl(35 92% 50%)",
          hover: "hsl(35 92% 40%)",
        },
        slateBorder: "hsla(217 30% 20% / 0.5)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
}
