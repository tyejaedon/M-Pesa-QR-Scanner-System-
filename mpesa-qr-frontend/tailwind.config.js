/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- Critical for the Toggle to work
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B00',
          black: '#121212', // Used for Dark Mode backgrounds
          gray: '#1E1E1E',  // Used for Dark Mode Cards/Borders
        }
      },
      // Optional: Add custom animation extension if you want the fades to be smoother
    },
  },
  plugins: [
    require("tailwindcss-animate"), // Recommended for the 'animate-in' classes used in Hero
  ],
}