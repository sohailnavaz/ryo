import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Brand — warm coral, evoking the Airbnb "Rausch" hue without copying it
        brand: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc5c5',
          300: '#ff9d9d',
          400: '#ff6464',
          500: '#ff385c', // primary
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        ink: {
          DEFAULT: '#222222',
          soft: '#717171',
          muted: '#b0b0b0',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f7f7f7',
          border: '#ebebeb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cereal"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xxs: ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        pop: '0 6px 20px rgba(0,0,0,0.12)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};

export default preset;
