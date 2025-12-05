import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://solana-game-signals-and-predictive-modelling-production.up.railway.app';

interface EliteGamer {
    wallet: string;
    game: string;
    weeksActive: number;
    retentionRate: number;
    churnRisk: number;
    riskLevel: 'Low' | 'Medium' | 'High';
}

export const EliteGamerScroller: React.FC = () => {
    const [eliteGamers, setEliteGamers] = useState<EliteGamer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEliteGamers = async () => {
            try {
                setLoading(true);

                // Fetch high retention users - these are the TRUE elite gamers!
                const retentionResponse = await fetch(`${API_BASE_URL}/api/analytics/high-retention-users`);
                if (!retentionResponse.ok) throw new Error('Failed to fetch high retention users');
                const retentionData = await retentionResponse.json();

                // Fetch churn predictions
                const churnResponse = await fetch(`${API_BASE_URL}/api/ml/predictions/churn`);
                const churnData = await churnResponse.json();

                console.log('🔍 SCROLLER DEBUG - High retention users:', retentionData);
                console.log('🔍 SCROLLER DEBUG - Sample user:', retentionData?.data?.[0]);

                // Extract the actual data array
                const usersArray = retentionData?.data || [];
                const predictions = churnData?.data?.[0]?.predictions || churnData?.predictions || [];

                // Map high retention users to elite gamers
                const eliteGamersList = usersArray
                    .slice(0, 100) // Top 100 high retention users
                    .map((user: any) => {
                        const prediction = predictions.find((p: any) => p.user_wallet === user.user);

                        // Handle API field names with spaces
                        const retentionRate = user['retention rate %'] || user.retention_rate_pct || 0;
                        const weeksActive = user['weeks active'] || user.weeks_active || 0;

                        // Calculate risk: use prediction if available, otherwise estimate based on retention
                        // High retention = Low risk. 100% retention -> ~1% risk
                        let churnRisk = 0;
                        let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';

                        if (prediction) {
                            churnRisk = (prediction.churn_probability || 0) * 100;
                            riskLevel = prediction.churn_risk || 'Low';
                        } else {
                            // Heuristic for elite gamers without specific predictions
                            churnRisk = Math.max(0.5, 10 - (retentionRate / 10));
                            riskLevel = 'Low';
                        }

                        return {
                            wallet: user.user || 'Unknown',
                            game: user.game || 'Unknown Game',
                            weeksActive,
                            retentionRate,
                            churnRisk,
                            riskLevel
                        };
                    });

                // Group users by game
                const gamersByGame: Record<string, EliteGamer[]> = {};
                eliteGamersList.forEach((gamer: EliteGamer) => {
                    if (!gamersByGame[gamer.game]) {
                        gamersByGame[gamer.game] = [];
                    }
                    gamersByGame[gamer.game].push(gamer);
                });

                // Interleave users from different games (Round Robin)
                const interleavedGamers: EliteGamer[] = [];
                const gameNames = Object.keys(gamersByGame);
                let maxGamersInAnyGame = 0;

                gameNames.forEach(game => {
                    maxGamersInAnyGame = Math.max(maxGamersInAnyGame, gamersByGame[game].length);
                });

                for (let i = 0; i < maxGamersInAnyGame; i++) {
                    gameNames.forEach(game => {
                        if (gamersByGame[game][i]) {
                            interleavedGamers.push(gamersByGame[game][i]);
                        }
                    });
                }

                console.log('🔍 SCROLLER DEBUG - Elite gamers found:', interleavedGamers.length);
                console.log('🔍 SCROLLER DEBUG - Elite gamers sample:', interleavedGamers.slice(0, 3));

                setEliteGamers(interleavedGamers);
                setError(null);
            } catch (err) {
                console.error('❌ SCROLLER ERROR:', err);
                setError(err instanceof Error ? err.message : 'Failed to load elite gamers');
            } finally {
                setLoading(false);
            }
        };

        fetchEliteGamers();
        const interval = setInterval(fetchEliteGamers, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="w-full bg-gradient-to-r from-solana-purple/20 via-solana-cyan/20 to-solana-purple/20 py-4 overflow-hidden relative border-y border-white/5 backdrop-blur-sm z-40">
                <div className="text-center text-text-secondary text-sm animate-pulse">
                    🏆 Loading Elite High-Retention Players...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-gradient-to-r from-red-900/20 via-red-800/20 to-red-900/20 py-4 overflow-hidden relative border-y border-red-500/30 backdrop-blur-sm z-40">
                <div className="text-center text-red-400 text-sm">
                    ⚠️ Failed to load elite gamers: {error}
                </div>
            </div>
        );
    }

    if (eliteGamers.length === 0) {
        return (
            <div className="w-full bg-gradient-to-r from-yellow-900/20 via-yellow-800/20 to-yellow-900/20 py-4 overflow-hidden relative border-y border-yellow-500/30 backdrop-blur-sm z-40">
                <div className="text-center text-yellow-400 text-sm">
                    🏆 No high-retention players found - Check browser console (F12) for debug info
                </div>
            </div>
        );
    }

    // Triple the items for seamless infinite scroll
    const scrollItems = [...eliteGamers, ...eliteGamers, ...eliteGamers];

    return (
        <div className="w-full bg-bg-secondary/30 border-y border-white/5 backdrop-blur-sm z-40 flex flex-col">
            {/* Professional Header / Legend */}
            <div className="w-full bg-black/40 py-3 px-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xs text-text-secondary border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-solana-purple font-bold">LIVE FEED</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-solana-green animate-pulse" />
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-solana-purple">●</span>
                        <span>Game Played</span>
                    </div>
                    <span className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="text-solana-green">●</span>
                        <span>High Retention: Active &gt;50% of weeks since start (min 3 weeks)</span>
                    </div>
                    <span className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="text-solana-cyan">●</span>
                        <span>Currently Active (Last 7 Days)</span>
                    </div>
                    <span className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="text-risk-high">●</span>
                        <span>Risk Score: ML prediction of churn probability within next 14 days</span>
                    </div>
                </div>
            </div>

            {/* Scroller Content */}
            <div className="w-full overflow-hidden py-3 relative group">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

                <div className="flex animate-scroll hover:pause-animation whitespace-nowrap">
                    {/* First set of items */}
                    {eliteGamers.map((gamer, index) => (
                        <GamerCard key={`original-${index}`} gamer={gamer} />
                    ))}
                    {/* Duplicate set for seamless scrolling */}
                    {eliteGamers.map((gamer, index) => (
                        <GamerCard key={`duplicate-${index}`} gamer={gamer} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const GamerCard: React.FC<{ gamer: EliteGamer }> = ({ gamer }) => (
    <div className="inline-flex items-center gap-3 mx-4 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-solana-purple/50 transition-all duration-300 cursor-default group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-solana-purple to-solana-cyan p-[1px]">
            <div className="w-full h-full rounded-full bg-bg-primary flex items-center justify-center">
                <span className="text-xs">🏆</span>
            </div>
        </div>

        <div className="flex flex-col">
            <a
                href={`https://solscan.io/account/${gamer.wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-solana-green font-mono tracking-tight hover:text-solana-cyan transition-colors hover:underline decoration-solana-cyan/50 underline-offset-2"
            >
                {gamer.wallet.substring(0, 4)}...{gamer.wallet.substring(gamer.wallet.length - 4)}
            </a>
            <div className="flex items-center gap-3 text-[10px] text-text-secondary uppercase tracking-wider">
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-solana-purple" />
                    {gamer.game}
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-solana-green" />
                    {gamer.weeksActive}w active
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-solana-cyan" />
                    {gamer.retentionRate}% ret
                </span>
                <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${gamer.churnRisk < 20 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                        gamer.churnRisk < 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                    {gamer.churnRisk.toFixed(1)}% risk
                </span>
            </div>
        </div>
    </div>
);
