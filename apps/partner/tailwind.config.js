/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - matches packages/shared/constants/colors.ts
        primary: {
          DEFAULT: '#00B14F',  // Primary green
          dark: '#00A043',     // Hover/pressed states
          light: '#F0FDF4',    // Backgrounds
        },
        secondary: {
          DEFAULT: '#1E293B',  // Dark gray
          light: '#334155',    // Lighter gray
        },
        // Status colors
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      spacing: {
        // Match SPACING constants from shared
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
        'xxxl': '32px',
      },
      borderRadius: {
        // Match RADIUS constants from shared
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
      },
    },
  },
  plugins: [],
}
