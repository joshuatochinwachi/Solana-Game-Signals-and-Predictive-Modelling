import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { GamersByGamesPlayed } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { Users, Gamepad2, Share2 } from 'lucide-react';

export const GamersByGamesPlayedFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<GamersByGamesPlayed>('/api/analytics/gamers-by-games-played');

    const chartData = useMemo(() => {
        if (!data?.data) return [];

        const result = data.data.map(d => {
            // Parse "1 game", "2 games" etc.
            const gamesStr = d.number_of_games || d['number of games'];
            const games = parseInt(String(gamesStr), 10) || 0;
            const gamers = safeNumber(d.number_of_gamers || d['number of gamers']);

            return {
                name: `${games} Game${games > 1 ? 's' : ''}`,
                games,
                value: gamers
            };
        }).sort((a, b) => a.games - b.games);

        console.log('🔍 GamersByGamesPlayed - ChartData:', result);
        return result;
    }, [data]);

    const kpis = useMemo(() => {
        if (!data?.data || data.data.length === 0) return { total: 0, multiGame: 0, avgGames: '0.0' };

        const getGamers = (item: any) => safeNumber(item.number_of_gamers || item['number of gamers']);
        const getGames = (item: any) => {
            const val = item.number_of_games || item['number of games'];
            return parseInt(String(val), 10) || 0;
        };

        const total = data.data.reduce((sum, curr) => sum + getGamers(curr), 0);
        const multiGame = data.data
            .filter(d => getGames(d) > 1)
            .reduce((sum, curr) => sum + getGamers(curr), 0);

        const totalGamesPlayed = data.data.reduce((sum, curr) =>
            sum + (getGames(curr) * getGamers(curr)), 0);
        const avgGames = total > 0 ? totalGamesPlayed / total : 0;

        return {
            total,
            multiGame,
            avgGames: safeNumber(avgGames).toFixed(2)
        };
    }, [data]);

    const columns = useMemo(() => [
        {
            key: 'number_of_games',
            label: 'Games Played',
            render: (value: any, row: any) => {
                const val = value || row['number of games'];
                const num = parseInt(String(val), 10) || 0;
                return (
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-solana-purple" />
                        <span className="font-medium">{num} Game{num !== 1 ? 's' : ''}</span>
                    </div>
                );
            },
        },
        {
            key: 'number_of_gamers',
            label: 'Gamers Count',
            render: (value: any, row: any) => formatNumber(value || row['number of gamers']),
        },
        {
            key: 'percentage',
            label: 'Percentage',
            render: (_value: any, row: any) => {
                const val = safeNumber(row.number_of_gamers || row['number of gamers']);
                const total = kpis.total || 1;
                const pct = ((val / total) * 100).toFixed(1);
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-24 bg-bg-tertiary rounded-full h-1.5">
                            <div className="h-full bg-solana-cyan rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-text-secondary">{pct}%</span>
                    </div>
                );
            }
        }
    ], [kpis.total]);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading games played data...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;
    if (!chartData || chartData.length === 0) return <div className="p-8 text-center text-text-secondary">No data available</div>;

    const colors = ['#9945FF', '#14F195', '#FFB800', '#00E676', '#FF4444', '#00C2FF'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Gamers"
                    value={formatNumber(kpis.total)}
                    icon={<Users className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Multi-Game Players"
                    value={formatNumber(kpis.multiGame)}
                    icon={<Share2 className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Avg Games / User"
                    value={kpis.avgGames}
                    icon={<Gamepad2 className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="h-[400px]">
                    <h3 className="text-lg font-gaming font-bold mb-4">Distribution by Games Played</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-secondary">
                            <div className="text-center">
                                <span className="text-4xl">📊</span>
                                <p className="mt-2">No data available</p>
                            </div>
                        </div>
                    )}
                </GlassCard>

                <GlassCard className="h-[400px]">
                    <h3 className="text-lg font-gaming font-bold mb-4">Gamers Count Breakdown</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="name" stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 10 }} />
                                <YAxis stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#14F195" radius={[4, 4, 0, 0]}>
                                    {chartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-secondary">
                            <div className="text-center">
                                <span className="text-4xl">📊</span>
                                <p className="mt-2">No data available</p>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>

            <CompleteDataTable
                data={data?.data || []}
                columns={columns}
                title="Detailed Breakdown"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
