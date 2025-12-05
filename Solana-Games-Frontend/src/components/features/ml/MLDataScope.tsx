import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { ChurnResponse } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { Filter, Database, Brain, AlertCircle } from 'lucide-react';
import { formatNumber, safeNumber } from '../../../utils/formatters';

export const MLDataScope: React.FC = () => {
    // 1. Total Ecosystem Users (Source: Analytics)
    const { data: gamersData } = useAutoRefresh<any>('/api/analytics/gamers-by-games-played');

    // 2. Analyzed Users (Source: ML Churn Endpoint)
    const { data: churnData } = useAutoRefresh<ChurnResponse>('/api/ml/predictions/churn?method=ensemble');

    const stats = useMemo(() => {
        let totalEcosystemUsers = 0;
        let analyzedUsers = 0;

        // Calculate Total Ecosystem Users
        if (gamersData?.data) {
            totalEcosystemUsers = gamersData.data.reduce((sum: number, curr: any) =>
                sum + safeNumber(curr.number_of_gamers || curr['number of gamers']), 0);
        }

        // Calculate Analyzed Users
        if ((churnData as any)?.summary) {
            analyzedUsers = safeNumber((churnData as any).summary.total_users);
        }

        const excludedUsers = Math.max(0, totalEcosystemUsers - analyzedUsers);
        const coverageParams = ((analyzedUsers / (totalEcosystemUsers || 1)) * 100).toFixed(1);

        return {
            totalEcosystemUsers,
            analyzedUsers,
            excludedUsers,
            coverageParams
        };
    }, [gamersData, churnData]);

    if (!gamersData && !churnData) return null;

    return (
        <GlassCard className="mb-8 border-l-4 border-l-solana-purple">
            <div className="flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-solana-purple/20 border border-solana-purple/50">
                        <Database className="w-6 h-6 text-solana-purple" />
                    </div>
                    <div>
                        <h3 className="text-xl font-gaming font-bold text-white mb-2">
                            ML Data Scope & Analysis Parameters
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-4xl">
                            Out of <strong className="text-white">{formatNumber(stats.totalEcosystemUsers)}</strong> unique ecosystem gamers, <strong className="text-solana-cyan">{formatNumber(stats.analyzedUsers)}</strong> gamers are in the <strong>Analyzed Cohort</strong> (at least 5 days of activity). These users provide sufficient behavioral signals to be analyzed, allowing our ML models to generate accurate churn predictions for the next 14 days.
                        </p>
                    </div>
                </div>

                {/* Funnel Visualization */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-bg-tertiary/30 rounded-xl p-6 border border-border">

                    {/* Total Pool */}
                    <div className="col-span-12 lg:col-span-3 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-border pb-4 lg:pb-0 lg:pr-6">
                        <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Total Ecosystem Users</div>
                        <div className="text-2xl font-mono font-bold text-white mb-2">{formatNumber(stats.totalEcosystemUsers)}</div>
                        <div className="text-xs text-text-tertiary">All connected unique wallets</div>
                    </div>

                    {/* Filter Logic */}
                    <div className="hidden lg:flex col-span-1 justify-center">
                        <Filter className="w-6 h-6 text-text-tertiary" />
                    </div>

                    {/* Excluded Section */}
                    <div className="col-span-12 lg:col-span-4 pl-0 lg:pl-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-risk-high uppercase tracking-wider">Excluded ({formatNumber(stats.excludedUsers)})</span>
                            <div className="h-px flex-1 bg-border"></div>
                        </div>
                        <ul className="space-y-2">
                            <li className="text-xs text-text-secondary flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary mt-1.5"></span>
                                <span><strong>Brand new users</strong> (1-4 days activity) - insufficient historical data</span>
                            </li>
                            <li className="text-xs text-text-secondary flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary mt-1.5"></span>
                                <span><strong>One-time visitors</strong> - no retention pattern to analyze</span>
                            </li>
                            <li className="text-xs text-text-secondary flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary mt-1.5"></span>
                                <span><strong>Already churned</strong> - inactive {'>'} 60 days, no prediction needed</span>
                            </li>
                        </ul>
                    </div>

                    {/* Arrow */}
                    <div className="hidden lg:flex col-span-1 justify-center">
                        <div className="text-solana-cyan">→</div>
                    </div>

                    {/* Analyzed Section */}
                    <div className="col-span-12 lg:col-span-3 bg-solana-cyan/10 rounded-lg p-4 border border-solana-cyan/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Brain className="w-4 h-4 text-solana-cyan" />
                            <div className="text-xs font-bold text-solana-cyan uppercase tracking-wider">Analyzed Cohort</div>
                        </div>
                        <div className="text-2xl font-mono font-bold text-white mb-1">{formatNumber(stats.analyzedUsers)}</div>
                        <div className="text-xs text-solana-cyan/80">
                            Qualifying users with sufficient data depth active in the last 60 days.
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="flex items-center gap-2 text-xs text-text-tertiary border-t border-border pt-4 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                        From the analyzed cohort of <strong className="text-text-secondary">{formatNumber(stats.analyzedUsers)}</strong> users, the table below displays a random sample of <strong className="text-text-secondary">100 wallets</strong> with their specific risk profiles and consistency scores.
                    </span>
                </div>
            </div>
        </GlassCard>
    );
};
