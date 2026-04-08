import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0A0E1A',
          secondary: '#111827',
          card: '#1A2234',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#60A5FA',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#6B7280',
        border: {
          DEFAULT: '#1F2937',
          light: '#374151',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float 3s ease-in-out infinite 1s',
        'float-delayed-2': 'float 3s ease-in-out infinite 2s',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'count-up': 'count-up 2s ease-out forwards',
        'typewriter': 'typewriter 2s steps(20) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
