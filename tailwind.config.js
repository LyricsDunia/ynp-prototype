/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ynpblue: 'rgb(0, 102, 204)',
        ynpgreen: 'rgb(0, 153, 76)',
      },
    },
  },
  plugins: [],
};