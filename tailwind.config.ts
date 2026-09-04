import type { Config } from 'tailwindcss';

// Design tokens — Deep Navy + Teal, defined as CSS variables (see
// app/globals.css) so every class here automatically swaps between light
// and dark theme values with zero per-component changes.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: 'rgb(var(--color-ink-950) / <alpha-value>)', // headings/primary text
          900: 'rgb(var(--color-ink-900) / <alpha-value>)', // secondary / links
          800: 'rgb(var(--color-ink-800) / <alpha-value>)', // body text
          700: 'rgb(var(--color-ink-700) / <alpha-value>)', // muted text
          100: 'rgb(var(--color-paper-200) / <alpha-value>)', // light neutral fill (placeholders etc.)
        },
        paper: {
          50: 'rgb(var(--color-paper-50) / <alpha-value>)',   // page background
          100: 'rgb(var(--color-paper-100) / <alpha-value>)', // surface / card
          200: 'rgb(var(--color-paper-200) / <alpha-value>)', // border
        },
        signal: {
          400: 'rgb(var(--color-signal-400) / <alpha-value>)', // link accent
          500: 'rgb(var(--color-signal-500) / <alpha-value>)', // primary brand
          600: 'rgb(var(--color-signal-600) / <alpha-value>)', // hover
        },
        status: {
          good: 'rgb(var(--color-status-good) / <alpha-value>)',
          warn: 'rgb(var(--color-status-warn) / <alpha-value>)',
          bad: 'rgb(var(--color-status-bad) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'], // Manrope
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],       // Inter
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
