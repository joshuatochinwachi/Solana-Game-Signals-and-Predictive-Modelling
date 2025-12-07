import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { GamerReactivation } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber, safeDate } from '../../../utils/formatters';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, parseISO, addDays } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Users, TrendingUp, RefreshCw } from 'lucide-react';

export const GamerReactivationFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<GamerReactivation>('/api/analytics/gamer-reactivation');

    const chartData = useMemo(() => {
        if (!data?.data) return [];

        console.log('🔍 GamerReactivation DEBUG - Data sample:', data.data[0]);

        // Group by week and project
        const grouped = data.data.reduce((acc, curr) => {
            // Handle "YYYY-MM-DD HH:mm:ss.SSS UTC" format by taking first 10 chars
            const rawDate = curr.week || curr.date || '';
            const week = rawDate.substring(0, 10);
            if (!week) return acc;

            if (!acc[week]) acc[week] = {};
            const project = curr.project || curr['game project'] || curr.game || 'Unknown';
            const users = safeNumber(curr.users || curr['reactivated users'] || curr.reactivated_users);

            acc[week][project] = users;
            acc[week].week = week;
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped).sort((a, b) => (safeDate(a.week)?.getTime() || 0) - (safeDate(b.week)?.getTime() || 0));
    }, [data]);

    const projects = useMemo(() => {
        if (!data?.data) return [];
        const projectList = Array.from(new Set(data.data.map(d => d.project || d['game project'] || d.game || 'Unknown')));
        console.log('🔍 GamerReactivation - Projects:', projectList);
        console.log('🔍 GamerReactivation - ChartData sample:', chartData[0]);
        return projectList;
    }, [data, chartData]);

    const kpis = useMemo(() => {
        if (!data?.data) return { total: 0, avg: 0, bestWeek: '-' };

        const getUsers = (item: any) => safeNumber(item.users || item['reactivated users'] || item.reactivated_users);

        const total = data.data.reduce((sum, curr) => sum + getUsers(curr), 0);
        const uniqueWeeks = new Set(data.data.map(d => d.week || d.date)).size;

        // Find best week
        const byWeek = data.data.reduce((acc, curr) => {
            const week = curr.week || curr.date;
            acc[week] = (acc[week] || 0) + getUsers(curr);
            return acc;
        }, {} as Record<string, number>);

        const bestWeek = Object.entries(byWeek).sort((a, b) => b[1] - a[1])[0];

        return {
            total,
            avg: Math.round(total / (uniqueWeeks || 1)),
            bestWeek: bestWeek ? (() => {
                try {
                    const cleanDate = bestWeek[0].split(' ')[0];
                    const start = safeDate(cleanDate);
                    if (!start) return bestWeek[0].split(' ')[0];
                    const end = addDays(start, 6);
                    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`;
                } catch {
                    return bestWeek[0].split(' ')[0];
                }
            })() : '-'
        };
    }, [data]);

    const columns = useMemo(() => [
        {
            key: 'week',
            label: 'Week',
            render: (val: any, row: any) => {
                try {
                    const dateStr = val || row.date;
                    if (!dateStr) return '-';
                    // Handle "YYYY-MM-DD HH:mm:ss.SSS UTC" format
                    const cleanDate = dateStr.split(' ')[0];
                    const start = safeDate(cleanDate);
                    if (!start) return '-';
                    const end = addDays(start, 6);
                    return <span className="font-mono">{`${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`}</span>;
                } catch {
                    return val ? String(val).split(' ')[0] : '-';
                }
            },
        },
        {
            key: 'project',
            label: 'Game',
            render: (val: any, row: any) => <span className="text-solana-purple font-medium">{val || row['game project'] || row.game}</span>,
        },
        {
            key: 'users',
            label: 'Reactivated Users',
            render: (val: any, row: any) => formatNumber(val || row['reactivated users'] || row.reactivated_users),
        },
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading reactivation data...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;
    if (!chartData || chartData.length === 0) return <div className="p-8 text-center text-text-secondary">No reactivation data available</div>;

    const colors = ['#9945FF', '#14F195', '#FFB800', '#00E676', '#FF4444', '#00C2FF'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Game Reactivations"
                    value={kpis.total.toLocaleString()}
                    icon={<RefreshCw className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Avg Weekly Reactivation"
                    value={kpis.avg.toLocaleString()}
                    icon={<Users className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Best Week"
                    value={kpis.bestWeek}
                    icon={<TrendingUp className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <GlassCard className="h-[400px]">
                <h3 className="text-lg font-gaming font-bold mb-4">Weekly Reactivation by Game</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="week"
                            tickFormatter={(str) => {
                                try {
                                    const start = safeDate(str);
                                    if (!start) return str;
                                    const end = addDays(start, 6);
                                    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`;
                                } catch {
                                    return str;
                                }
                            }}
                            stroke="#5A5A5F"
                            tick={{ fill: '#5A5A5F', fontSize: 12 }}
                        />
                        <YAxis
                            stroke="#5A5A5F"
                            tick={{ fill: '#5A5A5F', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#9945FF', marginBottom: '0.5rem' }}
                            labelFormatter={(label) => {
                                try {
                                    const start = safeDate(label);
                                    if (!start) return label;
                                    const end = addDays(start, 6);
                                    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
                                } catch {
                                    return label;
                                }
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend />
                        {projects.map((project, i) => (
                            <Bar
                                key={project}
                                dataKey={project}
                                fill={colors[i % colors.length]}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </GlassCard>

            <CompleteDataTable
                data={[...(data?.data || [])].sort((a, b) => new Date(b.week || b.date).getTime() - new Date(a.week || a.date).getTime())}
                columns={[
                    ...columns.filter(c => c.key !== 'users'),
                    {
                        key: 'users',
                        label: 'Reactivations',
                        render: (val: any, row: any) => formatNumber(val || row['reactivated users'] || row.reactivated_users),
                    }
                ]}
                title="Reactivation Data"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
