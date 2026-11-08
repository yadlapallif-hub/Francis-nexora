import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0A0A0C',
        electric: '#E10600',
        skylight: '#F5F5F4',
        mist: '#F6F6F6',
        ink: '#141414',
        royaldeep: '#17171A',
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px rgba(225,6,0, 0.35)',
        glowsm: '0 0 24px rgba(225,6,0, 0.28)',
        card: '0 24px 60px -18px rgba(10,10,12, 0.25)',
        glass: '0 8px 40px rgba(10,10,12, 0.12)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(rgba(225,6,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(225,6,0,0.07) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(ellipse at center, transparent 30%, #0A0A0C 78%)',
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
