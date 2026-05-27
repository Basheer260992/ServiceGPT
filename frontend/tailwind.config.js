/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Refined enterprise blue (deeper, less saturated than the prior brand)
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b9d2ff',
          300: '#8bb5ff',
          400: '#5e93fb',
          500: '#3b73f1',
          600: '#2557d8',
          700: '#1d44b0',
          800: '#1c3a8c',
          900: '#1c3470',
          950: '#142255',
        },
        // Neutral surface tones tuned for both modes
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 0 0 rgb(15 23 42 / 0.04), 0 1px 2px 0 rgb(15 23 42 / 0.04)',
        elevated: '0 2px 4px -2px rgb(15 23 42 / 0.06), 0 4px 12px -4px rgb(15 23 42 / 0.08)',
        focus: '0 0 0 3px rgb(59 115 241 / 0.18)',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.625rem',
        '2xl': '0.875rem',
      },
    },
  },
  plugins: [],
};
