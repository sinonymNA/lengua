/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1a1614',
          secondary: '#242018',
        },
        gold: {
          DEFAULT: '#d4a853',
          light: '#e8c47a',
          dark: '#b8892e',
        },
        terracotta: {
          DEFAULT: '#c4603a',
          light: '#d4784f',
          dark: '#a84d2e',
        },
        cream: {
          DEFAULT: '#f0e8d8',
          secondary: '#9a8e7e',
          muted: '#6b5f51',
        },
        sage: '#5a8a5e',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Crimson Pro"', 'Georgia', 'serif'],
        ui: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'fade-in-slow': 'fadeIn 1.2s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(212, 168, 83, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 168, 83, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
        'vignette': 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)',
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(212, 168, 83, 0.12)',
        'warm-lg': '0 8px 48px rgba(212, 168, 83, 0.18)',
        'inner-warm': 'inset 0 2px 8px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
