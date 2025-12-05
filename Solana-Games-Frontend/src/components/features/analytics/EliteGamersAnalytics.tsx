import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import { GlassCard } from '../../ui/GlassCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { safeNumber } from '../../../utils/formatters';

const COLORS = ['#9945FF', '#14F195', '#FFD700', '#FF4500', '#00C2FF', '#FF00FF'];

export const EliteGamersAnalytics: React.FC = () => {
    const { data: retentionData, loading } = useAutoRefresh<any>('/api/analytics/high-retention-users');
    const { data: churnData } = useAutoRefresh<any>('/api/ml/predictions/churn');

    const stats = useMemo(() => {
        if (!retentionData?.data) return null;

        const users = retentionData.data;
        const predictions = churnData?.data?.[0]?.predictions || churnData?.predictions || [];

        // 1. Elite Gamers by Game
        const gameCount: Record<string, number> = {};
        // 2. Retention by Game
        const gameRetention: Record<string, { total: number; count: number }> = {};
        // 3. Risk Distribution
        const riskDist = { Low: 0, Medium: 0, High: 0 };

        users.forEach((user: any) => {
            const game = user.game || 'Unknown';
            const retention = safeNumber(user['retention rate %'] || user.retention_rate_pct);
            
            // Game Count
            gameCount[game] = (gameCount[game] || 0) + 1;

            // Retention Accumulation
            if (!gameRetention[game]) gameRetention[game] = { total: 0, count: 0 };
            gameRetention[game].total += retention;
            gameRetention[game].count += 1;

            // Risk Level
            const prediction = predictions.find((p: any) => p.user_wallet === user.user);
            let riskLevel = 'Low';
            if (prediction) {
                riskLevel = prediction.churn_risk || 'Low';
            } else {
                 // Fallback heuristic
                 const churnRisk = Math.max(0.5, 10 - (retention / 10));
                 if (churnRisk >= 50) riskLevel = 'High';
                 else if (churnRisk >= 20) riskLevel = 'Medium';
            }
            if (riskDist[riskLevel as keyof typeof riskDist] !== undefined) {
                riskDist[riskLevel as keyof typeof riskDist]++;
            }
        });

        // Format for Recharts
        const gameDistData = Object.entries(gameCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const retentionDataChart = Object.entries(gameRetention)
            .map(([name, { total, count }]) => ({
                name,
                avgRetention: Math.round(total / count)
            }))
            .sort((a, b) => b.avgRetention - a.avgRetention);

        const riskData = Object.entries(riskDist)
            .map(([name, value]) => ({ name, value }));

        return { gameDistData, retentionDataChart, riskData };
    }, [retentionData, churnData]);

    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map(i => (
                    <GlassCard key={i} className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple"></div>
                    </GlassCard>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Chart 1: Elite Gamers by Game */}
            <GlassCard className="h-80 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-solana-purple">🎮</span> Elite Gamers by Game
                </h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.gameDistData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.gameDistData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#9945FF', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {/* Chart 2: Average Retention by Game */}
            <GlassCard className="h-80 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-solana-green">📈</span> Avg Retention Rate
                </h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.retentionDataChart} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                stroke="#9ca3af" 
                                fontSize={12} 
                                width={80}
                            />
                            <Tooltip
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#14F195', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`${value}%`, 'Retention']}
                            />
                            <Bar dataKey="avgRetention" fill="#14F195" radius={[0, 4, 4, 0]}>
                                {stats.retentionDataChart.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {/* Chart 3: Risk Distribution */}
            <GlassCard className="h-80 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-solana-cyan">🛡️</span> Churn Risk Distribution
                </h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.riskData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#00C2FF', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {stats.riskData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={
                                            entry.name === 'Low' ? '#14F195' : 
                                            entry.name === 'Medium' ? '#FFD700' : 
                                            '#FF4500'
                                        } 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
};
