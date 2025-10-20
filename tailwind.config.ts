import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF7210',
        secondary: '#FFFAF0',
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
