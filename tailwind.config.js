/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gsu': {
          'blue': '#0039A6',        // Georgia State Blue - Primary
          'red': '#CC0000',         // Red Accent - Secondary
          'cool-blue': '#0071CE',   // Cool Blue - Secondary
          'vibrant-blue': '#00AEEF', // Vibrant Blue - Secondary
          'light-blue': '#97CAEB',  // Light Blue - Secondary
          'cool-grey': '#767679',   // Cool Gray 9 - Secondary
          'white': '#FFFFFF',       // White - Primary
          'dark': '#333333',        // Dark text
          'medium-grey': '#CCCCCC', // Medium Grey for borders
        },
        // Keep robinson colors for backward compatibility during transition
        'robinson': {
          'blue': '#0039A6',
          'red': '#CC0000',
          'light-blue': '#97CAEB',
          'white': '#FFFFFF',
          'cool-grey': '#767679',
          'grey': '#767679',
          'dark': '#333333',
          'medium-grey': '#CCCCCC',
          'legacy-navy': '#001F5B',
          'pioneer-green': '#006E42',
          'vibrant-blue': '#00AEEF',
          'night-red': '#770520'
        }
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
