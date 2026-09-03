/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        night: '#0A0E13',
        pitch: '#111923',
        pitch2: '#18222E',
        chalk: '#EDF1F5',
        muted: '#8A98A6',
        line: '#223040',
        volt: '#C6F53F',
        voltdark: '#9FCC1F',
        ember: '#FF5A1F',
        gold: '#E8C36A',
        azure: '#3FA9F5',
        snow: '#F5F7F4',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        head: ['Oswald', 'Arial Narrow', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        fadeUp: 'fadeUp 0.5s ease-out both',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        slideIn: 'slideIn 0.25s ease-out both',
      },
      boxShadow: {
        volt: '0 0 0 1px rgba(198,245,63,0.35), 0 8px 30px -6px rgba(198,245,63,0.25)',
        card: '0 10px 40px -12px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
}
