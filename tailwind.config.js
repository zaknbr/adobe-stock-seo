/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        adobe: {
          red: '#FA0F00',
          dark: '#141414',
          card: '#1E1E24',
          border: '#2A2B36',
          accent: '#FF334B'
        }
      }
    },
  },
  plugins: [],
}
