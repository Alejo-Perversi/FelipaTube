/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  safelist: ['animate-bounce-y'],
  theme: {
    extend: {
      keyframes: {
        'bounce-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-30px)' }
        }
      },
      animation: {
        'bounce-y': 'bounce-y 0.5s ease'
      }
    }
  },
  plugins: []
}



