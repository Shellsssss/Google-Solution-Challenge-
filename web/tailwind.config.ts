import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background tokens
        background: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card:      'var(--bg-card)',
        },
        // Named design tokens — with alpha-value support via RGB tuples
        accent: {
          DEFAULT: 'rgb(var(--accent-tw) / <alpha-value>)',
          hover:   'var(--accent-hover-hex)',
          light:   'var(--accent-light-hex)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-tw) / <alpha-value>)',
          dark:    'var(--brand-dark)',
          soft:    'var(--brand-soft)',
        },
        success: 'rgb(var(--success-tw) / <alpha-value>)',
        warning: 'rgb(var(--warning-tw) / <alpha-value>)',
        danger:  'rgb(var(--danger-tw) / <alpha-value>)',
        muted:   'rgb(var(--muted-tw) / <alpha-value>)',
        foreground: 'rgb(var(--foreground-tw) / <alpha-value>)',
        // Border tokens
        border: {
          DEFAULT: 'var(--line)',
          light:   'var(--border-lt)',
        },
        // Ink tokens
        ink: {
          DEFAULT: 'var(--ink)',
          soft:    'var(--ink-soft)',
        },
        // Surface
        surface: 'var(--surface)',
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'Noto Sans', 'sans-serif'],
        head: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
      },
      borderRadius: {
        's': 'var(--radius-s)',
        DEFAULT: 'var(--radius)',
        'l': 'var(--radius-l)',
      },
      boxShadow: {
        'ja': 'var(--shadow)',
      },
    },
  },
  plugins: [],
};
export default config;
