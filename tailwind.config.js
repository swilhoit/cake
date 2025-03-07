/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'rubik': ['Rubik', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 25s linear infinite',
        'marquee-fast': 'marquee 30s linear infinite',
        'marquee-reverse-fast': 'marquee-reverse 30s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' }
        },
      },
      colors: {
        'pastel-pink': '#f8e1f4',
        'pastel-blue': '#e1f4f8',
        'pastel-green': '#e1f8e4',
        'pastel-yellow': '#f4f8e1',
      },
      backgroundImage: {
        'button-gradient': 'linear-gradient(to right, #f8e1a0, #f8e1f4)',
      }
    },
  },
  plugins: [],
} 