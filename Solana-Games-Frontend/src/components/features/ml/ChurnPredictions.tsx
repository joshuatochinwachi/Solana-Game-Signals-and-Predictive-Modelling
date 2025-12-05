import React, { useMemo, useState } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { ChurnResponse } from '../../../types/api';
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
    Legend
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Activity, ExternalLink, Brain } from 'lucide-react';

export const ChurnPredictionsFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<ChurnResponse>('/api/ml/predictions/churn?method=ensemble');
    const { data: modelInfoData } = useAutoRefresh<any>('/api/ml/models/info');

    const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

    const predictions = useMemo(() => {
        if (!data) return [];
        console.log('ðŸ” ChurnPredictions DEBUG - Full response:', data);
        // ML endpoints return direct objects, not wrapped in ApiResponse
        const preds = (data as any).predictions || [];
        console.log('ðŸ” ChurnPredictions DEBUG - Predictions sample:', preds[0]);

        // Double shuffle the predictions array for better randomization
        const shuffled = [...preds]
            .sort(() => Math.random() - 0.5)
            .sort(() => Math.random() - 0.5);
        return shuffled;
    }, [data]);

    const filteredPredictions = useMemo(() => {
        if (filter === 'All') return predictions;
        return predictions.filter((p: any) => {
            const level = p.risk_level || p['risk level'] || p.churn_risk || p['churn risk'] || 'Low';
            return level === filter;
        });
    }, [predictions, filter]);

    const kpis = useMemo(() => {
        // Use pre-calculated summary if available (more accurate/efficient)
        const summary = (data as any)?.summary;
        // Use model_info from the churn response for champion and roc_auc
        const modelInfo = (data as any)?.model_info;
        const rocAuc = safeNumber(modelInfo?.roc_auc);
        const champion = modelInfo?.champion || '-';

        // Get accuracy from the dedicated model info endpoint
        const accuracy = safeNumber((modelInfoData as any)?.champion?.accuracy);

        if (summary) {
            return {
                totalAtRisk: (summary.high_risk || 0) + (summary.medium_risk || 0),
                avgProb: (safeNumber(summary.avg_churn_probability) * 100).toFixed(1),
                champion,
                accuracy: (accuracy * 100).toFixed(1),
                rocAuc: (rocAuc * 100).toFixed(1)
            };
        }

        if (!predictions.length) return { totalAtRisk: 0, avgProb: 0, champion: '-', accuracy: 0, rocAuc: 0 };

        const totalAtRisk = predictions.filter((p: any) => {
            const level = p.risk_level || p['risk level'] || p.churn_risk || p['churn risk'] || 'Low';
            return level === 'High' || level === 'Medium';
        }).length;

        const avgProb = predictions.reduce((sum: number, p: any) => sum + safeNumber(p.churn_probability || p['churn probability']), 0) / predictions.length;

        return {
            totalAtRisk,
            avgProb: (avgProb * 100).toFixed(1),
            champion,
            accuracy: (accuracy * 100).toFixed(1),
            rocAuc: (rocAuc * 100).toFixed(1)
        };
    }, [predictions, data, modelInfoData]);

    const riskDistribution = useMemo(() => {
        const summary = (data as any)?.summary;
        if (summary) {
            return [
                { name: 'High Risk', value: summary.high_risk || 0, color: '#FF4444' },
                { name: 'Medium Risk', value: summary.medium_risk || 0, color: '#FFB800' },
                { name: 'Low Risk', value: summary.low_risk || 0, color: '#00E676' }
            ];
        }

        const counts = { High: 0, Medium: 0, Low: 0 };
        predictions.forEach((p: any) => {
            const level = (p.risk_level || p['risk level'] || p.churn_risk || p['churn risk'] || 'Low') as keyof typeof counts;
            if (counts[level] !== undefined) {
                counts[level]++;
            }
        });
        return [
            { name: 'High Risk', value: counts.High, color: '#FF4444' },
            { name: 'Medium Risk', value: counts.Medium, color: '#FFB800' },
            { name: 'Low Risk', value: counts.Low, color: '#00E676' }
        ];
    }, [predictions, data]);

    const columns = useMemo(() => [
        {
            key: 'user_wallet',
            label: 'User Wallet',
            render: (val: any, row: any) => {
                const wallet = val || row.user_wallet || row['user wallet'] || row.wallet || 'Unknown';
                return (
                    <a
                        href={`https://solscan.io/account/${wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-solana-purple hover:text-solana-cyan transition-colors flex items-center gap-2"
                    >
                        {wallet.slice(0, 6)}...{wallet.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            },
        },
        {
            key: 'project',
            label: 'Game',
            render: (val: any, row: any) => <span className="font-medium">{val || row.project || row['game project'] || row.game || '-'}</span>,
        },
        {
            key: 'active_days_last_7',
            label: 'Active Days (Last 8d)',
            render: (val: any, row: any) => <span className="font-mono text-center block">{val || row['active_days_last_7'] || 0}</span>,
        },
        {
            key: 'transactions_last_7',
            label: 'Transactions (Last 8d)',
            render: (val: any, row: any) => <span className="font-mono text-center block">{val || row['transactions_last_7'] || 0}</span>,
        },
        {
            key: 'total_active_days',
            label: 'Total Active Days (Last 60d)',
            render: (val: any, row: any) => <span className="font-mono text-center block">{val || row['total_active_days'] || 0}</span>,
        },
        {
            key: 'total_transactions',
            label: 'Total Transactions (Last 60d)',
            render: (val: any, row: any) => <span className="font-mono text-center block">{val || row['total_transactions'] || 0}</span>,
        },
        {
            key: 'avg_transactions_per_day',
            label: 'Avg Tx/Day',
            render: (val: any, row: any) => {
                const avg = safeNumber(val || row['avg_transactions_per_day']);
                return <span className="font-mono text-center block">{avg.toFixed(1)}</span>;
            },
        },
        {
            key: 'days_since_last_activity',
            label: 'Days Since Last Activity',
            render: (val: any, row: any) => {
                const days = val || row['days_since_last_activity'] || 0;
                return (
                    <span className={`font-mono text-center block ${days > 14 ? 'text-risk-high' : days > 7 ? 'text-risk-medium' : 'text-text-secondary'}`}>
                        {days}d
                    </span>
                );
            },
        },
        {
            key: 'week1_transactions',
            label: 'Week 1 Transactions',
            render: (val: any, row: any) => <span className="font-mono text-center block">{val || row['week1_transactions'] || 0}</span>,
        },
        {
            key: 'week_last_transactions',
            label: 'Last Week Transactions',
            render: (val: any, row: any) => <span className="font-mono text-center block">{val || row['week_last_transactions'] || 0}</span>,
        },
        {
            key: 'early_to_late_momentum',
            label: 'Momentum Score',
            render: (val: any, row: any) => {
                const momentum = safeNumber(val || row['early_to_late_momentum']);
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 bg-bg-tertiary rounded-full h-1.5">
                            <div
                                className="h-full rounded-full bg-solana-green"
                                style={{ width: `${momentum * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono">{momentum.toFixed(2)}</span>
                    </div>
                );
            },
        },
        {
            key: 'consistency_score',
            label: 'Consistency Score',
            render: (val: any, row: any) => {
                const score = safeNumber(val || row['consistency_score']);
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 bg-bg-tertiary rounded-full h-1.5">
                            <div
                                className="h-full rounded-full bg-solana-cyan"
                                style={{ width: `${score * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono">{(score * 100).toFixed(0)}%</span>
                    </div>
                );
            },
        },
        {
            key: 'churn_probability',
            label: 'Churn Probability',
            render: (val: any, row: any) => {
                const prob = safeNumber(val || row['churn probability']);
                const pct = (prob * 100).toFixed(1);
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 bg-bg-tertiary rounded-full h-1.5">
                            <div
                                className={`h-full rounded-full ${prob > 0.7 ? 'bg-risk-high' : prob > 0.4 ? 'bg-risk-medium' : 'bg-risk-low'
                                    }`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono">{pct}%</span>
                    </div>
                );
            }
        },
        {
            key: 'risk_level',
            label: 'Risk Level',
            render: (val: any, row: any) => {
                const level = val || row['risk level'] || row.churn_risk || row['churn risk'] || 'Low';
                return (
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${level === 'High' ? 'bg-risk-high/20 text-risk-high' :
                        level === 'Medium' ? 'bg-risk-medium/20 text-risk-medium' :
                            'bg-risk-low/20 text-risk-low'
                        }`}>
                        {level}
                    </span>
                );
            }
        }
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading churn predictions...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;
    if (!riskDistribution || riskDistribution.length === 0) return <div className="p-8 text-center text-text-secondary">No data available</div>;

    return (
        <div className="space-y-6">
            {/* Top Row: 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Users At Risk"
                    value={kpis.totalAtRisk.toLocaleString()}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    color="red"
                />
                <KPICard
                    title="Avg Churn Probability"
                    value={`${kpis.avgProb}%`}
                    icon={<Activity className="w-4 h-4" />}
                    color="yellow"
                />
                <KPICard
                    title="Champion Model"
                    value={kpis.champion}
                    icon={<Brain className="w-4 h-4" />}
                    color="purple"
                    tooltipText="The predictive model currently serving these results, selected by the ensemble."
                />
            </div>

            {/* Bottom Row: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <KPICard
                    title="Model Accuracy"
                    value={`${kpis.accuracy}%`}
                    icon={<Brain className="w-4 h-4" />}
                    color="green"
                    tooltipText="Percentage of correct predictions on the validation dataset."
                />
                <KPICard
                    title="ROC AUC Score"
                    value={`${kpis.rocAuc}%`}
                    icon={<Activity className="w-4 h-4" />}
                    color="cyan"
                    tooltipText="Area Under the ROC Curve - measures the model's ability to distinguish between churners and non-churners."
                />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4">
                {(['All', 'High', 'Medium', 'Low'] as const).map(level => (
                    <button
                        key={level}
                        onClick={() => setFilter(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === level
                            ? 'bg-solana-purple text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        {level} Risk
                    </button>
                ))}
            </div>

            {/* Churn Predictions Table */}
            <CompleteDataTable
                data={filteredPredictions}
                columns={columns}
                title="Churn Predictions"
                searchable={true}
                pageSize={10}
            />

            {/* Risk Distribution Chart */}
            <GlassCard className="h-[400px]">
                <h3 className="text-lg font-gaming font-bold mb-4">Risk Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={riskDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={10}
                            dataKey="value"
                        >
                            {riskDistribution && riskDistribution.length > 0 && riskDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </GlassCard>
        </div >
    );
};
