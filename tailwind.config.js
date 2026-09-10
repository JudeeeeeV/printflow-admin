/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['"IBM Plex Sans"', 'sans-serif'],
    },
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '9999px',
    },
    extend: {
      colors: {
        'carbon-blue-60': '#0f62fe',
        'carbon-blue-70': '#0353e9',
        'carbon-gray-10': '#f4f4f4',
        'carbon-gray-100': '#161616',
      }
    },
  },
  plugins: [],
}
