/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        dm: ["DM Sans", "sans-serif"],
        bricolage: ["Bricolage Grotesque", "sans-serif"],
      }
    },
  },
  plugins: [],
};
