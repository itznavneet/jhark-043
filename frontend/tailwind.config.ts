import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b2f62",
        canvas: "#f4f8fc",
        accent: "#f15a24",
        coral: "#dc3b3b",
        primary: "#0b4f9c",
        workflow: "#16a34a",
      },
    },
  },
  plugins: [],
};

export default config;
