import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { cream: "#FBF5EA", burgundy: { DEFAULT: "#6B1F2E", dark: "#4A1220" }, gold: "#B8923A" },
    fontFamily: { serif: ["Georgia", "Cambria", "serif"] } } },
} satisfies Config;
