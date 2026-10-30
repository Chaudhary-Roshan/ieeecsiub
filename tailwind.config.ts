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
        ieee: {
          blue: "#00629B", // PMS 3015 Main
          orange: "#FFA300", // PMS 137 C Accent (~10%)
          navy: "#002855", // PMS 295 Dark
          cyan: "#00B5E2", // Process Cyan Highlight
          surfaceTint: "#CCE0EB", // Blue 20% tint
          border: "#E3E4E5", // Gray 20% tint
          muted: "#75787B", // Cool Gray 9 C
        },
        status: {
          active: "#00843D", // Green (PMS 348 C)
          revoked: "#BA0C2F", // Red (PMS 200 C)
          replaced: "#E87722", // Dark orange (PMS 158 C)
          notfound: "#75787B", // Cool Gray 9 C
        },
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        openSans: ["var(--font-opensans)", "Open Sans", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
