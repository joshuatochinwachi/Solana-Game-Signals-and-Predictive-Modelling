import React, { useEffect, useState } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { AlertTriangle, TrendingUp, CheckCircle, Activity } from 'lucide-react';
import type { ChurnResponse, GamerDeactivation } from '../../types/api';

interface Alert {
    type: 'critical' | 'warning' | 'success' | 'info';
    icon: React.ReactNode;
    title: string;
    message: string;
    action: string;
    color: string;
}

export const LiveAlerts: React.FC = () => {
    const { data: churnData } = useAutoRefresh<ChurnResponse>('/api/ml/predictions/churn');
    const { data: deactivationData } = useAutoRefresh<GamerDeactivation>('/api/analytics/gamer-deactivation');
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        const newAlerts: Alert[] = [];

        // 1. Churn Risk Alert
        if (churnData?.summary) {
            const highRisk = churnData.summary.high_risk || 0;
            const totalUsers = churnData.summary.total_users || 1;
            const highRiskPercent = (highRisk / totalUsers) * 100;

            if (highRiskPercent > 5) {
                newAlerts.push({
                    type: 'critical',
                    icon: <AlertTriangle className="w-6 h-6 text-risk-high" />,
                    title: 'HIGH CHURN RISK DETECTED',
                    message: `${highRisk.toLocaleString()} users (${highRiskPercent.toFixed(1)}%) are at HIGH risk of churning within 14 days.`,
                    action: 'Launch immediate retention campaign targeting these users.',
                    color: 'border-risk-high bg-risk-high/10'
                });
            } else if (highRiskPercent < 3) {
                newAlerts.push({
                    type: 'success',
                    icon: <CheckCircle className="w-6 h-6 text-solana-green" />,
                    title: 'ECOSYSTEM HEALTHY',
                    message: `Only ${highRiskPercent.toFixed(1)}% of users at high churn risk - ecosystem performing well.`,
                    action: 'Maintain current engagement strategies.',
                    color: 'border-solana-green bg-solana-green/10'
                });
            }
        }

        // 2. Deactivation Spike Alert (Disabled)
        /* 
        if (deactivationData?.data && deactivationData.data.length >= 2) {
            // Logic disabled
        }
        */

        setAlerts(newAlerts);
    }, [churnData, deactivationData]);

    if (alerts.length === 0) return null;

    return (
        <div className="grid grid-cols-1 gap-4 mb-8">
            {alerts.map((alert, idx) => (
                <div
                    key={idx}
                    className={`
                        p-4 rounded-xl border-l-4 backdrop-blur-md flex items-start gap-4 animate-slideIn
                        ${alert.color}
                    `}
                >
                    <div className="p-2 bg-black/20 rounded-lg">
                        {alert.icon}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-lg text-white mb-1 font-gaming tracking-wide">
                            {alert.title}
                        </h4>
                        <p className="text-text-secondary mb-2">
                            {alert.message}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-text-primary bg-black/20 p-2 rounded inline-block">
                            <span className="text-solana-cyan font-bold">RECOMMENDATION:</span>
                            {alert.action}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
