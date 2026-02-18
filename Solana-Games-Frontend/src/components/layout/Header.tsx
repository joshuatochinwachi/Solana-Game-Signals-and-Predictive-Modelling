import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LiveIndicator } from '../ui/LiveIndicator';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-bg-primary/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-solana-gradient rounded-full opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
                        <div className="relative bg-bg-primary rounded-full p-2">
                            <Gamepad2 className="w-6 h-6 text-solana-purple" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-gaming md:text-xl text-lg font-bold bg-clip-text text-transparent bg-solana-gradient line-clamp-1">
                            SOLANA GAMING ANALYTICS
                        </h1>
                        <span className="text-[10px] font-mono text-text-secondary tracking-widest uppercase hidden md:block">
                            Player Behavior Modeling & Predictive Forecasting
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex">
                        <LiveIndicator />
                    </div>

                    {/* Real Wallet Connect Button */}
                    <div className="wallet-adapter-button-trigger">
                        <WalletMultiButton />
                    </div>


                </div>
            </div>
        </header>
    );
};
