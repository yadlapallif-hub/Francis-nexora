import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // FRANCIS — Bay of Bengal edition. Token names kept for compatibility;
        // values are drawn from the seaside photograph (sky, turquoise sea, moss rock).
        navy: '#062A3A',      // deep abyssal sea-teal (was #0A0A0C)
        electric: '#0E8A9C',  // coastal sea-teal accent (was red #E10600)
        skylight: '#F2F7F7',  // foam white (was #F5F5F4)
        mist: '#EDF3F3',      // pale sea-mist surface (was #F6F6F6)
        ink: '#122E38',       // deep sea-slate text (was #141414)
        royaldeep: '#0D3748', // raised panel on abyss (was #17171A)
        sand: '#E4D5B4',      // warm shore sand — gradient warm stop
        pop: '#3AD2DE',       // bright seafoam pop for dark scenes
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px rgba(14,138,156, 0.38)',
        glowsm: '0 0 24px rgba(14,138,156, 0.30)',
        card: '0 24px 60px -18px rgba(6,42,58, 0.30)',
        glass: '0 8px 40px rgba(6,42,58, 0.14)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(rgba(58,210,222,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(58,210,222,0.09) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(ellipse at center, transparent 30%, #062A3A 78%)',
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
