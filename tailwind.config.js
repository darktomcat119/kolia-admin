/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E07A2F',
          light: '#F4A261',
          dark: '#C4631E',
          muted: '#FDF0E4',
        },
        secondary: {
          DEFAULT: '#1B5E3A',
          light: '#2D8B5E',
        },
        accent: '#D4A745',
        background: '#FAFAF7',
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F5F3EF',
        },
        border: {
          DEFAULT: '#E8E4DD',
          light: '#F0ECE6',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '50%': { transform: 'scale(1.12) translate(-1%, -1%)' },
          '100%': { transform: 'scale(1) translate(0, 0)' },
        },
        'ken-burns-1': {
          '0%':   { transform: 'scale(1)    translate(0%,  0%)' },
          '100%': { transform: 'scale(1.14) translate(-2%, -2%)' },
        },
        'ken-burns-2': {
          '0%':   { transform: 'scale(1.1)  translate(-2%, 0%)' },
          '100%': { transform: 'scale(1)    translate(2%,  1%)' },
        },
        'ken-burns-3': {
          '0%':   { transform: 'scale(1)    translate(1%,  2%)' },
          '100%': { transform: 'scale(1.12) translate(-1%, -1%)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.6' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(224,122,47,0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(224,122,47,0.3)' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'blur-in': {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-up-1': 'fade-up 0.5s 0.1s ease-out both',
        'fade-up-2': 'fade-up 0.5s 0.2s ease-out both',
        'fade-up-3': 'fade-up 0.5s 0.3s ease-out both',
        'fade-up-4': 'fade-up 0.5s 0.4s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-in-right': 'slide-in-right 0.4s ease-out both',
        'ken-burns': 'ken-burns 20s ease-in-out infinite',
        'ken-burns-1': 'ken-burns-1 6s ease-out forwards',
        'ken-burns-2': 'ken-burns-2 6s ease-out forwards',
        'ken-burns-3': 'ken-burns-3 6s ease-out forwards',
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-up-fade': 'slide-up-fade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'blur-in': 'blur-in 0.6s ease-out both',
        'progress-fill': 'progress-fill 4.5s linear',
      },
    },
  },
  plugins: [],
};
