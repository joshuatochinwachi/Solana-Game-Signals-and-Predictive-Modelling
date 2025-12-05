import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import type { HighRetentionUser, ChurnResponse } from '../../types/api';
import { Trophy, ExternalLink } from 'lucide-react';

export const EliteScroller: React.FC = () => {
    const { data: retentionData } = useAutoRefresh<HighRetentionUser>('/api/analytics/high-retention-users');
    const { data: churnData } = useAutoRefresh<ChurnResponse>('/api/ml/predictions/churn?method=ensemble');

    const eliteGamers = useMemo(() => {
        if (!retentionData?.data || !churnData?.data) return [];

        // Get churn predictions map
        const churnMap = new Map(
            churnData.data[0]?.predictions.map(p => [p.user_wallet, p]) || []
        );

        // Filter and sort high retention users
        return retentionData.data
            .sort((a, b) => b.retention_rate_pct - a.retention_rate_pct)
            .slice(0, 20)
            .map(user => {
                const prediction = churnMap.get(user.user);
                return {
                    ...user,
                    churnRisk: prediction?.risk_level || 'Unknown',
                    churnProb: prediction?.churn_probability || 0
                };
            });
    }, [retentionData, churnData]);

    if (eliteGamers.length === 0) return null;

    // Duplicate list for seamless scrolling
    const displayList = [...eliteGamers, ...eliteGamers];

    return (
        <div className="w-full bg-bg-secondary/50 border-y border-border backdrop-blur-sm overflow-hidden py-2">
            <div className="flex animate-scroll hover:pause">
                {displayList.map((gamer, index) => (
                    <div
                        key={`${gamer.user}-${index}`}
                        className="flex items-center gap-4 px-8 min-w-max border-r border-border/30 last:border-r-0"
                    >
                        <div className="flex items-center gap-2 text-solana-purple">
                            <Trophy className="w-4 h-4" />
                            <span className="font-gaming font-bold text-sm">ELITE GAMER</span>
                        </div>

                        <a
                            href={`https://solscan.io/account/${gamer.user}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs hover:text-solana-cyan transition-colors flex items-center gap-1"
                        >
                            {gamer.user.slice(0, 4)}...{gamer.user.slice(-4)}
                            <ExternalLink className="w-3 h-3" />
                        </a>

                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-text-secondary">
                                Retention: <span className="text-text-primary font-bold">{gamer.retention_rate_pct}%</span>
                            </span>

                            <span className="text-text-secondary">
                                Risk:
                                <span className={`ml-1 font-bold ${gamer.churnRisk === 'Low' ? 'text-risk-low' :
                                    gamer.churnRisk === 'Medium' ? 'text-risk-medium' :
                                        'text-risk-high'
                                    }`}>
                                    {gamer.churnRisk} ({(gamer.churnProb * 100).toFixed(1)}%)
                                </span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
