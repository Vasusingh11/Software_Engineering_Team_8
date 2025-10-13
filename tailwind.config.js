/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gsu': {
          'blue': '#0039A6',
          'cool-blue': '#0071CE',
          'vibrant-blue': '#00AEEF',
          'light-blue': '#97CAEB',
          'cool-grey': '#767679',
          'white': '#FFFFFF',
          'medium-grey': '#CCCCCC',
        },
      },
      fontFamily: {
        'primary': [
          'Lato',
          'Arial',
          'Helvetica',
          'sans-serif'
        ], // Primary: Lato (GSU Web Font) with Arial fallback
        'secondary': [
          'Oswald',
          'Arial Narrow',
          'Helvetica Condensed',
          'Arial',
          'sans-serif'
        ], // Secondary: Oswald (GSU Marquee Title Font) with Arial fallback
        'gill-sans': [
          'Gill Sans',
          'Gill Sans MT',
          'Arial',
          'sans-serif'
        ], // GSU Primary Typography: Gill Sans with Arial fallback
        'usherwood': [
          'ITC Usherwood Book',
          'Georgia',
          'Times New Roman',
          'serif'
        ], // GSU Secondary Typography: ITC Usherwood Book with serif fallback
        'system': [
          'Arial',
          'Helvetica',
          'sans-serif'
        ] // System default: Arial
      }
    },
  },
  plugins: [],
}