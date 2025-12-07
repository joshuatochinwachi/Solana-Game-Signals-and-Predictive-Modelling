import React, { useEffect, useState } from 'react';
import { safeDate } from '../../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://solana-game-signals-and-predictive-modelling-production.up.railway.app';

const formatTimestamp = (timestamp: string): string => {
    try {
        // Ensure the timestamp is treated as UTC by appending 'Z' if not present
        const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
        const date = safeDate(utcTimestamp);

        if (!date) return timestamp;

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC',
            timeZoneName: 'short'
        });
    } catch {
        return timestamp;
    }
};

export const Footer: React.FC = () => {
    const [apiTimestamp, setApiTimestamp] = useState<string>('');
    const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');

    useEffect(() => {
        const fetchApiStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/cache/status`);
                if (!response.ok) throw new Error('API offline');

                const data = await response.json();

                // Get timestamp from first source (all updated simultaneously)
                const sources = data.sources || {};
                const firstSource = Object.values(sources)[0] as any;

                if (firstSource?.last_updated) {
                    setApiTimestamp(formatTimestamp(firstSource.last_updated));
                }

                setApiStatus('online');
            } catch (error) {
                console.error('Failed to fetch API status:', error);
                setApiStatus('offline');
            }
        };

        fetchApiStatus();
        const interval = setInterval(fetchApiStatus, 30000); // Update every 30s

        return () => clearInterval(interval);
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-bg-secondary/90 backdrop-blur-md border-t border-white/10 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3 text-sm z-50">
            <div className="flex items-center gap-2">
                <span className="text-text-secondary">Built with</span>
                <span className="text-red-500 animate-pulse">❤️</span>
                <span className="text-text-secondary">by</span>
                <a
                    href="https://github.com/joshuatochinwachi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-solana-purple hover:text-solana-cyan transition-colors font-bold font-gaming"
                >
                    Josh
                </a>
            </div>

            <div className="font-mono text-text-secondary text-xs">
                {apiTimestamp ? (
                    <>
                        Last Updated: <span className="text-solana-cyan font-semibold">{apiTimestamp}</span>
                    </>
                ) : (
                    <span className="text-text-secondary">Loading timestamp...</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${apiStatus === 'online' ? 'bg-solana-green animate-pulse' : 'bg-red-500'}`} />
                <span className={apiStatus === 'online' ? 'text-solana-green' : 'text-red-500'}>
                    API: {apiStatus === 'online' ? 'Online' : 'Offline'}
                </span>
            </div>
        </footer>
    );
};
