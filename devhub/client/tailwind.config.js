/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      }
    }
  },
  plugins: []
}
