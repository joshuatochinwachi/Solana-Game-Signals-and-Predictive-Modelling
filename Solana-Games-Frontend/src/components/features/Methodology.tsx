import React from 'react';
import { Info, Users, Trophy, Target } from 'lucide-react';

export const Methodology: React.FC = () => {
    return (
        <div className="space-y-4 mb-8">
            {/* Main Data Scope Notice */}
            <div className="bg-gradient-to-r from-solana-purple/10 via-solana-cyan/10 to-solana-purple/10 border border-solana-purple/30 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                    <Info className="w-5 h-5 text-solana-cyan mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-white mb-2 md:mb-1 flex items-center gap-2">
                            <span className="md:hidden">📊</span>
                            Data Scope & Methodology
                        </h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            All metrics and analytics displayed on this dashboard represent data from the <strong className="text-solana-cyan">last 60 days</strong>.
                            This timeframe ensures optimal performance and relevance while managing the substantial volume of Solana blockchain gaming data.
                            Machine learning models utilize this historical data to generate projections and churn risk assessments for the <strong className="text-solana-cyan">next 14 days</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Metric Definitions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-tertiary/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-bg-tertiary/80 transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-solana-purple">
                        <Users className="w-4 h-4" />
                        <h5 className="font-bold text-sm text-white">Total Ecosystem Gamers</h5>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                        Total count of unique wallet addresses that have played <strong>at least one game</strong> in the last 60 days. Represents the <strong>Total Addressable Market (TAM)</strong> of the ecosystem.
                    </p>
                </div>

                <div className="bg-bg-tertiary/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-bg-tertiary/80 transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-solana-cyan">
                        <Target className="w-4 h-4" />
                        <h5 className="font-bold text-sm text-white">Retained Gamers (&gt;50%)</h5>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                        Users with a <strong>Retention Rate of 50% or higher</strong>. These are loyal players who have been active for at least half of their lifespan in the ecosystem (e.g., active 4 out of 8 weeks).
                    </p>
                </div>

                <div className="bg-bg-tertiary/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-bg-tertiary/80 transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-yellow-400">
                        <Trophy className="w-4 h-4" />
                        <h5 className="font-bold text-sm text-white">Elite Gamers</h5>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                        The "Best of the Best". Subset of Retained Gamers who also meet <strong>longevity</strong> (3+ weeks active) and <strong>recency</strong> (active in last 7 days) criteria.
                    </p>
                </div>

                <div className="bg-bg-tertiary/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-bg-tertiary/80 transition-colors md:col-span-3">
                    <div className="flex items-center gap-2 mb-2 text-solana-green">
                        <Target className="w-4 h-4" />
                        <h5 className="font-bold text-sm text-white">Game Activations vs. Unique Users</h5>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                        <strong>Total Ecosystem Gamers</strong> counts unique wallet addresses (1 user = 1 count).
                        <br />
                        <strong>Game Activations/Reactivations</strong> count events per game. If a single user starts playing 3 different games, they contribute <strong>+3 to Game Activations</strong> but only <strong>+1 to Ecosystem Gamers</strong>.
                        This explains why activation numbers may be higher than the total unique user count.
                    </p>
                </div>
            </div>
        </div>
    );
};
