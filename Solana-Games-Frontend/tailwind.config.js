/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                solana: {
                    purple: '#9945FF',
                    cyan: '#14F195',
                },
                risk: {
                    high: '#FF4444',
                    medium: '#FFB800',
                    low: '#00E676',
                },
                bg: {
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    tertiary: 'var(--bg-tertiary)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                },
                border: 'var(--border)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                gaming: ['Orbitron', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            backgroundImage: {
                'solana-gradient': 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
            },
            animation: {
                scroll: 'scroll 40s linear infinite',
                shimmer: 'shimmer 3s infinite',
                slideIn: 'slideIn 0.5s ease-out',
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                scroll: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-33.333%)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                }
            }
        },
    },
    plugins: [],
}
