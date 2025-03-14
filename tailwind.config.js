/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
    screens: {
      xs: "320px",
      sm: "640px",
      md: "768px",
      lg: "990px",
      xl: "1280px",
      xxl: "1536px",
    },
  },
  plugins: [],
}

