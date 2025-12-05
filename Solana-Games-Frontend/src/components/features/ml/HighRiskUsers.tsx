import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { HighRiskUser } from '../../../types/api';
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
    Cell
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ExternalLink, Zap, DollarSign } from 'lucide-react';

export const HighRiskUsersFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<any>('/api/ml/predictions/high-risk-users');

    const highRiskUsers = useMemo(() => {
        if (!data) return [];
        // API returns { users: [...] }
        const users = (data as any).users || (data as any).predictions || [];
        // Filter for users with >40% churn probability (High and Medium risk)
        return users.filter((u: any) => {
            const prob = safeNumber(u.churn_probability || u['churn probability']);
            // Include Medium risk (usually > 0.4 or 0.5 depending on model)
            return prob > 0.4;
        });
    }, [data]);

    const kpis = useMemo(() => {
        if (!highRiskUsers.length) return { critical: 0, avgRisk: 0, revenueAtRisk: 0 };

        console.log('🔍 HighRiskUsers DEBUG - Filtered users count:', highRiskUsers.length);
        console.log('🔍 HighRiskUsers DEBUG - Sample user:', highRiskUsers[0]);

        const getProb = (item: any) => safeNumber(item.churn_probability || item['churn probability']);

        // Include both High (>80%) and Medium (>60%) risk users
        const critical = highRiskUsers.filter((u: any) => getProb(u) > 0.6).length;
        const avgRisk = highRiskUsers.reduce((sum: number, curr: any) => sum + getProb(curr), 0) / (highRiskUsers.length || 1);

        // Mock revenue calculation (e.g., avg LTV * risk)
        const revenueAtRisk = highRiskUsers.length * 150; // Assuming $150 LTV

        return {
            critical,
            avgRisk: (avgRisk * 100).toFixed(1),
            revenueAtRisk
        };
    }, [highRiskUsers]);

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
            label: 'Risk Score',
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
        },
        {
            key: 'action',
            label: 'Recommended Action',
            render: (_val: any, row: any) => {
                const prob = safeNumber(row.churn_probability || row['churn probability']);
                if (prob > 0.9) return <span className="text-xs font-bold text-risk-high border border-risk-high px-2 py-1 rounded">IMMEDIATE INTERVENTION</span>;
                if (prob > 0.8) return <span className="text-xs font-bold text-risk-medium border border-risk-medium px-2 py-1 rounded">SEND PROMO</span>;
                return <span className="text-xs text-text-secondary">MONITOR</span>;
            }
        }
    ], []);

    if (loading && !data) return <div className="p-8 text-center animate-pulse">Loading high risk users...</div>;
    if (error) return <div className="p-8 text-center text-risk-high">Error loading data</div>;

    return (
        <div className="space-y-6">
            {/* Risk Score Distribution Chart */}
            <GlassCard className="h-[400px]">
                <h3 className="text-lg font-gaming font-bold mb-4">Risk Score Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={[
                            { range: '0-20%', count: highRiskUsers.filter((u: any) => safeNumber(u.churn_probability || u['churn probability']) <= 0.2).length },
                            { range: '20-40%', count: highRiskUsers.filter((u: any) => { const p = safeNumber(u.churn_probability || u['churn probability']); return p > 0.2 && p <= 0.4; }).length },
                            { range: '40-60%', count: highRiskUsers.filter((u: any) => { const p = safeNumber(u.churn_probability || u['churn probability']); return p > 0.4 && p <= 0.6; }).length },
                            { range: '60-80%', count: highRiskUsers.filter((u: any) => { const p = safeNumber(u.churn_probability || u['churn probability']); return p > 0.6 && p <= 0.8; }).length },
                            { range: '80-100%', count: highRiskUsers.filter((u: any) => safeNumber(u.churn_probability || u['churn probability']) > 0.8).length },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="range" stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 12 }} />
                        <YAxis stroke="#5A5A5F" tick={{ fill: '#5A5A5F', fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: 'rgba(26, 26, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {
                                [
                                    { range: '0-20%', count: 0 },
                                    { range: '20-40%', count: 0 },
                                    { range: '40-60%', count: 0 },
                                    { range: '60-80%', count: 0 },
                                    { range: '80-100%', count: 0 },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index > 2 ? '#FF4444' : index === 2 ? '#FFB800' : '#14F195'} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </GlassCard>

            {/* KPI Cards - Above the table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Critical Risk Users (>60%)"
                    value={kpis.critical.toLocaleString()}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    color="red"
                    tooltipText="Users with a churn probability greater than 60%. These users are highly likely to stop playing in the next 14 days."
                />
                <KPICard
                    title="Avg Risk Score"
                    value={`${kpis.avgRisk}%`}
                    icon={<Zap className="w-4 h-4" />}
                    color="yellow"
                    tooltipText="The average churn probability across all high-risk users. A higher score indicates a more unstable user base."
                />
                <KPICard
                    title="Est. Revenue at Risk"
                    value={`$${kpis.revenueAtRisk.toLocaleString()}`}
                    icon={<DollarSign className="w-4 h-4" />}
                    color="purple"
                    tooltipText="Estimated potential revenue loss based on the LTV of at-risk users. Calculated as: (Count of High Risk Users) * (Avg LTV $150)."
                />
            </div>

            {/* High Risk Users Table */}
            <GlassCard>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-gaming font-bold text-risk-high flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        High Risk Users
                    </h3>
                    <button className="px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary rounded-lg text-sm transition-colors border border-border">
                        Export to CRM
                    </button>
                </div>
                <p className="text-sm text-text-secondary mb-6">
                    These users exhibit high churn probability based on recent activity patterns. Immediate action is recommended.
                </p>

                <CompleteDataTable
                    data={highRiskUsers}
                    columns={columns}
                    title="High Risk Users"
                    searchable={true}
                    pageSize={5}
                />
            </GlassCard>
        </div>
    );
};
