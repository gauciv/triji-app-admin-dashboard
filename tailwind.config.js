/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#22e584',
        dark: {
          900: '#0f1c2e',
          800: '#162447',
          700: '#121212',
          600: 'rgba(28, 34, 47, 0.85)',
        },
      },
    },
  },
  plugins: [],
}
