import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { ChurnByGame } from '../../../types/api';
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
    Legend,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import { ShieldCheck, AlertTriangle, HeartPulse } from 'lucide-react';

export const ChurnByGameFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<ChurnByGame>('/api/ml/predictions/churn/by-game?method=ensemble');

    const normalizedGames = useMemo(() => {
        if (!data) return [];
        // Handle both { data: [...] } and direct array [...] responses
        const games = (data as any).data || (Array.isArray(data) ? data : []);
        console.log('🔍 ChurnByGame DEBUG - Normalized games:', games);
        return games;
    }, [data]);

    const kpis = useMemo(() => {
        if (!normalizedGames.length) return { healthiest: '-', riskiest: '-', avgHealth: 0 };

        const getProb = (item: any) => safeNumber(item.avg_churn_probability || item['avg churn probability']);
        const getProject = (item: any) => item.project || item['game project'] || item.game || 'Unknown';

        const sortedByRisk = [...normalizedGames].sort((a, b) => getProb(b) - getProb(a));
        const riskiest = sortedByRisk[0];
        const healthiest = sortedByRisk[sortedByRisk.length - 1];

        const avgHealth = 100 - (normalizedGames.reduce((sum: number, curr: any) => sum + getProb(curr), 0) / normalizedGames.length * 100);

        return {
            healthiest: healthiest ? getProject(healthiest) : '-',
            riskiest: riskiest ? getProject(riskiest) : '-',
            avgHealth: avgHealth.toFixed(1)
        };
    }, [data]);

    const scatterData = useMemo(() => {
        return normalizedGames.map((d: any) => ({
            name: d.project || d['game project'] || d.game || 'Unknown',
            x: safeNumber(d.total_users || d['total users']),
            y: safeNumber(d.avg_churn_probability || d['avg churn probability']) * 100,
            z: safeNumber(d.High || d.high_risk_count || d['high risk count'])
        }));
    }, [normalizedGames]);

    const columns = useMemo(() => [
        {
            key: 'project',
            label: 'Game',
            render: (val: any, row: any) => <span className="font-medium text-solana-purple">{val || row['game project'] || row.game}</span>,
        },
        {
            key: 'total_users',
            label: 'Total Users',
            render: (val: any, row: any) => formatNumber(val || row['total users']),
        },
        {
            key: 'avg_churn_probability',
            label: 'Avg Churn Prob',
            render: (val: any, row: any) => {
                const prob = safeNumber(val || row['avg churn probability']);
                const pct = (prob * 100).toFixed(1);
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 bg-bg-tertiary rounded-full h-1.5">
                            <div
                                className={`h-full rounded-full ${prob * 100 > 50 ? 'bg-risk-high' : prob * 100 > 20 ? 'bg-risk-medium' : 'bg-risk-low'
                                    }`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-xs">{pct}%</span>
                    </div>
                );
            }
        },
        {
            key: 'risk_breakdown',
            label: 'Risk Breakdown',
            render: (_val: any, row: any) => {
                const high = safeNumber(row.High || row.high_risk_count || row['high risk count']);
                const med = safeNumber(row.Medium || row.medium_risk_count || row['medium risk count']);
                const low = safeNumber(row.Low || row.low_risk_count || row['low risk count']);
                const total = high + med + low || 1;

                return (
                    <div className="flex h-2 w-24 rounded-full overflow-hidden">
                        <div style={{ width: `${(high / total) * 100}%` }} className="bg-risk-high" title={`High: ${high}`} />
                        <div style={{ width: `${(med / total) * 100}%` }} className="bg-risk-medium" title={`Medium: ${med}`} />
                        <div style={{ width: `${(low / total) * 100}%` }} className="bg-risk-low" title={`Low: ${low}`} />
                    </div>
                );
            }
        }
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading game risk data...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Healthiest Game"
                    value={kpis.healthiest}
                    icon={<ShieldCheck className="w-4 h-4" />}
                    color="green"
                />
                <KPICard
                    title="Riskiest Game"
                    value={kpis.riskiest}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    color="red"
                />
                <KPICard
                    title="Avg Ecosystem Health"
                    value={kpis.avgHealth}
                    icon={<HeartPulse className="w-4 h-4" />}
                    color="cyan"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="h-[400px]">
                    <h3 className="text-lg font-gaming font-bold mb-4">Risk Tiers by Game</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={normalizedGames.map((d: any) => ({
                                ...d,
                                project: d.project || d['game project'] || d.game || 'Unknown',
                                high_risk_count: safeNumber(d.High || d.high_risk_count || d['high risk count']),
                                medium_risk_count: safeNumber(d.Medium || d.medium_risk_count || d['medium risk count']),
                                low_risk_count: safeNumber(d.Low || d.low_risk_count || d['low risk count'])
                            }))}
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
                            <Legend />
                            <Bar dataKey="high_risk_count" name="High Risk" stackId="a" fill="#FF4444" />
                            <Bar dataKey="medium_risk_count" name="Medium Risk" stackId="a" fill="#FFB800" />
                            <Bar dataKey="low_risk_count" name="Low Risk" stackId="a" fill="#00E676" />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="h-[400px]">
                    <h3 className="text-lg font-gaming font-bold mb-4">Risk vs Scale (Users vs Churn Prob)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Users"
                                stroke="#5A5A5F"
                                tick={{ fill: '#5A5A5F', fontSize: 12 }}
                                label={{ value: 'Total Users', position: 'bottom', fill: '#5A5A5F' }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Churn Prob"
                                stroke="#5A5A5F"
                                tick={{ fill: '#5A5A5F', fontSize: 12 }}
                                label={{ value: 'Avg Churn %', angle: -90, position: 'left', fill: '#5A5A5F' }}
                            />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="High Risk Users" />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Scatter name="Games" data={scatterData} fill="#9945FF" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            <CompleteDataTable
                data={normalizedGames}
                columns={columns}
                title="Game Risk Analysis"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};
