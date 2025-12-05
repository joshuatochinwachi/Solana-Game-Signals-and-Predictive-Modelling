import React from 'react';

export const LiveIndicator: React.FC = () => {
    return (
        <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-solana-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-solana-cyan"></span>
            </div>
            <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">Live</span>
        </div>
    );
};
