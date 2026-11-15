import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        elder: {
          bg: "#0B132B",
          surface: "#1C2541",
          card: "#3A506B",
          accent: "#5BC0BE",
          highlight: "#6FFFE9",
          taken: "#10B981", // High-contrast green
          due: "#F59E0B",   // Warning amber
          missed: "#EF4444",// Alert red
          text: "#FFFFFF",
          muted: "#CBD5E1",
        },
      },
      fontSize: {
        "senior-base": ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "senior-lg": ["1.5rem", { lineHeight: "2rem" }],       // 24px
        "senior-xl": ["2rem", { lineHeight: "2.5rem" }],       // 32px
        "senior-2xl": ["2.5rem", { lineHeight: "3rem" }],      // 40px
      },
      minHeight: {
        "touch-target": "56px",
        "touch-large": "72px",
      },
    },
  },
  plugins: [],
};

export default config;
