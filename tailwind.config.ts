import type { Config } from 'tailwindcss';

// Design tokens — professional ISP identity, not a generic SaaS palette.
// Base: deep navy/charcoal + warm neutral paper + a single signal-blue accent
// borrowed from fiber-optic light, used sparingly (links, active states, CTAs).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1220', // near-black navy, headers/hero backgrounds
          900: '#111A2E',
          800: '#1B263F',
          700: '#2A3B5C',
        },
        paper: {
          50: '#F7F7F5',  // warm off-white, main background
          100: '#EFEFEA',
          200: '#E2E1DA',
        },
        signal: {
          500: '#1E6FE0', // fiber-blue accent — CTAs, links, active nav
          600: '#1859B8',
          400: '#4C8EEF',
        },
        status: {
          good: '#1E8E5A',
          warn: '#B5760B',
          bad: '#C6363B',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
