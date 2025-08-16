import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["ui-serif", "Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        blush: "#F7D6E0",
        dusk: "#2B2D42",
        gold: "#E4B363"
      }
    },
  },
  plugins: [],
};
export default config;
