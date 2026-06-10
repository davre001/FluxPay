import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        surface: {
          900: '#0a0a0f',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        'shimmer': {
          'from': { backgroundPosition: '-200% 0' },
          'to':   { backgroundPosition: '200% 0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to':   { transform: 'rotate(360deg)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up':  'fade-in-up 0.6s ease-out forwards',
        'float':       'float 6s ease-in-out infinite',
        'glow':        'glow 4s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'pulse-slow':  'pulse-slow 3s ease-in-out infinite',
        'spin-slow':   'spin-slow 8s linear infinite',
        'gradient-x':  'gradient-x 6s ease infinite',
        'slide-up':    'slide-up 0.5s ease-out forwards',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(124, 58, 237, 0.35)',
        'glow':     '0 0 24px rgba(124, 58, 237, 0.45)',
        'glow-lg':  '0 0 48px rgba(124, 58, 237, 0.5)',
        'glow-cyan':'0 0 24px rgba(6, 182, 212, 0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
