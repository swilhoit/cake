/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      colors: {
        'pastel-pink': '#f8e1f4',
        'pastel-blue': '#e1f4f8',
        'pastel-green': '#e1f8e4',
        'pastel-yellow': '#f4f8e1',
      }
    },
  },
  plugins: [],
} 