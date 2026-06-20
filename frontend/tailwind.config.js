/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ClaimGuard AI palette — white theme, navy text, teal/blue accents.
        navy: {
          DEFAULT: "#0f2747",
          900: "#0a1c34",
          800: "#0f2747",
          700: "#1b3a63",
          600: "#2b4f7e",
        },
        teal: {
          DEFAULT: "#0d9488",
          600: "#0d9488",
          500: "#14b8a6",
          50: "#f0fdfa",
        },
        ink: "#1e293b",
        muted: "#64748b",
        line: "#e6ebf2",
        canvas: "#f7f9fc",
        risk: {
          low: "#16a34a",
          medium: "#d97706",
          high: "#ea580c",
          critical: "#dc2626",
        },
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,39,71,0.04), 0 6px 20px rgba(15,39,71,0.05)",
        soft: "0 1px 3px rgba(15,39,71,0.06)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
