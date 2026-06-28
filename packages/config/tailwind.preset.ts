import type { Config } from 'tailwindcss';

// Ryo brand tokens — source of truth: docs/branding.md §7.
// Warm, editorial, quietly luxurious (omotenashi). Never pure black/white.
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Brand — Terracotta. Reserved for primary CTAs + genuine brand moments.
        brand: {
          50: '#FBF1ED',
          100: '#F5DDD3',
          200: '#EABFAE',
          300: '#DD9C84',
          400: '#D2855F',
          500: '#C87156', // primary — terracotta
          600: '#B15B41',
          700: '#924936',
          800: '#73392B',
          900: '#572C22',
        },
        // Ocean Teal — alternate accent.
        teal: {
          50: '#ECF3F5',
          100: '#CFE0E5',
          300: '#7FA9B4',
          500: '#1F5A6B', // accent
          600: '#194956',
          700: '#143842',
        },
        // Ink Navy — primary text + headings.
        ink: {
          DEFAULT: '#0E1A2B',
          soft: '#5C5750', // warm secondary text
          muted: '#6B6358', // warm tertiary text (Warm 500) — darkened for WCAG AA (≥4.5:1 on Sand)
        },
        // Warm greys (never pure grey).
        warm: {
          50: '#F7F3ED',
          100: '#EFEAE3',
          200: '#E2DACE',
          300: '#CFC7BD', // borders/dividers
          500: '#6B6358', // tertiary text — WCAG AA on Sand (was #8A837B, 3.04:1)
          700: '#4A4540', // body text
          900: '#1C1A17',
        },
        // Surfaces — cream default, sand secondary.
        surface: {
          DEFAULT: '#FAF6F0', // Warm Cream — never pure white
          alt: '#EFE7DA', // Sand — cards / secondary surface
          border: '#CFC7BD', // Warm 300
        },
        cream: '#FAF6F0',
        sand: '#EFE7DA',
        // Semantic.
        success: '#2E7D5B',
        warning: '#C98A2B',
        danger: '#B4432F',
        info: '#356A8C',
      },
      fontFamily: {
        // Inter (body) + Fraunces (display, editorial serif) — wired via next/font.
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        xxs: ['0.625rem', { lineHeight: '0.875rem' }],
        '5xl': ['3.75rem', { lineHeight: '1.05' }],
        '6xl': ['4.5rem', { lineHeight: '1.02' }],
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        // Soft, warm-tinted shadows (no harsh black).
        card: '0 1px 2px rgba(28,26,23,0.04), 0 8px 24px rgba(28,26,23,0.07)',
        pop: '0 12px 36px rgba(28,26,23,0.14)',
        soft: '0 2px 12px rgba(28,26,23,0.06)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};

export default preset;
