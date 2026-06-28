import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      colors: {
        primary: {
          DEFAULT: colors.zinc[900],
          dark: colors.zinc[950],
          muted: colors.zinc[700],
          contrast: colors.zinc[50],
        },
        background: colors.neutral[50],
        surface: colors.white,
        border: colors.neutral[200],
        muted: colors.neutral[500],
        success: {
          DEFAULT: colors.emerald[600],
          light: colors.emerald[100],
          dark: colors.emerald[700],
        },
        warning: {
          DEFAULT: colors.amber[500],
          light: colors.amber[100],
          dark: colors.amber[700],
        },
        error: {
          DEFAULT: colors.rose[600],
          light: colors.rose[100],
          dark: colors.rose[700],
        },
        info: {
          DEFAULT: colors.sky[600],
          light: colors.sky[100],
          dark: colors.sky[700],
        },
      },
      spacing: {
        7.5: '1.875rem',
        9: '2.25rem',
        11: '2.75rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(15, 23, 42, 0.08)',
        card: '0 10px 24px -12px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        elevated: '0 20px 45px -20px rgba(15, 23, 42, 0.12)',
        pop: '0 24px 60px -30px rgba(15, 23, 42, 0.18)',
      },
      lineHeight: {
        relaxed: '1.75',
        loose: '2',
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        wide: '0.01em',
      },
    },
  },
  plugins: [],
};
