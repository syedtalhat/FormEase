import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#004149',
        'primary-container': '#0E5A64',
        'primary-pressed': '#0A4249',
        'primary-tint': '#E3F0F1',
        'surface-page': '#F3F6F7',
        'surface-card': '#FFFFFF',
        'surface-muted': '#ECEFF1',
        'text-primary': '#1F2D36',
        'text-secondary': '#4A5B66',
        'text-disabled': '#8A98A1',
        'border-subtle': '#DDE4E8',
        'border-strong': '#6B7B85',
        'source-official': '#17724A',
        'source-official-bg': '#E4F4EC',
        'source-page': '#2A5DA8',
        'source-page-bg': '#E6EEFA',
        'source-ai': '#5E479B',
        'source-ai-bg': '#EFEBFA',
        'tag-required': '#0E5A64',
        'tag-optional': '#4A5B66',
        'tag-unusual': '#8F4200',
        'tag-unusual-bg': '#FFEBD5',
        danger: '#B3261E',
        'danger-bg': '#FDECEA',
        marigold: '#F2A93B',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['"Mukta"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        floating: '0 1px 3px rgba(31,45,54,.14), 0 12px 28px rgba(14,90,100,.18)',
        panel: '-8px 0 32px rgba(14, 90, 100, 0.20), -1px 0 0 #CBD5DB',
        alert: '0 12px 32px rgba(179, 38, 30, 0.18), 0 1px 2px rgba(31, 45, 54, 0.18)',
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config;
