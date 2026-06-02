import { THEME_CLASS_SAFELIST } from './src/utils/themeClasses.js'

/** Platte lijst van alle theme-tokens zodat JIT ze nooit purged. */
const themeSafelist = [
  ...new Set(
    THEME_CLASS_SAFELIST.flatMap((classString) =>
      classString.split(/\s+/).filter(Boolean),
    ),
  ),
]

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: themeSafelist,
  theme: {
    extend: {
      colors: {
        creme: {
          50: '#F7F2EA',
          100: '#F0EAE0',
          150: '#EAE3D7',
          200: '#DDD4C4',
          300: '#CFC4B2',
          paper: '#FFFBF5',
          ink: '#3D3832',
          muted: '#6B6358',
          faint: '#8A8174',
        },
      },
    },
  },
  plugins: [],
}
