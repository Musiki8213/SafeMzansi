/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe: {
          green: '#007A4D',
          gold: '#FFB612',
          black: '#000000',
          dark: '#1a1a1a',
        }
      }
    },
  },
  plugins: [],
}

