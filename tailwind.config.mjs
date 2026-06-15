/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        board: {
          gold: '#FBBE0A',
          goldDark: '#C99703',
          black: '#000000',
          ink: '#0A0A0A',
          graphite: '#333333',
          slate: '#666666',
          muted: '#999999',
          paper: '#E8E8E8',
        },
      },
      fontFamily: {
        funnel: ['Funnel Display', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '3px 3px 0 #000000',
      },
    },
  },
  plugins: [],
};
