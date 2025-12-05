import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { GamerActivation } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Users, TrendingUp, Activity } from 'lucide-react';

export const GamerActivationFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<GamerActivation>('/api/analytics/gamer-activation');

    const chartData = useMemo(() => {
        if (!data?.data) return [];

        console.log('🔍 GamerActivation DEBUG - Data sample:', data.data[0]);

        // Group by date and project
        const grouped = data.data.reduce((acc, curr) => {
            // Handle "YYYY-MM-DD HH:mm:ss.SSS UTC" format by taking first 10 chars
            const rawDate = curr.day || curr.date || '';
            const date = rawDate.substring(0, 10);
            if (!date) return acc;

            if (!acc[date]) acc[date] = {};
            const project = curr.project || curr['game project'] || curr.game || 'Unknown';
            const gamers = safeNumber(curr.number_of_new_gamers || curr['number of new gamers']);

            acc[date][project] = gamers;
            acc[date].date = date;
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    const projects = useMemo(() => {
        if (!data?.data) return [];
        const projectList = Array.from(new Set(data.data.map(d => d.project || d['game project'] || d.game || 'Unknown')));
        console.log('🔍 GamerActivation - Projects:', projectList);
        console.log('🔍 GamerActivation - ChartData sample:', chartData[0]);
        return projectList;
    }, [data, chartData]);

    const kpis = useMemo(() => {
        if (!data?.data) return { total: 0, avg: 0, topGame: '-' };

        const getGamers = (item: any) => safeNumber(item.number_of_new_gamers || item['number of new gamers']);

        const total = data.data.reduce((sum, curr) => sum + getGamers(curr), 0);
        const uniqueDays = new Set(data.data.map(d => d.day || d.date)).size;

        const byGame = data.data.reduce((acc, curr) => {
            const project = curr.project || curr['game project'] || curr.game || 'Unknown';
            acc[project] = (acc[project] || 0) + getGamers(curr);
            return acc;
        }, {} as Record<string, number>);

        const topGame = Object.entries(byGame).sort((a, b) => b[1] - a[1])[0];

        return {
            total,
            avg: Math.round(total / (uniqueDays || 1)),
            topGame: topGame ? topGame[0] : '-'
        };
    }, [data]);

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
            key: 'project',
            label: 'Game Project',
            render: (val: any, row: any) => <span className="font-medium text-solana-purple">{val || row['game project'] || row.game}</span>,
        },
        {
            key: 'number_of_new_gamers',
            label: 'New Gamers',
            render: (val: any, row: any) => formatNumber(val || row['number of new gamers']),
        },
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading analytics...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;
    if (!chartData || chartData.length === 0 || !projects || projects.length === 0) {
        return <div className="p-8 text-center text-text-secondary">No activation data available</div>;
    }

    const colors = ['#9945FF', '#14F195', '#FFB800', '#00E676', '#FF4444', '#00C2FF'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Game Activations"
                    value={kpis.total.toLocaleString()}
                    icon={<Users className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Avg Daily Acquisition"
                    value={kpis.avg.toLocaleString()}
                    icon={<Activity className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Top Acquiring Game"
                    value={kpis.topGame}
                    icon={<TrendingUp className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <GlassCard className="h-[400px]">
                <h3 className="text-lg font-gaming font-bold mb-4">Daily Activation Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            {projects.map((project, i) => (
                                <linearGradient key={project} id={`color-${project}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                try {
                                    return format(parseISO(str), 'MMM dd');
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
                            allowEscapeViewBox={{ x: true, y: true }}
                            labelFormatter={(label) => {
                                try {
                                    return format(parseISO(label), 'MMMM dd, yyyy');
                                } catch {
                                    return label;
                                }
                            }}
                        />
                        <Legend />
                        {projects.map((project, i) => (
                            <Area
                                key={project}
                                type="monotone"
                                dataKey={project}
                                stackId="1"
                                stroke={colors[i % colors.length]}
                                fill={`url(#color-${project})`}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </GlassCard>

            <CompleteDataTable
                data={data?.data || []}
                columns={columns}
                title="Activation Data"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
