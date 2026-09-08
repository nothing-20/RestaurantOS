/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--color-background))",
        accent: "hsl(var(--color-success))",
        textPearl: "hsl(var(--color-text))",
        mutedAsh: "hsl(var(--color-muted))",
        primary: {
          DEFAULT: "hsl(var(--color-primary))",
          hover: "hsl(var(--color-primary-hover))",
        },
        slateBorder: "hsla(var(--color-border) / 0.5)",
        secondary: "hsl(var(--color-secondary))",
        success: "hsl(var(--color-success))",
        warning: "hsl(var(--color-warning))",
        danger: "hsl(var(--color-danger))",
        info: "hsl(var(--color-info))",
        surface: "hsl(var(--color-surface))",
        brandTerracotta: "#E85D3F",
        brandCream: "#FFF8F2",
        brandWarmWhite: "#FFFCF9",
        brandCard: "#FFFFFF",
        brandTextDark: "#242424",
        brandTextMuted: "#6B6B6B",
        brandSuccess: "#22A06B",
        brandGold: "#F4B942",
        brandBorder: "#EEE7E1",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "sans-serif"],
      },
      boxShadow: {
        glass: "var(--elevation-glass)",
      },
    },
  },
  plugins: [],
}
