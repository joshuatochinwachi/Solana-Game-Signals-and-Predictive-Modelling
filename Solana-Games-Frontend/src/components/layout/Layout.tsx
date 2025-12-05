import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackgroundAnimation } from '../ui/BackgroundAnimation';
import { LiveTicker } from '../ui/LiveTicker';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary transition-colors duration-300 relative overflow-x-hidden">
            <BackgroundAnimation />
            <Header />
            <LiveTicker />
            <main className="flex-grow container mx-auto px-4 py-8 z-10 relative">
                {children}
            </main>
            <Footer />
        </div>
    );
};
