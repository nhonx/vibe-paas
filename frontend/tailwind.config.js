/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        neo: "4px 4px 0px 0px rgba(0,0,0,1)",
        "neo-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
        "neo-lg": "8px 8px 0px 0px rgba(0,0,0,1)",
      },
      colors: {
        "neo-yellow": "#FFDE00",
        "neo-blue": "#3369FF",
        "neo-pink": "#FF6B6B",
        "neo-green": "#00D084",
        "neo-bg": "#FEF3C7", // soft yellow/off-white
        "neo-dark": "#1e1e1e",
      },
      borderWidth: {
        3: "3px",
      },
    },
  },
  plugins: [],
};
