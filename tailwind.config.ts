import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#071B3A',
        electric: '#2563EB',
        mist: '#EAF2FF',
        soft: '#F5F7FB',
        ink: '#101828',
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', 'Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px rgba(37, 99, 235, 0.35)',
        card: '0 20px 60px -20px rgba(7, 27, 58, 0.35)',
        soft: '0 8px 30px -12px rgba(7, 27, 58, 0.25)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.35), transparent)',
        'grid-faint': 'linear-gradient(rgba(7,27,58,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(7,27,58,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'float-slow': 'floatY 7s ease-in-out infinite',
        'float-slower': 'floatY 10s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 14s linear infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
