import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#141B1E",
        grey: {
          light: "#BDC3C2",
          dark: "#2D3437",
        },
        orange: "#E57474",
      },
    },
  },
  plugins: [],
} satisfies Config;
