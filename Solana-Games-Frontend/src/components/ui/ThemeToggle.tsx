import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors border border-border"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5 text-solana-purple" />
            ) : (
                <Sun className="w-5 h-5 text-solana-cyan" />
            )}
        </button>
    );
};
