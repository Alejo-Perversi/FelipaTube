/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        'bounce-slight': {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.05)' },
          '60%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'bounce-slight': 'bounce-slight 300ms ease-in-out'
      }
    }
  },
  plugins: []
}

