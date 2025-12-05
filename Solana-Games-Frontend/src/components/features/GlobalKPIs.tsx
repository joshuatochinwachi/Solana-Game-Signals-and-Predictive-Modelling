import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import type { GamingActivityTotal, ChurnResponse, HighRetentionSummary } from '../../types/api';
import { KPICard } from '../ui/KPICard';
import { Users, Award, HeartPulse, Zap } from 'lucide-react';
import { safeNumber, formatNumber } from '../../utils/formatters';

export const GlobalKPIs: React.FC = () => {
    // Fetch data from multiple sources to aggregate global stats
    const { data: activityData } = useAutoRefresh<GamingActivityTotal>('/api/analytics/gaming-activity-total');
    const { data: churnData } = useAutoRefresh<ChurnResponse>('/api/ml/predictions/churn?method=ensemble');
    const { data: retentionData } = useAutoRefresh<HighRetentionSummary>('/api/analytics/high-retention-summary');
    const { data: eliteGamersData } = useAutoRefresh<any>('/api/analytics/high-retention-users');
    const { data: gamersByGameData } = useAutoRefresh<any>('/api/analytics/gamers-by-games-played');

    const kpis = useMemo(() => {
        // Default values
        let totalUsers = 0;
        let totalTx = 0;
        let ecosystemHealth = 0;
        let eliteGamers = 0;

        // Use GamersByGamesPlayed for the most accurate Unique User count (matches Ecosystem Snapshot)
        if (gamersByGameData?.data) {
            totalUsers = gamersByGameData.data.reduce((sum: number, curr: any) =>
                sum + safeNumber(curr.number_of_gamers || curr['number of gamers']), 0);
        } else if (activityData?.data) {
            // Fallback to activity data if the other endpoint fails
            totalUsers = activityData.data.reduce((sum, curr) => sum + safeNumber(curr.number_of_unique_users), 0);
        }

        // Aggregate Activity for Transactions
        if (activityData?.data) {
            totalTx = activityData.data.reduce((sum, curr) => sum + safeNumber(curr.number_of_game_transactions), 0);
        }

        // Calculate Health (Inverse of Churn Risk)
        if (churnData) {
            const preds = (churnData as any).predictions || [];
            if (preds.length > 0) {
                const avgChurn = preds.reduce((sum: number, p: any) =>
                    sum + safeNumber(p.churn_probability || p['churn probability']), 0) / preds.length;
                ecosystemHealth = 100 - (avgChurn * 100);
            }
        }

        // Count Elite Gamers (all high-retention users)
        if (eliteGamersData?.data) {
            eliteGamers = eliteGamersData.data.length;
        }

        return {
            totalUsers,
            totalTx,
            ecosystemHealth: safeNumber(ecosystemHealth).toFixed(1),
            eliteGamers
        };
    }, [activityData, churnData, retentionData, eliteGamersData, gamersByGameData]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
                title="Total Ecosystem Users"
                value={formatNumber(kpis.totalUsers)}
                icon={<Users className="w-5 h-5" />}
                color="purple"
                trend={12.5}
            />
            <KPICard
                title="Total Transactions"
                value={formatNumber(kpis.totalTx)}
                icon={<Zap className="w-5 h-5" />}
                color="cyan"
                trend={8.2}
            />
            <KPICard
                title="Ecosystem Health Score"
                value={kpis.ecosystemHealth}
                icon={<HeartPulse className="w-5 h-5" />}
                color="green"
                trend={2.1}
            />
            <KPICard
                title="Total Elite Gamers"
                value={formatNumber(kpis.eliteGamers)}
                icon={<Award className="w-5 h-5" />}
                color="yellow"
                trend={15.3}
            />
        </div>
    );
};
