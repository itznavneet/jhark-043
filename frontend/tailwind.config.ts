import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        canvas: "#f7f8fb",
        accent: "#0f766e",
        coral: "#d95d5d",
      },
    },
  },
  plugins: [],
};

export default config;
