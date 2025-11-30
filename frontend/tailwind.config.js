const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        mono: ['var(--font-fira-code)', ...fontFamily.mono],
      },
      colors: {
        // Carbon marketplace brand colors
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Carbon marketplace specific colors
        carbon: {
          leaf: '#22c55e',
          forest: '#15803d',
          earth: '#a3a3a3',
          sky: '#3b82f6',
          ocean: '#0891b2',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'carbon': '0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -1px rgba(34, 197, 94, 0.06)',
        'carbon-lg': '0 10px 15px -3px rgba(34, 197, 94, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.05)',
        'inner-carbon': 'inset 0 2px 4px 0 rgba(34, 197, 94, 0.06)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-lg': '0 0 40px rgba(34, 197, 94, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-carbon': 'pulseCarbonBrand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 1s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-carbon': 'pingCarbon 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'flash': 'flash 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulseCarbonBrand: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.7',
          },
        },
        bounceGentle: {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'none',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        pingCarbon: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        flash: {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
          '50%': { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      backdropBlur: {
        'carbon': '12px',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'underline',
              textDecorationColor: 'rgb(34 197 94 / 0.5)',
              '&:hover': {
                textDecorationColor: 'rgb(34 197 94)',
              },
            },
            h1: {
              color: 'inherit',
            },
            h2: {
              color: 'inherit',
            },
            h3: {
              color: 'inherit',
            },
            h4: {
              color: 'inherit',
            },
            strong: {
              color: 'inherit',
            },
            code: {
              color: 'inherit',
            },
            blockquote: {
              color: 'inherit',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Custom plugin for carbon marketplace utilities
    function({ addUtilities, addComponents, theme }) {
      addUtilities({
        '.bg-gradient-carbon': {
          'background-image': 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(21 128 61) 100%)',
        },
        '.bg-gradient-carbon-soft': {
          'background-image': 'linear-gradient(135deg, rgba(34 197 94 / 0.1) 0%, rgba(21 128 61 / 0.05) 100%)',
        },
        '.text-gradient-carbon': {
          'background-image': 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(21 128 61) 100%)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
        },
        '.border-gradient-carbon': {
          'border': '1px solid',
          'border-image': 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(21 128 61) 100%) 1',
        },
        '.glassmorphism': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glassmorphism-dark': {
          'background': 'rgba(0, 0, 0, 0.1)',
          'backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
      });

      addComponents({
        '.card': {
          'background-color': theme('colors.white'),
          'border-radius': theme('borderRadius.lg'),
          'padding': theme('spacing.6'),
          'box-shadow': theme('boxShadow.md'),
          'border': `1px solid ${theme('colors.gray.200')}`,
        },
        '.card-dark': {
          'background-color': theme('colors.gray.800'),
          'border-color': theme('colors.gray.700'),
        },
        '.btn': {
          'padding': `${theme('spacing.2')} ${theme('spacing.4')}`,
          'border-radius': theme('borderRadius.md'),
          'font-weight': theme('fontWeight.medium'),
          'transition': 'all 0.2s ease-in-out',
          'cursor': 'pointer',
          'display': 'inline-flex',
          'align-items': 'center',
          'gap': theme('spacing.2'),
        },
        '.btn-primary': {
          'background-color': theme('colors.primary.600'),
          'color': theme('colors.white'),
          '&:hover': {
            'background-color': theme('colors.primary.700'),
            'transform': 'translateY(-1px)',
            'box-shadow': theme('boxShadow.lg'),
          },
          '&:active': {
            'transform': 'translateY(0)',
          },
          '&:disabled': {
            'background-color': theme('colors.gray.400'),
            'cursor': 'not-allowed',
            'transform': 'none',
          },
        },
        '.btn-secondary': {
          'background-color': theme('colors.white'),
          'color': theme('colors.gray.700'),
          'border': `1px solid ${theme('colors.gray.300')}`,
          '&:hover': {
            'background-color': theme('colors.gray.50'),
            'transform': 'translateY(-1px)',
            'box-shadow': theme('boxShadow.md'),
          },
          '&:active': {
            'transform': 'translateY(0)',
          },
          '&:disabled': {
            'background-color': theme('colors.gray.100'),
            'color': theme('colors.gray.400'),
            'cursor': 'not-allowed',
            'transform': 'none',
          },
        },
        '.btn-carbon': {
          'background': 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(21 128 61) 100%)',
          'color': theme('colors.white'),
          '&:hover': {
            'background': 'linear-gradient(135deg, rgb(21 128 61) 0%, rgb(34 197 94) 100%)',
            'transform': 'translateY(-2px)',
            'box-shadow': theme('boxShadow.carbon-lg'),
          },
          '&:active': {
            'transform': 'translateY(0)',
          },
        },
      });
    },
  ],
};