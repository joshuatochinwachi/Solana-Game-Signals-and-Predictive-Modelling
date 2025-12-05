import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { HighRetentionUser } from '../../../types/api';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import type { ColumnDef } from '@tanstack/react-table';
import { Users, Award, ExternalLink, Star } from 'lucide-react';

export const HighRetentionUsersFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<HighRetentionUser>('/api/analytics/high-retention-users');

    const kpis = useMemo(() => {
        if (!data?.data) return { total: 0, avgRate: 0, loyalGame: '-' };

        console.log('🔍 HighRetentionUsers DEBUG - Data sample:', data.data[0]);

        const total = data.data.length;
        const avgRate = data.data.reduce((sum, curr) => sum + safeNumber(curr.retention_rate_pct || curr['retention rate %']), 0) / (total || 1);

        // Find most loyal game (most high retention users)
        const byGame = data.data.reduce((acc, curr) => {
            const game = curr.game || curr['game project'] || 'Unknown';
            acc[game] = (acc[game] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const loyalGame = Object.entries(byGame).sort((a, b) => b[1] - a[1])[0];

        return {
            total,
            avgRate: Math.round(avgRate),
            loyalGame: loyalGame ? loyalGame[0] : '-'
        };
    }, [data]);

    const columns = useMemo(() => [
        {
            key: 'user',
            label: 'User Wallet',
            render: (val: any, row: any) => {
                const user = val || row.user || row.wallet || 'Unknown';
                return (
                    <a
                        href={`https://solscan.io/account/${user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-solana-purple hover:text-solana-cyan transition-colors flex items-center gap-2"
                    >
                        {user.slice(0, 6)}...{user.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            },
        },
        {
            key: 'game',
            label: 'Game',
            render: (val: any, row: any) => <span className="font-medium">{val || row['game project'] || row.game}</span>,
        },
        {
            key: 'retention_rate_pct',
            label: 'Retention Rate',
            render: (val: any, row: any) => {
                const rate = safeNumber(val || row['retention rate %']);
                let badgeColor = 'bg-gray-500';
                let badgeIcon = null;

                if (rate === 100) {
                    badgeColor = 'bg-yellow-500 shadow-lg shadow-yellow-500/20';
                    badgeIcon = <Award className="w-3 h-3 text-white" />;
                } else if (rate >= 90) {
                    badgeColor = 'bg-gray-300 shadow-lg shadow-gray-300/20';
                    badgeIcon = <Award className="w-3 h-3 text-gray-800" />;
                } else if (rate >= 70) {
                    badgeColor = 'bg-orange-400 shadow-lg shadow-orange-400/20';
                    badgeIcon = <Award className="w-3 h-3 text-white" />;
                }

                return (
                    <div className="flex items-center gap-2">
                        <div className="w-full bg-bg-tertiary rounded-full h-2 max-w-[100px]">
                            <div
                                className={`h-full rounded-full ${rate === 100 ? 'bg-yellow-500' :
                                    rate >= 90 ? 'bg-solana-cyan' :
                                        rate >= 70 ? 'bg-solana-purple' : 'bg-text-secondary'
                                    }`}
                                style={{ width: `${rate}%` }}
                            />
                        </div>
                        <span className="font-bold w-12">{rate}%</span>
                        {badgeIcon && (
                            <div className={`p-1 rounded-full ${badgeColor}`}>
                                {badgeIcon}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'weeks_active',
            label: 'Weeks Active',
            render: (val: any, row: any) => (
                <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-solana-cyan" />
                    {safeNumber(val || row['weeks active'])}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (val: any, row: any) => {
                const status = (val || row.status || 'active').toLowerCase();
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${status === 'active' ? 'bg-risk-low/20 text-risk-low' : 'bg-risk-medium/20 text-risk-medium'
                        }`}>
                        {status.toUpperCase()}
                    </span>
                );
            },
        },
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading high retention users...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Power Users"
                    value={kpis.total.toLocaleString()}
                    icon={<Users className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Avg Retention Rate"
                    value={`${kpis.avgRate}%`}
                    icon={<Award className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Most Loyal Game"
                    value={kpis.loyalGame}
                    icon={<Star className="w-4 h-4" />}
                    color="yellow"
                />
            </div>

            <CompleteDataTable
                data={data?.data || []}
                columns={columns}
                title="High Retention Leaderboard"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
