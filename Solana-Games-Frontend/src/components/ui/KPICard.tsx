import React from 'react';
import { GlassCard } from './GlassCard';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: number; // Percentage change
    trendLabel?: string;
    icon?: React.ReactNode;
    color?: 'default' | 'purple' | 'cyan' | 'green' | 'red' | 'yellow';
    tooltipText?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    trend,
    trendLabel,
    icon,
    color = 'default',
    tooltipText
}) => {
    const getTrendColor = (trend: number) => {
        if (trend > 0) return 'text-solana-cyan';
        if (trend < 0) return 'text-risk-high';
        return 'text-text-secondary';
    };

    const getTrendIcon = (trend: number) => {
        if (trend > 0) return <ArrowUpRight className="w-4 h-4" />;
        if (trend < 0) return <ArrowDownRight className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    return (
        <GlassCard className="h-full flex flex-col justify-between group relative overflow-visible">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">{title}</h3>
                    {tooltipText && (
                        <div className="relative group/tooltip">
                            <Info className="w-3.5 h-3.5 text-text-secondary cursor-help hover:text-text-primary transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                {tooltipText}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-bg-tertiary" />
                            </div>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`p-2 rounded-lg bg-bg-tertiary/50 ${color === 'purple' ? 'text-solana-purple' :
                        color === 'cyan' ? 'text-solana-cyan' :
                            color === 'green' ? 'text-risk-low' :
                                color === 'red' ? 'text-risk-high' :
                                    color === 'yellow' ? 'text-risk-medium' :
                                        'text-text-primary'
                        }`}>
                        {icon}
                    </div>
                )}
            </div>

            <div>
                <div className="text-3xl font-bold font-gaming mb-2">{value}</div>

                {trend !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`flex items-center font-medium ${getTrendColor(trend)}`}>
                            {getTrendIcon(trend)}
                            {Math.abs(trend)}%
                        </span>
                        {trendLabel && <span className="text-text-secondary">{trendLabel}</span>}
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
