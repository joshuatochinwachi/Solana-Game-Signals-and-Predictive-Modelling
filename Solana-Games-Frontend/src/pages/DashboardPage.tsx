import React, { useState } from 'react';
import { GamerActivationFeature } from '../components/features/analytics/GamerActivation';
import { GamerRetentionFeature } from '../components/features/analytics/GamerRetention';
import { GamerReactivationFeature } from '../components/features/analytics/GamerReactivation';
import { GamerDeactivationFeature } from '../components/features/analytics/GamerDeactivation';
import { HighRetentionUsersFeature } from '../components/features/analytics/HighRetentionUsers';
import { HighRetentionSummaryFeature } from '../components/features/analytics/HighRetentionSummary';
import { EliteGamersTable } from '../components/features/analytics/EliteGamersTable';
import { EliteGamersAnalytics } from '../components/features/analytics/EliteGamersAnalytics';
import { GamersByGamesPlayedFeature } from '../components/features/analytics/GamersByGamesPlayed';
import { CrossGameGamersFeature } from '../components/features/analytics/CrossGameGamers';
import { GamingActivityTotalFeature } from '../components/features/analytics/GamingActivityTotal';
import { DailyGamingActivityFeature } from '../components/features/analytics/DailyGamingActivity';
import { UserDailyActivityFeature } from '../components/features/analytics/UserDailyActivity';
import { ChurnPredictionsFeature } from '../components/features/ml/ChurnPredictions';
import { HighRiskUsersFeature } from '../components/features/ml/HighRiskUsers';
import { ChurnByGameFeature } from '../components/features/ml/ChurnByGame';
import { ModelInfoFeature } from '../components/features/ml/ModelInfo';
import { MLDataScope } from '../components/features/ml/MLDataScope';
import { ModelLeaderboardFeature } from '../components/features/ml/ModelLeaderboard';
import { EliteGamerScroller } from '../components/ui/EliteGamerScroller';
import { GlobalKPIs } from '../components/features/GlobalKPIs';
import { LiveAlerts } from '../components/features/LiveAlerts';
import { Tabs } from '../components/ui/Tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Info } from 'lucide-react';
import { Methodology } from '../components/features/Methodology';

const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'lifecycle', label: 'User Lifecycle', icon: '🔄' },
    { id: 'engagement', label: 'Engagement', icon: '🎮' },
    { id: 'activity', label: 'Activity & Volume', icon: '⚡' },
    { id: 'predictions', label: 'ML Predictions', icon: '🤖' },
];

export const DashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <ErrorBoundary>
            <div className="space-y-8 pb-20">
                {/* Methodology & Definitions */}
                <Methodology />

                {/* Elite Gamer Scroller - MANDATORY FEATURE */}
                <EliteGamerScroller />

                {/* Global KPIs */}
                <GlobalKPIs />

                {/* Live Alerts & Recommendations */}
                <LiveAlerts />

                {/* Tabbed Navigation */}
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Retention & Loyalty Overview
                            </h2>
                            <GamerRetentionFeature />
                            <div className="grid grid-cols-1 gap-6">
                                <HighRetentionSummaryFeature />
                            </div>
                        </section>

                        {/* Visual Separator with Reduced Spacing */}
                        <div className="relative py-8 mt-8 clear-both">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-solana-purple/30"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-bg-primary px-6 py-2 text-sm font-bold text-solana-cyan uppercase tracking-widest border border-solana-purple/30 rounded-full">
                                    🏆 Elite Gamers Directory
                                </span>
                            </div>
                        </div>

                        <section className="space-y-4 mt-8 clear-both">
                            <EliteGamersAnalytics />
                            <EliteGamersTable />
                        </section>


                    </div>
                )}

                {activeTab === 'lifecycle' && (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                User Acquisition & Activation
                            </h2>
                            <GamerActivationFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Reactivation & Deactivation
                            </h2>
                            <div className="grid grid-cols-1 gap-8">
                                <GamerReactivationFeature />
                                <GamerDeactivationFeature />
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'engagement' && (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Cross-Game Engagement
                            </h2>
                            <CrossGameGamersFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Games Played Distribution
                            </h2>
                            <GamersByGamesPlayedFeature />
                        </section>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Total Activity Metrics
                            </h2>
                            <GamingActivityTotalFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Daily Activity Trends
                            </h2>
                            <DailyGamingActivityFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                User Activity Log
                            </h2>
                            <UserDailyActivityFeature />
                        </section>
                    </div>
                )}

                {activeTab === 'predictions' && (
                    <div className="space-y-8">
                        {/* Data Scope & Funnel - Top Level Summary */}
                        <MLDataScope />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Churn Risk Predictions
                            </h2>
                            <ChurnPredictionsFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                High Risk Users
                            </h2>
                            <HighRiskUsersFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Churn Analysis by Game
                            </h2>
                            <ChurnByGameFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                Model Leaderboard
                            </h2>
                            <ModelLeaderboardFeature />
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                                ML Model Performance
                            </h2>
                            <ModelInfoFeature />
                        </section>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};
