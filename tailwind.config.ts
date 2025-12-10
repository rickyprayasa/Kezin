import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#F38020',
          dark: '#1D1D1D',
          light: '#F4F4F5',
          accent: '#A78BFA',
          green: '#4ADE80',
          red: '#F87171'
        }
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #1D1D1D',
        'neo-sm': '2px 2px 0px 0px #1D1D1D',
        'neo-lg': '8px 8px 0px 0px #1D1D1D',
      }
    },
  },
  plugins: [],
}

export default config
