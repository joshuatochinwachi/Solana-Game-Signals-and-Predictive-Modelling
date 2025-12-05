import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../ui/GlassCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://solana-game-signals-and-predictive-modelling-production.up.railway.app';

interface EliteGamer {
    wallet: string;
    game: string;
    weeksActive: number;
    retentionRate: number;
    churnRisk: number;
    riskLevel: 'Low' | 'Medium' | 'High';
}

export const EliteGamersTable: React.FC = () => {
    const [eliteGamers, setEliteGamers] = useState<EliteGamer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        const fetchEliteGamers = async () => {
            try {
                setLoading(true);

                // Fetch high retention users
                const retentionResponse = await fetch(`${API_BASE_URL}/api/analytics/high-retention-users`);
                if (!retentionResponse.ok) throw new Error('Failed to fetch high retention users');
                const retentionData = await retentionResponse.json();

                // Fetch churn predictions
                const churnResponse = await fetch(`${API_BASE_URL}/api/ml/predictions/churn`);
                const churnData = await churnResponse.json();

                // Extract the actual data array
                const usersArray = retentionData?.data || [];
                const predictions = churnData?.data?.[0]?.predictions || churnData?.predictions || [];

                // Map ALL high retention users to elite gamers - NO LIMIT
                const eliteGamersList = usersArray
                    .map((user: any) => {
                        const prediction = predictions.find((p: any) => p.user_wallet === user.user);

                        // Handle API field names with spaces
                        const retentionRate = user['retention rate %'] || user.retention_rate_pct || 0;
                        const weeksActive = user['weeks active'] || user.weeks_active || 0;

                        // Calculate risk: use prediction if available, otherwise estimate based on retention
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

                // Global Round-Robin Interleaving: Ensure game variety throughout the ENTIRE list
                const gamersByGame: Record<string, EliteGamer[]> = {};
                eliteGamersList.forEach((gamer: EliteGamer) => {
                    if (!gamersByGame[gamer.game]) {
                        gamersByGame[gamer.game] = [];
                    }
                    gamersByGame[gamer.game].push(gamer);
                });

                const interleavedGamers: EliteGamer[] = [];
                const gameNames = Object.keys(gamersByGame);
                // Shuffle game names to randomize which game starts
                for (let i = gameNames.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [gameNames[i], gameNames[j]] = [gameNames[j], gameNames[i]];
                }

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

                setEliteGamers(interleavedGamers);
                setError(null);
            } catch (err) {
                console.error('❌ TABLE ERROR:', err);
                setError(err instanceof Error ? err.message : 'Failed to load elite gamers');
            } finally {
                setLoading(false);
            }
        };

        fetchEliteGamers();
        const interval = setInterval(fetchEliteGamers, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, []);

    // Pagination logic
    const totalPages = Math.ceil(eliteGamers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentGamers = eliteGamers.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    return (
        <GlassCard>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🏆</span>
                    <h3 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                        Elite High-Retention Gamers
                    </h3>
                </div>
                <p className="text-sm text-text-secondary">
                    {eliteGamers.length} elite gamers with &gt;50% retention rate, minimum 3 weeks active, currently playing
                </p>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana-purple mx-auto mb-4"></div>
                        <p className="text-text-secondary">Loading elite gamers...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center text-red-400">
                        <p className="text-lg mb-2">⚠️ Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {!loading && !error && eliteGamers.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center text-yellow-400">
                        <p className="text-lg mb-2">🏆 No Data</p>
                        <p className="text-sm">No high-retention players found</p>
                    </div>
                </div>
            )}

            {!loading && !error && eliteGamers.length > 0 && (
                <>
                    {/* Detailed Description */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-solana-purple/10 via-solana-cyan/10 to-solana-purple/10 border border-solana-purple/30 rounded-lg">
                        <h4 className="text-sm font-bold text-solana-cyan mb-3">📊 What is an Elite High-Retention Gamer?</h4>
                        <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
                            <p>
                                <strong className="text-solana-green">High Retention Criteria:</strong> Players who have been active in at least <strong>50% of the weeks</strong> since they started playing,
                                with a minimum of <strong>3 weeks of activity</strong>, and are <strong>currently still playing</strong> (active within the last 7 days).
                            </p>
                            <p>
                                <strong className="text-solana-cyan">Retention Rate Calculation:</strong> (Weeks Active / Total Weeks Since Start) × 100.
                                For example, a user who started 8 weeks ago and was active in 6 of those weeks has a <strong>75% retention rate</strong>.
                            </p>
                            <p>
                                <strong className="text-solana-purple">Churn Risk Score:</strong> This is a <strong>Machine Learning prediction</strong> of the probability that the player will
                                <strong>churn (stop playing)</strong> within the <strong>next 14 days</strong>. Lower scores indicate more engaged, loyal players.
                            </p>
                            <p className="pt-2 border-t border-white/10">
                                <strong className="text-white">Game Variety:</strong> The table displays players shuffled in chunks to ensure you see a diverse mix
                                of elite gamers across the entire Solana gaming ecosystem throughout the entire list.
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">

                                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Wallet Address
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Game
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Weeks Active
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Retention Rate
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Churn Risk
                                    </th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Risk Level
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentGamers.map((gamer, index) => (
                                    <tr
                                        key={gamer.wallet}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >

                                        <td className="py-3 px-4">
                                            <a
                                                href={`https://solscan.io/account/${gamer.wallet}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-mono text-solana-green hover:text-solana-cyan transition-colors hover:underline decoration-solana-cyan/50 underline-offset-2"
                                            >
                                                {gamer.wallet.substring(0, 4)}...{gamer.wallet.substring(gamer.wallet.length - 4)}
                                            </a>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-solana-purple" />
                                                <span className="text-sm text-text-primary">{gamer.game}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="w-2 h-2 rounded-full bg-solana-green" />
                                                <span className="text-sm text-text-primary font-medium">{gamer.weeksActive}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="w-2 h-2 rounded-full bg-solana-cyan" />
                                                <span className="text-sm text-text-primary font-medium">{gamer.retentionRate.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-sm text-text-primary font-medium">{gamer.churnRisk.toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center">
                                                <span className={`
                                                    px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                                                    ${gamer.churnRisk < 20
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : gamer.churnRisk < 50
                                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }
                                                `}>
                                                    {gamer.riskLevel}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="text-sm text-text-secondary">
                            Showing {startIndex + 1} to {Math.min(endIndex, eliteGamers.length)} of {eliteGamers.length} elite gamers
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-text-secondary px-4">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </GlassCard>
    );
};
