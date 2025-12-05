import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { GamerDeactivation } from '../../../types/api';
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
    Legend
} from 'recharts';
import { format, parseISO, addDays } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { UserMinus, AlertTriangle, TrendingDown } from 'lucide-react';

export const GamerDeactivationFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<GamerDeactivation>('/api/analytics/gamer-deactivation');

    const chartData = useMemo(() => {
        if (!data?.data) return [];

        console.log('🔍 GamerDeactivation DEBUG - Data sample:', data.data[0]);

        // Group by week and project
        const grouped = data.data.reduce((acc, curr) => {
            // Handle "YYYY-MM-DD HH:mm:ss.SSS UTC" format by taking first 10 chars
            const rawDate = curr.week || curr.date || '';
            const week = rawDate.substring(0, 10);
            if (!week) return acc;

            if (!acc[week]) acc[week] = {};
            const project = curr.project || curr['game project'] || curr.game || 'Unknown';
            const users = safeNumber(curr.deactivated_users || curr['deactivated users']);

            acc[week][project] = users;
            acc[week].week = week;
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
    }, [data]);

    const projects = useMemo(() => {
        if (!data?.data) return [];
        const projectList = Array.from(new Set(data.data.map(d => d.project || d['game project'] || d.game || 'Unknown')));
        console.log('🔍 GamerDeactivation - Projects:', projectList);
        console.log('🔍 GamerDeactivation - ChartData sample:', chartData[0]);
        return projectList;
    }, [data, chartData]);

    const kpis = useMemo(() => {
        if (!data?.data) return { total: 0, highestRiskGame: '-', trend: 0 };

        const getUsers = (item: any) => safeNumber(item.deactivated_users || item['deactivated users']);

        const total = data.data.reduce((sum, curr) => sum + getUsers(curr), 0);

        // Find game with most deactivations
        const byGame = data.data.reduce((acc, curr) => {
            const project = curr.project || curr['game project'] || curr.game || 'Unknown';
            acc[project] = (acc[project] || 0) + getUsers(curr);
            return acc;
        }, {} as Record<string, number>);

        const highestRiskGame = Object.entries(byGame).sort((a, b) => b[1] - a[1])[0];

        // Calculate simple trend (last week vs previous week)
        const trend = 0; // Placeholder logic

        return {
            total,
            highestRiskGame: highestRiskGame ? highestRiskGame[0] : '-',
            trend
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
                    const start = parseISO(cleanDate);
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
            key: 'deactivated_users',
            label: 'Deactivated Users',
            render: (val: any, row: any) => formatNumber(val || row['deactivated users']),
        },
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading deactivation data...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;
    if (!chartData || chartData.length === 0) return <div className="p-8 text-center text-text-secondary">No deactivation data available</div>;

    const colors = ['#FF4444', '#FFB800', '#FF8042', '#D32F2F', '#C62828', '#B71C1C'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Game Deactivations"
                    value={kpis.total.toLocaleString()}
                    icon={<UserMinus className="w-4 h-4" />}
                    color="red"
                />
                <KPICard
                    title="Highest Risk Game"
                    value={kpis.highestRiskGame}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    color="yellow"
                />
                <KPICard
                    title="Deactivation Trend"
                    value="Stable"
                    icon={<TrendingDown className="w-4 h-4" />}
                    color="default"
                />
            </div>

            <GlassCard className="h-[400px]">
                <h3 className="text-lg font-gaming font-bold mb-4">Weekly Deactivation by Game</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="week"
                            tickFormatter={(str) => {
                                try {
                                    const start = parseISO(str);
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
                            labelStyle={{ color: '#FF4444', marginBottom: '0.5rem' }}
                            labelFormatter={(label) => {
                                try {
                                    const start = parseISO(label);
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
                                stackId="a"
                                fill={colors[i % colors.length]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </GlassCard>

            <CompleteDataTable
                data={[...(data?.data || [])].sort((a, b) => new Date(b.week || b.date).getTime() - new Date(a.week || a.date).getTime())}
                columns={[
                    ...columns.filter(c => c.key !== 'deactivated_users'),
                    {
                        key: 'deactivated_users',
                        label: 'Deactivations',
                        render: (val: any, row: any) => formatNumber(val || row['deactivated users']),
                    }
                ]}
                title="Deactivation Data"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
