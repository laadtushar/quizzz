import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#bdc3c7",
        input: "#bdc3c7",
        ring: "#3498db",
        background: "#ecf0f1",
        foreground: "#2c3e50",
        primary: {
          DEFAULT: "#3498db",
          foreground: "#ffffff",
          hover: "#2980b9",
        },
        secondary: {
          DEFAULT: "#2ecc71",
          foreground: "#ffffff",
          hover: "#27ae60",
        },
        destructive: {
          DEFAULT: "#e74c3c",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f5f5f5",
          foreground: "#7f8c8d",
        },
        accent: {
          DEFAULT: "#f5f5f5",
          foreground: "#2c3e50",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#2c3e50",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#2c3e50",
        },
        warning: {
          DEFAULT: "#f39c12",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "8px",
        md: "4px",
        sm: "2px",
      },
      fontFamily: {
        sans: ['PT Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config


