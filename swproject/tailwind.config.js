/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        discord: {
          main: '#313338',     
          sidebar: '#2b2d31',  
          dark: '#1e1f22',     
          hover: '#3f4147',    
          active: '#404249',   
          blurple: '#5865F2',  
          blurpleHover: '#4752C4',
          success: '#23a559',
          successHover: '#1a7c43',
          danger: '#f23f42',
          dangerHover: '#da373c',
          warning: '#f0b232',
          text: '#dbdee1',     
          textMuted: '#949ba4',
          textHover: '#f2f3f5',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
