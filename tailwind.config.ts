import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          100: '#f9c89b',
          200: '#f5a962',
          300: '#f47920',
          400: '#e66d1a',
          500: '#d96217',
          600: '#cc5714',
        },
      },
    },
  },
  plugins: [],
};
export default config;