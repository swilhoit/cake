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
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'slide-down': 'slideDown 0.8s ease-in forwards',
        'flash-green': 'flashGreen 1s ease-out forwards',
        'header-slide-down': 'headerSlideDown 1s ease-out forwards',
        'model-scale-in': 'modelScaleIn 1.2s ease-out forwards',
        'marquee-slide-in': 'marqueeSlideIn 1.5s ease-out forwards',
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
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0.8' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0.8' }
        },
        flashGreen: {
          '0%': { backgroundColor: '#ec4899' },  // pink-500
          '10%': { backgroundColor: '#22c55e' }, // green-500
          '25%': { backgroundColor: '#22c55e' }, // green-500
          '100%': { backgroundColor: '#22c55e' }, // green-500
        },
        headerSlideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        modelScaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.05)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        marqueeSlideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
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