import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { GamingActivityTotal } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, Users, Zap } from 'lucide-react';

export const GamingActivityTotalFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<GamingActivityTotal>('/api/analytics/gaming-activity-total');

    const kpis = useMemo(() => {
        if (!data?.data) return { totalTx: 0, totalUsers: 0, mostActive: '-' };

        console.log('🔍 GamingActivityTotal DEBUG - Data sample:', data.data[0]);

        const getTx = (item: any) => safeNumber(item.number_of_game_transactions || item['number of game transactions']);
        const getUsers = (item: any) => safeNumber(item.number_of_unique_users || item['number of unique users']);

        const totalTx = data.data.reduce((sum, curr) => sum + getTx(curr), 0);
        const totalUsers = data.data.reduce((sum, curr) => sum + getUsers(curr), 0);

        const mostActive = [...data.data].sort((a, b) => getTx(b) - getTx(a))[0];

        return {
            totalTx,
            totalUsers,
            mostActive: mostActive ? (mostActive.project || mostActive['game project'] || mostActive.game) : '-'
        };
    }, [data]);

    const bubbleData = useMemo(() => {
        if (!data?.data) return [];
        return data.data.map(d => {
            const tx = safeNumber(d.number_of_game_transactions || d['number of game transactions']);
            const users = safeNumber(d.number_of_unique_users || d['number of unique users']);
            return {
                name: d.project || d['game project'] || d.game,
                x: users,
                y: tx,
                z: tx / (users || 1) // Engagement rate
            };
        });
    }, [data]);

    const columns = useMemo(() => [
        {
            key: 'project',
            label: 'Game',
            render: (val: any, row: any) => <span className="font-medium text-solana-purple">{val || row['game project'] || row.game}</span>,
        },
        {
            key: 'number_of_game_transactions',
            label: 'Transactions',
            render: (val: any, row: any) => formatNumber(val || row['number of game transactions']),
        },
        {
            key: 'number_of_unique_users',
            label: 'Unique Users',
            render: (val: any, row: any) => formatNumber(val || row['number of unique users']),
        },
        {
            key: 'engagement',
            label: 'Tx per User',
            render: (_val: any, row: any) => {
                const tx = safeNumber(row.number_of_game_transactions || row['number of game transactions']);
                const users = safeNumber(row.number_of_unique_users || row['number of unique users']);
                return (tx / (users || 1)).toFixed(1);
            }
        }
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading activity data...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Transactions"
                    value={kpis.totalTx.toLocaleString()}
                    icon={<Zap className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Total Game Users"
                    value={kpis.totalUsers.toLocaleString()}
                    icon={<Users className="w-4 h-4" />}
                    color="cyan"
                    tooltipText="Sum of unique users per game. Analogy: Like 'Total Ticket Sales' at a cinema - one person can buy tickets for multiple movies (games), counting towards the total multiple times."
                />
                <KPICard
                    title="Most Active Game"
                    value={kpis.mostActive}
                    icon={<Activity className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="h-[400px]">
                    <h3 className="text-lg font-gaming font-bold mb-4">Engagement Landscape (Users vs Tx)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Users"
                                stroke="#5A5A5F"
                                tick={{ fill: '#5A5A5F', fontSize: 12 }}
                                label={{ value: 'Unique Users', position: 'bottom', fill: '#5A5A5F' }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Transactions"
                                stroke="#5A5A5F"
                                tick={{ fill: '#5A5A5F', fontSize: 12 }}
                                label={{ value: 'Transactions', angle: -90, position: 'left', fill: '#5A5A5F' }}
                            />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Engagement" />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Scatter name="Games" data={bubbleData} fill="#9945FF" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="h-[400px]">
                    <h3 className="text-lg font-gaming font-bold mb-4">Top Games by Transactions</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data?.data ? [...data.data]
                                .map(d => ({
                                    ...d,
                                    project: d.project || d['game project'] || d.game,
                                    number_of_game_transactions: safeNumber(d.number_of_game_transactions || d['number of game transactions'])
                                }))
                                .sort((a, b) => b.number_of_game_transactions - a.number_of_game_transactions)
                                .slice(0, 10) : []}
                            layout="vertical"
                            margin={{ left: 40 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                            <XAxis type="number" stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 12 }} />
                            <YAxis
                                dataKey="project"
                                type="category"
                                stroke="#5A5A5F"
                                tick={{ fill: '#5A5A5F', fontSize: 12 }}
                                width={100}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="number_of_game_transactions" fill="#14F195" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            <CompleteDataTable
                data={data?.data || []}
                columns={columns}
                title="Activity Totals"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
