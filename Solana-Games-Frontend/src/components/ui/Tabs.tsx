import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: string;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="w-full border-b border-border mb-8">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            px-6 py-3 font-gaming font-bold text-sm whitespace-nowrap transition-all relative
                            ${activeTab === tab.id
                                ? 'text-text-primary border-b-2 border-solana-cyan'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                            }
                        `}
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-solana-purple via-solana-cyan to-solana-purple animate-shimmer" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
