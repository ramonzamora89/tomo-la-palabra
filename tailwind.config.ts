import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          verde: "#104734",
          amarillo: "#F9C432",
          crema: "#EFE9CF",
          gris: "#D9D9D9",
        },
        // Warm neutral scale (not in the brandbook) tuned to sit next to
        // brand.crema/brand.verde instead of reading as a generic cold gray.
        ink: {
          50: "#FAF8F3",
          100: "#F3F0E8",
          200: "#E6E1D4",
          300: "#D9D9D9", // = brand.gris, reused so borders read as on-brand
          400: "#B8B4A8",
          500: "#8F8B7E",
          600: "#6B6759",
          700: "#4D4A3F",
          800: "#33312A",
          900: "#1C1B17",
        },
      },
      fontFamily: {
        // Placeholder substitutes until the licensed Chantal/Dreamwalker
        // font files are sourced from the brand designer — see next/font
        // setup in app/layout.tsx for the tracked TODO.
        display: ["var(--font-display)"],
        hand: ["var(--font-hand)"],
        sans: ["var(--font-body)"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
