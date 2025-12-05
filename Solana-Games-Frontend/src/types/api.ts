export interface ApiMetadata {
    source: string;
    query_id: number;
    last_updated: string;
    cache_age_hours: number;
    is_fresh: boolean;
    next_refresh: string;
    row_count: number;
}

export interface ApiResponse<T> {
    metadata: ApiMetadata;
    data: T[];
}

// Analytics Endpoints

export interface GamerActivation {
    day: string;
    project: string;
    number_of_new_gamers: number;
}

export interface GamerRetention {
    cohort_week: string;
    game_project: string;
    new_users: number;
    [key: string]: string | number; // For dynamic retention columns
}

export interface GamerReactivation {
    week: string;
    project: string;
    users: number;
}

export interface GamerDeactivation {
    week: string;
    project: string;
    deactivated_users: number;
}

export interface HighRetentionUser {
    user: string;
    game: string;
    first_active_week: string;
    weeks_active: number;
    retention_rate_pct: number;
    status: string;
    portfolio_link: string;
}

// Type for High Retention Users endpoint used by Elite Gamer Scroller
export interface HighRetentionUserForScroller {
    user_wallet: string;
    games_played: number;
    retention_rate: number;
}

export type HighRetentionUsers = ApiResponse<HighRetentionUserForScroller>;

export interface HighRetentionSummary {
    game: string;
    high_retention_users: number;
    very_high_retention_users: number;
    excellent_retention_users: number;
    avg_retention_rate_pct: number;
    avg_weeks_active: number;
}

export interface GamersByGamesPlayed {
    number_of_games: number;
    number_of_gamers: number;
}

export interface CrossGameGamer {
    gamer: string;
    games: string;
    games_played: number;
    portfolio_link: string;
}

export interface GamingActivityTotal {
    project: string;
    number_of_game_transactions: number;
    number_of_unique_users: number;
}

export interface DailyGamingActivity {
    day: string;
    project: string;
    number_of_gamers: number;
    number_of_transactions: number;
}

export interface UserDailyActivity {
    day: string;
    user_wallet: string;
    project: string;
    daily_transactions: number;
}

// ML Prediction Endpoints

export interface ChurnPrediction {
    user_wallet: string; // inferred
    game: string; // inferred
    churn_probability: number;
    risk_level: 'High' | 'Medium' | 'Low';
    // Add other fields as they appear in the API
    churn_risk?: 'High' | 'Medium' | 'Low';
    [key: string]: any;
}

export interface ChurnResponse {
    prediction_type: string;
    total_users: number;
    summary: any;
    predictions: ChurnPrediction[];
    model_info: any;
}

export interface ChurnByGame {
    project: string;
    total_users: number;
    avg_churn_probability: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    High?: number;
    Medium?: number;
    Low?: number;
    [key: string]: any;
}

export interface HighRiskUser {
    user_wallet: string;
    game: string;
    churn_probability: number;
    features: Record<string, any>;
    churn_risk?: string;
    [key: string]: any;
}

export interface ModelLeaderboardEntry {
    rank: number;
    model_name: string;
    roc_auc: number;
    accuracy: number;
    precision: number;
    recall: number;
    training_time: string;
    is_champion: boolean;
}

export interface ModelInfo {
    champion_model: any;
    ensemble_details: any;
    features: string[];
    training_history: any[];
}
