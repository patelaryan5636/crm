/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#355872',
          DEFAULT: '#7AAACE',
          light: '#9CD5FF',
        },
        offWhite: '#F7F8F0',
        sidebar: {
          DEFAULT: '#355872',
          hover: '#2a455a',
          active: '#7AAACE',
          text: '#ffffff',
          textMuted: '#e2e8f0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
