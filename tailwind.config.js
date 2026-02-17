import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
      },
      fontFamily: {
        jetbrains: ['"JetBrainsMono"', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
        sourcehan: ['"SourceHanHeavyMin"', 'sans-serif'],
        dela: ['"DelaGothicOne"', 'sans-serif'],
        consolas: ['Consolas', 'monospace'],
        sans: ['sans-serif'],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "dark",
      defaultExtendTheme: "dark",
    })
] ,
}
