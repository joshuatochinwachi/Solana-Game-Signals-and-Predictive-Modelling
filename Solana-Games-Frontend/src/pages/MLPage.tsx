import React from 'react';
import { ChurnPredictionsFeature } from '../components/features/ml/ChurnPredictions';
import { ChurnByGameFeature } from '../components/features/ml/ChurnByGame';
import { HighRiskUsersFeature } from '../components/features/ml/HighRiskUsers';
import { ModelLeaderboardFeature } from '../components/features/ml/ModelLeaderboard';
import { ModelInfoFeature } from '../components/features/ml/ModelInfo';

export const MLPage: React.FC = () => {
    return (
        <div className="space-y-8 pb-8">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-solana-purple/20 to-solana-cyan/20 border border-solana-purple/30 backdrop-blur-md">
                <h1 className="text-3xl font-gaming font-bold mb-2">Predictive Intelligence</h1>
                <p className="text-text-secondary">
                    AI-powered insights forecasting user churn and ecosystem health using ensemble models.
                </p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                    Churn Risk Analysis
                </h2>
                <ChurnPredictionsFeature />
                <ChurnByGameFeature />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                    High Priority Interventions
                </h2>
                <HighRiskUsersFeature />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-solana-purple to-solana-cyan">
                    Model Performance & Specs
                </h2>
                <ModelLeaderboardFeature />
                <ModelInfoFeature />
            </section>
        </div>
    );
};
