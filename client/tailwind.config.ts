import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F2A33',
        slate2: '#41565F',
        paper: '#F1F3F1',
        seal: '#0F4C5C',
        sealSoft: '#E2ECEE',
        flag: '#8A5A0B'
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      opacity: {
        12: '0.12',
        15: '0.15'
      },
      boxShadow: {
        plate: '0 1px 0 0 rgba(15,42,51,0.08), 0 8px 24px -16px rgba(15,42,51,0.45)'
      }
    }
  },
  plugins: []
};

export default config;
