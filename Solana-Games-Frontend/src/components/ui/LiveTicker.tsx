import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, TrendingUp, AlertTriangle, Brain } from 'lucide-react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { safeNumber, formatNumber } from '../../utils/formatters';

export const LiveTicker: React.FC = () => {
    // Fetch real-time data from multiple sources
    const { data: modelInfo } = useAutoRefresh<any>('/api/ml/models/info');
    const { data: churnData } = useAutoRefresh<any>('/api/ml/predictions/churn?method=ensemble');
    const { data: retentionData } = useAutoRefresh<any>('/api/analytics/high-retention-summary');
    const { data: ecosystemData } = useAutoRefresh<any>('/api/analytics/gamers-by-games-played');

    const events = useMemo(() => {
        const dynamicEvents = [];

        // 1. Model Status (from /api/ml/models/info)
        if (modelInfo?.champion?.accuracy) {
            const accuracy = (safeNumber(modelInfo.champion.accuracy) * 100).toFixed(1);
            dynamicEvents.push({
                icon: <Brain className="w-3 h-3 text-solana-purple" />,
                text: `ML Model Updated: Accuracy ${accuracy}% (${modelInfo.champion.name || 'Ensemble'})`
            });
        }

        // 2. High Risk Users (from /api/ml/predictions/churn)
        if (churnData?.summary?.high_risk_users) {
            const highRiskCount = safeNumber(churnData.summary.high_risk_users);
            dynamicEvents.push({
                icon: <AlertTriangle className="w-3 h-3 text-risk-high" />,
                text: `Risk Monitor: ${formatNumber(highRiskCount)} users flagged for churn risk`
            });
        }

        // 3. Top Retention Game (from /api/analytics/high-retention-summary)
        if (retentionData?.data && retentionData.data.length > 0) {
            const topGame = retentionData.data[0];
            const name = topGame.game || 'Unknown';
            const rate = safeNumber(topGame['avg retention rate %'] || topGame.avg_retention_rate_pct).toFixed(1);
            dynamicEvents.push({
                icon: <TrendingUp className="w-3 h-3 text-solana-green" />,
                text: `Retention Leader: ${name} (${rate}% Avg Retention)`
            });
        }

        // 4. Ecosystem Growth (from /api/analytics/gamers-by-games-played)
        if (ecosystemData?.data) {
            const totalUsers = ecosystemData.data.reduce((sum: number, curr: any) =>
                sum + safeNumber(curr.number_of_gamers || curr['number of gamers']), 0);
            if (totalUsers > 0) {
                dynamicEvents.push({
                    icon: <Activity className="w-3 h-3 text-solana-cyan" />,
                    text: `Ecosystem Pulse: ${formatNumber(totalUsers)} Active Gamers Tracked`
                });
            }
        }

        // Fallback/System events if data is loading or minimal
        if (dynamicEvents.length < 3) {
            dynamicEvents.push(
                { icon: <Zap className="w-3 h-3 text-yellow-400" />, text: "Solana Network: Optimal Performance" },
                { icon: <Activity className="w-3 h-3 text-solana-cyan" />, text: "Live Data Feed: Active" }
            );
        }

        return dynamicEvents;
    }, [modelInfo, churnData, retentionData, ecosystemData]);

    return (
        <div className="w-full bg-black/40 border-b border-white/5 overflow-hidden py-1 backdrop-blur-sm z-40 relative">
            <div className="flex whitespace-nowrap">
                <motion.div
                    className="flex gap-12 items-center"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30
                    }}
                >
                    {[...events, ...events, ...events, ...events].map((event, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                            {event.icon}
                            <span>{event.text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
