import React, { useMemo, useState } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { DailyGamingActivity } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, Calendar, TrendingUp } from 'lucide-react';

export const DailyGamingActivityFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<DailyGamingActivity>('/api/analytics/daily-gaming-activity');
    const [selectedMetric, setSelectedMetric] = useState<'gamers' | 'transactions'>('gamers');

    const chartData = useMemo(() => {
        if (!data?.data) return [];

        console.log('🔍 DailyGamingActivity DEBUG - Data sample:', data.data[0]);

        // Group by date and project
        const grouped = data.data.reduce((acc, curr) => {
            // Robust date extraction: handle "T" (ISO) or space (SQL-like)
            const rawDate = curr.day || curr.date || '';
            const date = rawDate.split('T')[0].split(' ')[0];

            if (!date) return acc;

            if (!acc[date]) acc[date] = { date };
            const project = curr.project || curr['game project'] || curr.game || 'Unknown';
            const gamers = safeNumber(curr.number_of_gamers || curr['number of gamers']);
            const tx = safeNumber(curr.number_of_transactions || curr['number of transactions']);

            acc[date][project] = selectedMetric === 'gamers' ? gamers : tx;
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data, selectedMetric]);

    const projects = useMemo(() => {
        if (!data?.data) return [];
        return Array.from(new Set(data.data.map(d => d.project || d['game project'] || d.game || 'Unknown')));
    }, [data]);

    const kpis = useMemo(() => {
        if (!data?.data) return { peakDay: '-', consistentGame: '-', growth: 0 };

        // Find peak day
        const dailyTotals = data.data.reduce((acc, curr) => {
            const rawDate = curr.day || curr.date || '';
            const date = rawDate.split('T')[0].split(' ')[0];
            const tx = safeNumber(curr.number_of_transactions || curr['number of transactions']);
            acc[date] = (acc[date] || 0) + tx;
            return acc;
        }, {} as Record<string, number>);

        const peakDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];

        // Find most consistent game (lowest variance in daily gamers) - simplified to just total active days
        const gameDays = data.data.reduce((acc, curr) => {
            const project = curr.project || curr['game project'] || curr.game || 'Unknown';
            acc[project] = (acc[project] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const consistentGame = Object.entries(gameDays).sort((a, b) => b[1] - a[1])[0];

        return {
            peakDay: peakDay ? (() => {
                try {
                    return format(parseISO(peakDay[0]), 'MMM dd');
                } catch {
                    return peakDay[0];
                }
            })() : '-',
            consistentGame: consistentGame ? consistentGame[0] : '-',
            growth: 0 // Placeholder
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
                    const cleanDate = dateStr.split('T')[0].split(' ')[0];
                    return format(parseISO(cleanDate), 'MMM dd, yyyy');
                } catch {
                    return val ? String(val).split(' ')[0] : '-';
                }
            },
        },
        {
            key: 'project',
            label: 'Game',
            render: (val: any, row: any) => <span className="font-medium text-solana-purple">{val || row['game project'] || row.game}</span>,
        },
        {
            key: 'number_of_gamers',
            label: 'Gamers',
            render: (val: any, row: any) => formatNumber(val || row['number of gamers']),
        },
        {
            key: 'number_of_transactions',
            label: 'Transactions',
            render: (val: any, row: any) => formatNumber(val || row['number of transactions']),
        },
    ], []);

    const heatmapData = useMemo(() => {
        if (!data?.data) return [];
        // Aggregate by day for heatmap
        const daily = data.data.reduce((acc, curr) => {
            const rawDate = curr.day || curr.date || '';
            const date = rawDate.split('T')[0].split(' ')[0];
            if (!date) return acc;

            const gamers = safeNumber(curr.number_of_gamers || curr['number of gamers']);
            const tx = safeNumber(curr.number_of_transactions || curr['number of transactions']);

            acc[date] = (acc[date] || 0) + (selectedMetric === 'gamers' ? gamers : tx);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(daily).map(([date, value]) => ({ date, value }));
    }, [data, selectedMetric]);

    const getHeatmapColor = (value: number, max: number) => {
        const intensity = value / max;
        if (intensity > 0.8) return '#14F195';
        if (intensity > 0.6) return '#9945FF';
        if (intensity > 0.4) return '#FFB800';
        if (intensity > 0.2) return '#FF4444';
        return 'rgba(255, 255, 255, 0.1)';
    };

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading daily activity...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;
    if (!chartData || chartData.length === 0) return <div className="p-8 text-center text-text-secondary">No daily activity data available</div>;

    const colors = ['#9945FF', '#14F195', '#FFB800', '#00E676', '#FF4444', '#00C2FF'];
    const maxVal = Math.max(...heatmapData.map(d => d.value), 1);

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <button
                    onClick={() => setSelectedMetric('gamers')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMetric === 'gamers' ? 'bg-solana-purple text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                        }`}
                >
                    Gamers
                </button>
                <button
                    onClick={() => setSelectedMetric('transactions')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMetric === 'transactions' ? 'bg-solana-cyan text-black' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                        }`}
                >
                    Transactions
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Peak Activity Day"
                    value={kpis.peakDay}
                    icon={<Calendar className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Most Consistent Game"
                    value={kpis.consistentGame}
                    icon={<Activity className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Growth Trend"
                    value="Stable"
                    icon={<TrendingUp className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <GlassCard className="h-[400px]">
                <h3 className="text-lg font-gaming font-bold mb-4">Daily {selectedMetric === 'gamers' ? 'Gamers' : 'Transactions'} Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                            <Line
                                key={project}
                                type="monotone"
                                dataKey={project}
                                stroke={colors[i % colors.length]}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </GlassCard>

            <GlassCard>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-gaming font-bold">Activity Heatmap</h3>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="text-text-secondary">Low</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                                <span className="text-text-secondary">0-20%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF4444' }} />
                                <span className="text-text-secondary">20-40%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FFB800' }} />
                                <span className="text-text-secondary">40-60%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#9945FF' }} />
                                <span className="text-text-secondary">60-80%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#14F195' }} />
                                <span className="text-text-secondary">80-100%</span>
                            </div>
                        </div>
                        <span className="text-text-secondary">High</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                    {heatmapData.map((d, i) => {
                        const formattedDate = (() => {
                            try {
                                const cleanDate = d.date.split(' ')[0];
                                return format(parseISO(cleanDate), 'MMM dd, yyyy');
                            } catch {
                                return d.date.split(' ')[0];
                            }
                        })();

                        return (
                            <div
                                key={i}
                                className="w-4 h-4 rounded-sm transition-all hover:scale-125 cursor-default"
                                style={{ backgroundColor: getHeatmapColor(d.value, maxVal) }}
                                title={`${formattedDate}: ${d.value.toLocaleString()} ${selectedMetric}`}
                            />
                        );
                    })}
                </div>
            </GlassCard>

            <CompleteDataTable
                data={data?.data || []}
                columns={columns}
                title="Daily Activity Data"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
