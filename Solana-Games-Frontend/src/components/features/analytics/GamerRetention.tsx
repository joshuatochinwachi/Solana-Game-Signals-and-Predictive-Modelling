import React, { useMemo, useState } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { GamerRetention } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, Calendar, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const GamerRetentionFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<GamerRetention>('/api/analytics/gamer-retention');
    const [selectedGame, setSelectedGame] = useState<string>('All');

    const games = useMemo(() => {
        if (!data?.data) return [];
        return ['All', ...Array.from(new Set(data.data.map(d => d.game_project || d['game project'] || d.game)))];
    }, [data]);

    const filteredData = useMemo(() => {
        if (!data?.data) return [];
        if (selectedGame === 'All') return data.data;
        return data.data.filter(d => (d.game_project || d['game project'] || d.game) === selectedGame);
    }, [data, selectedGame]);

    const heatmapData = useMemo(() => {
        if (!filteredData.length) return [];

        // Sort by Game (Alphabetical) then Cohort Date (Ascending)
        const sorted = [...filteredData].sort((a, b) => {
            const gameA = (a.game_project || a['game project'] || a.game || '').toString();
            const gameB = (b.game_project || b['game project'] || b.game || '').toString();

            if (gameA !== gameB) {
                return gameA.localeCompare(gameB);
            }

            const dateA = new Date(a.cohort_week || a['cohort week'] || 0).getTime();
            const dateB = new Date(b.cohort_week || b['cohort week'] || 0).getTime();
            return dateA - dateB; // Ascending
        });

        return sorted.map(row => {
            const retentionWeeks: number[] = [];
            for (let i = 1; i <= 8; i++) {
                // Correct API keys based on inspection: "% retention 1 week later"
                const val = row[`% retention ${i} week${i > 1 ? 's' : ''} later`] || 0;
                retentionWeeks.push(safeNumber(val));
            }

            return {
                cohort: row.cohort_week || row['cohort week'] || '-',
                game: row.game_project || row['game project'] || '-',
                newUsers: safeNumber(row.new_users || row['new users']),
                weeks: retentionWeeks
            };
        });
    }, [filteredData]);

    const chartData = useMemo(() => {
        const averages = Array(8).fill(0).map((_, i) => ({ week: i + 1, avg: 0, count: 0 }));

        heatmapData.forEach(row => {
            row.weeks.forEach((val, i) => {
                if (val > 0) {
                    averages[i].avg += val;
                    averages[i].count++;
                }
            });
        });

        return averages.map(a => ({
            week: `Week ${a.week}`,
            retention: a.count > 0 ? Math.round(a.avg / a.count) : 0
        }));
    }, [heatmapData]);

    const kpis = useMemo(() => {
        if (!heatmapData.length) return { bestCohort: '-', avgW1: 0, champion: '-' };

        // Calculate Week 1 average (only counting cohorts with non-zero retention)
        const week1Values = heatmapData.map(row => row.weeks[0]).filter(v => v > 0);
        const avgW1 = week1Values.length > 0
            ? week1Values.reduce((sum, val) => sum + val, 0) / week1Values.length
            : 0;

        const bestCohort = [...heatmapData].sort((a, b) =>
            (b.weeks.reduce((s, v) => s + v, 0) / 8) - (a.weeks.reduce((s, v) => s + v, 0) / 8)
        )[0];

        const gameStats = heatmapData.reduce((acc, curr) => {
            if (!acc[curr.game]) acc[curr.game] = { sum: 0, count: 0 };
            const avgRet = curr.weeks.reduce((s, v) => s + v, 0) / 8;
            acc[curr.game].sum += avgRet;
            acc[curr.game].count++;
            return acc;
        }, {} as Record<string, { sum: number, count: number }>);

        const champion = Object.entries(gameStats)
            .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))[0];

        return {
            bestCohort: bestCohort ? (() => {
                const start = new Date(bestCohort.cohort);
                const end = addDays(start, 6);
                return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`;
            })() : '-',
            avgW1: Math.round(avgW1),
            champion: champion ? champion[0] : '-'
        };
    }, [heatmapData]);

    // Custom purple heatmap color scale
    const getHeatmapColor = (value: number) => {
        if (value === 0) return 'transparent';
        // Purple scale: 9945FF (Solana Purple)
        // Opacity based on value
        const opacity = Math.max(0.1, value / 50); // Scale up so 50% is full opacity
        return `rgba(153, 69, 255, ${Math.min(opacity, 1)})`;
    };

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading retention data...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;
    if (!heatmapData || heatmapData.length === 0) return <div className="p-8 text-center text-text-secondary">No retention data available</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-gaming font-bold text-white">Cohort Retention Analysis</h2>
                    <div className="group relative">
                        <Info className="w-4 h-4 text-text-secondary cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-bg-tertiary border border-border rounded text-xs text-text-secondary z-10">
                            Percentage of users who return to play in subsequent weeks after their first week.
                        </div>
                    </div>
                </div>
                <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="bg-bg-tertiary border border-border rounded-lg px-4 py-2 outline-none focus:border-solana-purple text-sm min-w-[200px]"
                >
                    {games.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Best Cohort"
                    value={kpis.bestCohort}
                    icon={<Calendar className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Avg Week 1 Retention"
                    value={`${kpis.avgW1}%`}
                    icon={<Users className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Retention Champion"
                    value={kpis.champion}
                    icon={<TrendingUp className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-text-secondary border-b border-border/50">
                                <th className="p-3 font-medium">Cohort Week</th>
                                <th className="p-3 font-medium">Sector (Game)</th>
                                <th className="p-3 font-medium text-right">New Users</th>
                                {Array(8).fill(0).map((_, i) => (
                                    <th key={i} className="p-3 font-medium text-center min-w-[60px]">
                                        Week {i + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {heatmapData.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-mono text-text-primary whitespace-nowrap">
                                        {(() => {
                                            const start = new Date(row.cohort);
                                            const end = addDays(start, 6);
                                            return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`;
                                        })()}
                                    </td>
                                    <td className="p-3 text-text-secondary">
                                        {row.game}
                                    </td>
                                    <td className="p-3 text-right font-mono text-text-primary">
                                        {formatNumber(row.newUsers)}
                                    </td>
                                    {row.weeks.map((val, j) => (
                                        <td key={j} className="p-1">
                                            <div
                                                className="w-full h-8 rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-105 cursor-default relative group"
                                                style={{
                                                    backgroundColor: getHeatmapColor(val),
                                                    color: val > 25 ? '#fff' : '#ccc'
                                                }}
                                            >
                                                {val > 0 ? `${val.toFixed(1)}%` : '-'}
                                                {val > 0 && (
                                                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black/90 text-white text-[10px] p-1 rounded whitespace-nowrap z-20">
                                                        {val}% Retention
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <GlassCard className="h-[350px]">
                <h3 className="text-lg font-gaming font-bold mb-4">Average Retention Curve</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="week" stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 12 }} />
                        <YAxis stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 12 }} unit="%" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="retention"
                            stroke="#14F195"
                            strokeWidth={3}
                            dot={{ fill: '#14F195', r: 4 }}
                            activeDot={{ r: 6, fill: '#9945FF' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </GlassCard>
        </div>
    );
};
