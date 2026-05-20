const semanticColor = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

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
        surface: {
          base: semanticColor('--color-surface-base'),
          sidebar: semanticColor('--color-surface-sidebar'),
          panel: semanticColor('--color-surface-panel'),
          raised: semanticColor('--color-surface-raised'),
          hover: semanticColor('--color-surface-hover'),
          active: semanticColor('--color-surface-active'),
        },
        content: {
          primary: semanticColor('--color-content-primary'),
          secondary: semanticColor('--color-content-secondary'),
          muted: semanticColor('--color-content-muted'),
          inverse: semanticColor('--color-content-inverse'),
        },
        border: {
          default: semanticColor('--color-border-default'),
          strong: semanticColor('--color-border-strong'),
          subtle: semanticColor('--color-border-subtle'),
        },
        brand: {
          DEFAULT: semanticColor('--color-brand'),
          hover: semanticColor('--color-brand-hover'),
        },
        status: {
          success: semanticColor('--color-status-success'),
          danger: semanticColor('--color-status-danger'),
          warning: semanticColor('--color-status-warning'),
          info: semanticColor('--color-status-info'),
        },
        chat: {
          ai: semanticColor('--color-chat-ai'),
          streamer: semanticColor('--color-chat-streamer'),
          viewer: semanticColor('--color-chat-viewer'),
        },
        discord: {
          main: semanticColor('--color-surface-base'),
          sidebar: semanticColor('--color-surface-panel'),
          dark: semanticColor('--color-surface-raised'),
          hover: semanticColor('--color-surface-hover'),
          active: semanticColor('--color-surface-active'),
          blurple: semanticColor('--color-brand'),
          blurpleHover: semanticColor('--color-brand-hover'),
          success: semanticColor('--color-status-success'),
          successHover: semanticColor('--color-status-success-hover'),
          danger: semanticColor('--color-status-danger'),
          dangerHover: semanticColor('--color-status-danger-hover'),
          warning: semanticColor('--color-status-warning'),
          text: semanticColor('--color-content-secondary'),
          textMuted: semanticColor('--color-content-muted'),
          textHover: semanticColor('--color-content-primary'),
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
