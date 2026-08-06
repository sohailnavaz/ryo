import type { Config } from 'tailwindcss';

// Ryo brand tokens — source of truth: docs/branding.md §7 (v2.0, "Ryo, after dark").
//
// Neon-noir: a deep ink-void canvas where the PLACES (photos) glow like lit windows.
// The brand evolves rather than resets — terracotta became warm coral, ocean teal
// became electric aqua. Editorial Fraunces in warm white; aqua/coral duotone accents;
// monospace numerals for travel-tech precision.
//
// Token names are unchanged from v1 so no code breaks — only their VALUES flipped to
// dark. `brand` is the hero (electric aqua); `teal` now carries the coral accent.
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Brand — Electric Aqua. The hero: primary CTAs, links, focus, brand moments.
        brand: {
          50: '#0C2B29', // subtle aqua-tint fill on dark (bg-brand-50)
          100: '#0F3B38',
          200: '#15544F',
          300: '#1F7A72',
          400: '#29B8AC',
          500: '#34E7E4', // primary — electric aqua
          600: '#5CEDEA',
          700: '#8DF3F0', // bright aqua for text-on-dark
          800: '#B9F8F6',
          900: '#DDFCFB',
        },
        // Warm Coral — secondary accent (was Ocean Teal slot). Energy, highlights,
        // "hosted" warmth. Descends from v1 terracotta.
        teal: {
          50: '#2E1512',
          100: '#3A1A15',
          300: '#C85B4B',
          500: '#FF6B5C', // coral
          600: '#FF8577',
          700: '#FFA095',
        },
        // Ink — now warm WHITE on the void (primary text + headings).
        ink: {
          DEFAULT: '#F3F4F8',
          soft: '#A6AAB8', // secondary text
          muted: '#6B6F80', // tertiary text
        },
        // Neutrals — cool dark greys (never pure black, never pure grey).
        warm: {
          50: '#101018',
          100: '#16161F',
          200: '#20202C',
          300: '#2A2A3A', // borders/dividers
          500: '#6B6F80',
          700: '#A6AAB8', // body text
          900: '#F3F4F8',
        },
        // Surfaces — ink-void canvas + glass cards.
        surface: {
          DEFAULT: '#14141C', // card / elevated surface
          alt: '#1E1E2A', // higher surface
          border: '#2A2A3A', // hairline
        },
        cream: '#0A0A0F', // the page canvas — deep ink void
        sand: '#1E1E2A',
        // Semantic — tuned for dark.
        success: '#3DDC97',
        warning: '#F5B94D',
        danger: '#FF6B5C', // coral doubles as danger — one warm alarm colour
        info: '#4DA6FF',
      },
      fontFamily: {
        // Inter (body) + Fraunces (editorial display) + JetBrains Mono (numerals,
        // codes, prices — the travel-tech precision layer).
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
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
        // On the void, depth comes from GLOW, not drop shadow. These stay subtle;
        // the aqua glow lives in globals.css as `.glow-*` utilities.
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 40px rgba(0,0,0,0.55)',
        pop: '0 24px 60px rgba(0,0,0,0.7)',
        soft: '0 2px 20px rgba(0,0,0,0.4)',
        glow: '0 0 0 1px rgba(52,231,228,0.35), 0 8px 30px rgba(52,231,228,0.22)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};

export default preset;
