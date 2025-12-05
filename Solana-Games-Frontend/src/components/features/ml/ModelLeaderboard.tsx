import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { ModelLeaderboardEntry } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { DataTable } from '../../ui/DataTable';
import { KPICard } from '../../ui/KPICard';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import { Trophy, Target, Zap, Clock } from 'lucide-react';

export const ModelLeaderboardFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<ModelLeaderboardEntry>('/api/ml/models/leaderboard');

    const normalizedData = useMemo(() => {
        if (!data) return [];
        console.log('🔍 ModelLeaderboard DEBUG - Full response:', data);
        // API returns { leaderboard: [...], champion: string, total_models: number }
        const entries = (data as any).leaderboard || (data as any).data || (Array.isArray(data) ? data : []);
        console.log('🔍 ModelLeaderboard DEBUG - Normalized entries:', entries);
        return entries as ModelLeaderboardEntry[];
    }, [data]);

    const kpis = useMemo(() => {
        if (!normalizedData.length) return { champion: '-', bestAUC: 0, ensembleSize: 0 };

        const champion = normalizedData.find(m => m.is_champion);
        const bestAUC = Math.max(...normalizedData.map(m => m.roc_auc));
        const ensembleSize = normalizedData.filter(m => m.in_ensemble).length;

        return {
            champion: champion ? champion.model_name : '-',
            bestAUC: bestAUC.toFixed(4),
            ensembleSize
        };
    }, [normalizedData]);

    // Transform for Recharts Radar (needs metrics as axes)
    const transformedRadarData = useMemo(() => {
        if (!normalizedData.length) return [];
        const topModels = normalizedData.slice(0, 3);
        const metrics = ['AUC', 'Accuracy', 'Precision', 'Recall'];

        return metrics.map(metric => {
            const obj: any = { metric };
            topModels.forEach(m => {
                const key = metric === 'AUC' ? 'roc_auc' : metric.toLowerCase();
                obj[m.model_name] = (m[key as keyof ModelLeaderboardEntry] as number) * 100;
            });
            return obj;
        });
    }, [normalizedData]);

    const columns = useMemo<ColumnDef<ModelLeaderboardEntry>[]>(() => [
        {
            accessorKey: 'rank',
            header: 'Rank',
            cell: info => (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-tertiary font-bold">
                    {info.getValue() as number}
                </div>
            ),
        },
        {
            accessorKey: 'model_name',
            header: 'Model Name',
            cell: info => {
                const isChamp = info.row.original.is_champion;
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-medium ${isChamp ? 'text-solana-cyan' : ''}`}>
                            {info.getValue() as string}
                        </span>
                        {isChamp && <Trophy className="w-4 h-4 text-yellow-500" />}
                    </div>
                );
            }
        },
        {
            accessorKey: 'roc_auc',
            header: 'ROC-AUC',
            cell: info => <span className="font-mono">{(info.getValue() as number).toFixed(4)}</span>,
        },
        {
            accessorKey: 'accuracy',
            header: 'Accuracy',
            cell: info => <span className="font-mono">{((info.getValue() as number) * 100).toFixed(2)}%</span>,
        },
        {
            accessorKey: 'precision',
            header: 'Precision',
            cell: info => <span className="font-mono">{((info.getValue() as number) * 100).toFixed(2)}%</span>,
        },
        {
            accessorKey: 'recall',
            header: 'Recall',
            cell: info => <span className="font-mono">{((info.getValue() as number) * 100).toFixed(2)}%</span>,
        },
        {
            accessorKey: 'training_time_seconds',
            header: 'Training Time',
            cell: info => <span className="text-xs text-text-secondary">{(info.getValue() as number).toFixed(2)}s</span>,
        },
        {
            accessorKey: 'in_ensemble',
            header: 'In Ensemble',
            cell: info => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${info.getValue() ? 'bg-solana-green/20 text-solana-green' : 'bg-bg-tertiary text-text-secondary'
                    }`}>
                    {info.getValue() ? 'YES' : 'NO'}
                </span>
            ),
        },
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading model leaderboard...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;

    const colors = ['#9945FF', '#14F195', '#FFB800'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Champion Model"
                    value={kpis.champion}
                    icon={<Trophy className="w-4 h-4" />}
                    color="green"
                    tooltipText="The current best-performing model selected for production predictions based on overall accuracy and stability."
                />
                <KPICard
                    title="Best ROC-AUC"
                    value={kpis.bestAUC}
                    icon={<Target className="w-4 h-4" />}
                    color="purple"
                    tooltipText="Receiver Operating Characteristic - Area Under Curve. A score of 1.0 is perfect. Measures the model's ability to distinguish between churners and non-churners."
                />
                <KPICard
                    title="Ensemble Size"
                    value={kpis.ensembleSize}
                    icon={<Zap className="w-4 h-4" />}
                    color="cyan"
                    tooltipText="Number of different models voting together to make the final prediction. Ensembles reduce error and improve generalization."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="h-[400px]">
                    <h3 className="text-lg font-gaming font-bold mb-4">Model Performance Comparison</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={transformedRadarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: '#5A5A5F', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            {normalizedData.slice(0, 3).map((m, i) => (
                                <Radar
                                    key={m.model_name}
                                    name={m.model_name}
                                    dataKey={m.model_name}
                                    stroke={colors[i % colors.length]}
                                    fill={colors[i % colors.length]}
                                    fillOpacity={0.1}
                                />
                            ))}
                            <Legend />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="flex flex-col justify-center">
                    <h3 className="text-lg font-gaming font-bold mb-6">Champion Model Stats</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/30 border border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-solana-purple/20 text-solana-purple">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm text-text-secondary">Precision</div>
                                    <div className="font-bold text-lg">{(normalizedData?.[0]?.precision ? (normalizedData[0].precision * 100).toFixed(1) : '0.0')}%</div>
                                </div>
                            </div>
                            <div className="h-12 w-[1px] bg-border" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-solana-cyan/20 text-solana-cyan">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm text-text-secondary">Recall</div>
                                    <div className="font-bold text-lg">{(normalizedData?.[0]?.recall ? (normalizedData[0].recall * 100).toFixed(1) : '0.0')}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-tertiary/30 border border-border">
                            <Clock className="w-5 h-5 text-text-secondary" />
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Training Efficiency</span>
                                    <span className="text-sm text-text-secondary">Fast</span>
                                </div>
                                <div className="w-full bg-bg-primary rounded-full h-2">
                                    <div className="bg-solana-gradient h-2 rounded-full w-[85%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <DataTable
                data={normalizedData}
                columns={columns}
                title="Model Rankings"
            />
        </div>
    );
};
