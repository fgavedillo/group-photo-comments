import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#128C7E", // WhatsApp primary color
          hover: "#075E54", // WhatsApp dark green
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#DCF8C6", // WhatsApp message bubble color
          foreground: "#1A1A1A",
        },
        muted: {
          DEFAULT: "#F0F0F0",
          foreground: "#737373",
        },
        accent: {
          DEFAULT: "#25D366", // WhatsApp light green
          foreground: "#075E54",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "message-appear": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "image-appear": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "message-appear": "message-appear 0.3s ease-out forwards",
        "image-appear": "image-appear 0.4s ease-out forwards",
      },
      backgroundImage: {
        'whatsapp-pattern': "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABsSURBVEhL7Y1BCoAwDAT7Qf9U/YB/9kRo2R0jiGlEPAQcSJYwm80PaZLRGeS9MxvGEw5+C18/8IWml3v0OHqvPs9hP1DOY4yK/KBYQJFzjP2gWECRc4z9oFhAkXOM/aBYQJFzjP2gWECRc4z9oADnNpkd0Vx55G4YAAAAAElFTkSuQmCC')",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;