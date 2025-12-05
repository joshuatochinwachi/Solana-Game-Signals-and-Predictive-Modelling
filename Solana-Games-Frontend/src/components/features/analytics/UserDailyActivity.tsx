import React, { useMemo, useState } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { UserDailyActivity } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import { format, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, Users, Search, ExternalLink } from 'lucide-react';

export const UserDailyActivityFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<UserDailyActivity>('/api/analytics/user-daily-activity');
    const { data: activityData } = useAutoRefresh<any>('/api/analytics/gaming-activity-total');
    const { data: gamersByGameData } = useAutoRefresh<any>('/api/analytics/gamers-by-games-played');
    const [searchTerm, setSearchTerm] = useState('');

    const kpis = useMemo(() => {
        // Default values from local data if global fetch fails, but prefer global for sync
        let totalTx = 0;
        let activeUsers = 0;

        // 1. Calculate Total Transactions (Sync with GlobalKPIs)
        if (activityData?.data) {
            totalTx = activityData.data.reduce((sum: number, curr: any) => sum + safeNumber(curr.number_of_game_transactions), 0);
        } else if (data?.data) {
            // Fallback
            totalTx = data.data.reduce((sum, curr) => sum + safeNumber(curr.daily_transactions || curr['daily transactions']), 0);
        }

        // 2. Calculate Active Users (Sync with GlobalKPIs)
        if (gamersByGameData?.data) {
            activeUsers = gamersByGameData.data.reduce((sum: number, curr: any) =>
                sum + safeNumber(curr.number_of_gamers || curr['number of gamers']), 0);
        } else if (data?.data) {
            // Fallback
            const getWallet = (item: any) => item.user_wallet || item['user wallet'] || item.wallet || 'Unknown';
            activeUsers = new Set(data.data.map(d => getWallet(d))).size;
        }

        // 3. Calculate Avg Daily Tx / User (Derived from synced numbers if possible, or local log)
        // "Avg Daily Tx / User" implies (Total Tx / Total Users) / Days? 
        // Or just Average per active user? 
        // The previous logic was: totalTx / data.length (which is Total Tx / User-Days).
        // Let's keep the local log logic for this specific metric as it represents "Daily" intensity better than a global average.
        let avgDailyTx = 0;
        if (data?.data && data.data.length > 0) {
            const localTotalTx = data.data.reduce((sum, curr) => sum + safeNumber(curr.daily_transactions || curr['daily transactions']), 0);
            avgDailyTx = localTotalTx / data.data.length;
        }

        return {
            totalTx,
            activeUsers,
            avgDailyTx: avgDailyTx.toFixed(2)
        };
    }, [data, activityData, gamersByGameData]);

    const columns = useMemo(() => [
        {
            key: 'day',
            label: 'Date',
            render: (val: any, row: any) => {
                try {
                    const dateStr = val || row.date;
                    if (!dateStr) return '-';
                    // Handle "YYYY-MM-DD HH:mm:ss.SSS UTC" format
                    const cleanDate = dateStr.split(' ')[0];
                    return format(parseISO(cleanDate), 'MMM dd, yyyy');
                } catch {
                    return val ? String(val).split(' ')[0] : '-';
                }
            },
        },
        {
            key: 'user_wallet',
            label: 'User Wallet',
            render: (val: any, row: any) => {
                const wallet = val || row['user wallet'] || row.wallet || 'Unknown';
                return (
                    <a
                        href={`https://solscan.io/account/${wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-solana-purple hover:text-solana-cyan transition-colors flex items-center gap-2"
                    >
                        {wallet.slice(0, 6)}...{wallet.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            },
        },
        {
            key: 'project',
            label: 'Game',
            render: (val: any, row: any) => <span className="font-medium">{val || row['game project'] || row.game}</span>,
        },
        {
            key: 'daily_transactions',
            label: 'Transactions',
            render: (val: any, row: any) => {
                const tx = safeNumber(val || row['daily transactions']);
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{formatNumber(tx)}</span>
                        {tx > 10 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-solana-cyan/20 text-solana-cyan font-bold">HIGH</span>
                        )}
                    </div>
                );
            },
        },
    ], []);

    // Filter data based on search term (wallet or project)
    // Filter data based on search term (wallet or project)
    const filteredData = useMemo(() => {
        if (!data?.data) return [];
        if (!searchTerm) return data.data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.data.filter(d => {
            const wallet = d.user_wallet || d['user wallet'] || d.wallet || '';
            const project = d.project || d['game project'] || d.game || '';
            return wallet.toLowerCase().includes(lowerTerm) || project.toLowerCase().includes(lowerTerm);
        });
    }, [data, searchTerm]);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading large dataset (240k+ rows)...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Transactions"
                    value={kpis.totalTx.toLocaleString()}
                    icon={<Activity className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Active Users"
                    value={kpis.activeUsers.toLocaleString()}
                    icon={<Users className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Avg Daily Tx / User"
                    value={kpis.avgDailyTx}
                    icon={<Activity className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <GlassCard>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-lg font-gaming font-bold">User Daily Activity Log</h3>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search by wallet or game..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border focus:border-solana-purple focus:ring-1 focus:ring-solana-purple outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="mb-4 text-xs text-text-secondary font-mono">
                    Showing {filteredData.length.toLocaleString()} records
                </div>

                <CompleteDataTable
                    data={filteredData}
                    columns={columns}
                    title="User Daily Activity Log"
                    searchable={false} // We handled search externally for better control
                    pageSize={20}
                />
            </GlassCard>
        </div>
    );
};
