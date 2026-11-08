import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#071B3A',
        electric: '#2563EB',
        skylight: '#EAF2FF',
        mist: '#F5F7FB',
        ink: '#101828',
        royaldeep: '#0A2450',
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px rgba(37, 99, 235, 0.35)',
        glowsm: '0 0 24px rgba(37, 99, 235, 0.28)',
        card: '0 24px 60px -18px rgba(7, 27, 58, 0.25)',
        glass: '0 8px 40px rgba(7, 27, 58, 0.12)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(ellipse at center, transparent 30%, #071B3A 78%)',
      },
      backgroundSize: { grid: '72px 72px' },
      animation: {
        'float-slow': 'float 9s ease-in-out infinite',
        'spin-slower': 'spin 22s linear infinite',
        shimmer: 'shimmer 2.6s linear infinite',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        marquee: 'marquee 26s linear infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-18px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.45', transform: 'scale(.78)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
};

export default config;
