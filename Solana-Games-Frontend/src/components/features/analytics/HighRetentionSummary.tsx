import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { HighRetentionSummary } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
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
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import { Trophy, Users, Activity } from 'lucide-react';

export const HighRetentionSummaryFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<HighRetentionSummary>('/api/analytics/high-retention-summary');

    const kpis = useMemo(() => {
        if (!data?.data) return { topGame: '-', avgRetention: 0, totalPowerUsers: 0 };

        console.log('🔍 HighRetentionSummary DEBUG - Data:', data.data[0]);

        // Handle API field names with spaces
        // Based on API response: 
        // high_retention_users = 50-70%
        // very_high_retention_users = 70-90%
        // excellent_retention_users = 90%+

        const getHighUsers = (item: any) => safeNumber(item['high retention users (50%+)'] || item['high retention users (70-80%)'] || item.high_retention_users);
        const getVeryHighUsers = (item: any) => safeNumber(item['very high retention users (70%+)'] || item['very high retention users (80-90%)'] || item.very_high_retention_users);
        const getExcellentUsers = (item: any) => safeNumber(item['excellent retention users (90%+)'] || item.excellent_retention_users);

        const topGame = [...data.data].sort((a, b) =>
            safeNumber(b['avg retention rate %'] || b.avg_retention_rate_pct) -
            safeNumber(a['avg retention rate %'] || a.avg_retention_rate_pct)
        )[0];

        const avgRetention = data.data.reduce((sum, curr) =>
            sum + safeNumber(curr['avg retention rate %'] || curr.avg_retention_rate_pct), 0) / (data.data.length || 1);

        const totalPowerUsers = data.data.reduce((sum, curr) =>
            sum + getHighUsers(curr) + getVeryHighUsers(curr) + getExcellentUsers(curr), 0);

        return {
            topGame: topGame ? (topGame.game || topGame['game project']) : '-',
            avgRetention: Math.round(avgRetention),
            totalPowerUsers
        };
    }, [data]);

    const radarData = useMemo(() => {
        if (!data?.data) return [];
        // Normalize data for radar chart comparison
        return data.data.map(d => {
            const retention = safeNumber(d['avg retention rate %'] || d.avg_retention_rate_pct);
            const weeksActive = safeNumber(d['avg weeks active'] || d.avg_weeks_active);
            const highUsers = safeNumber(d['high retention users (70-80%)'] || d.high_retention_users);
            const veryHighUsers = safeNumber(d['very high retention users (80-90%)'] || d.very_high_retention_users);
            const excellentUsers = safeNumber(d['excellent retention users (90%+)'] || d.excellent_retention_users);

            return {
                game: d.game,
                retention,
                activity: weeksActive * 10, // Scale up for visibility
                users: (highUsers + veryHighUsers + excellentUsers) / 10 // Scale down
            };
        });
    }, [data]);

    const chartData = useMemo(() => {
        if (!data?.data) return [];
        return data.data.map(d => ({
            game: d.game,
            high: safeNumber(d['high retention users (50%+)'] || d.high_retention_users),
            veryHigh: safeNumber(d['very high retention users (70%+)'] || d.very_high_retention_users),
            excellent: safeNumber(d['excellent retention users (90%+)'] || d.excellent_retention_users)
        }));
    }, [data]);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading retention summary...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Top Retention Game"
                    value={kpis.topGame}
                    icon={<Trophy className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Avg Ecosystem Retention"
                    value={`${kpis.avgRetention}%`}
                    icon={<Activity className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Retained Gamers (>50%)"
                    value={kpis.totalPowerUsers.toLocaleString()}
                    icon={<Users className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <GlassCard className="h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-gaming font-bold text-white">Retention Tiers by Game</h3>
                            <p className="text-sm text-text-secondary">Distribution of users across high-retention brackets</p>
                        </div>
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FFB800]"></div>
                                <span>High (50-70%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#14F195]"></div>
                                <span>Very High (70-90%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#9945FF]"></div>
                                <span>Excellent (90%+)</span>
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                            <XAxis type="number" stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 12 }} />
                            <YAxis
                                dataKey="game"
                                type="category"
                                stroke="#5A5A5F"
                                tick={{ fill: '#fff', fontSize: 14, fontWeight: 500 }}
                                width={120}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="high" name="High (50%+)" stackId="a" fill="#FFB800" radius={[0, 4, 4, 0]} barSize={32} />
                            <Bar dataKey="veryHigh" name="Very High (70%+)" stackId="a" fill="#14F195" radius={[0, 4, 4, 0]} barSize={32} />
                            <Bar dataKey="excellent" name="Excellent (90%+)" stackId="a" fill="#9945FF" radius={[0, 4, 4, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="h-[500px]">
                    <h3 className="text-xl font-gaming font-bold mb-2">Game Performance Radar</h3>
                    <p className="text-sm text-text-secondary mb-6">Comparative analysis of Retention vs. Activity Intensity</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="game" tick={{ fill: '#fff', fontSize: 14, fontWeight: 500 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Retention %"
                                dataKey="retention"
                                stroke="#9945FF"
                                strokeWidth={3}
                                fill="#9945FF"
                                fillOpacity={0.2}
                            />
                            <Radar
                                name="Activity Score"
                                dataKey="activity"
                                stroke="#14F195"
                                strokeWidth={3}
                                fill="#14F195"
                                fillOpacity={0.2}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>
        </div>
    );
};
