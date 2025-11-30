# Solana Games ML Analytics API - Technical Documentation

> **Complete Architecture & Implementation Guide**
> 
> This document provides an in-depth technical overview of the Solana Games ML Analytics API, explaining its architecture, data pipeline, machine learning implementation, and operational mechanisms.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Pipeline](#data-pipeline)
4. [Feature Engineering](#feature-engineering)
5. [Machine Learning Models](#machine-learning-models)
6. [API Endpoints](#api-endpoints)
7. [Cache Management](#cache-management)
8. [Deployment & Operations](#deployment--operations)
9. [Integration Guide](#integration-guide)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose

The Solana Games ML Analytics API provides real-time analytics and predictive insights for the Solana gaming ecosystem. It combines:

- **Analytics Layer**: 11 curated metrics tracking gamer behavior across multiple Solana games
- **ML Layer**: Multi-model ensemble for churn prediction using advanced machine learning algorithms
- **Caching Layer**: Efficient data storage with configurable refresh intervals
- **Automation Layer**: Self-retraining pipeline that adapts to new data patterns

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Real-Time Analytics** | Access to 11 different metrics covering gamer activation, retention, reactivation, deactivation, cross-game behavior, etc. |
| **Churn Prediction** | ML-powered predictions identifying users at risk of leaving within the next 14 days |
| **Multi-Model Ensemble** | Automatically selects the best-performing model from 5 different algorithms |
| **Automated Retraining** | Models retrain automatically when fresh data is available |
| **High Performance** | 24-hour caching with sub-second response times |

### Technology Stack
```
┌─────────────────────────────────────────────────────────┐
│                    Technology Stack                      │
├─────────────────────────────────────────────────────────┤
│  Backend Framework:    FastAPI                          │
│  ML Libraries:         scikit-learn, XGBoost, LightGBM  │
│  Data Processing:      pandas, numpy                    │
│  Data Source:          Dune Analytics API               │
│  Deployment:           Railway.app (Docker)             │
│  Cache Storage:        joblib (filesystem)              │
│  Language:             Python 3.11                      │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture

### High-Level Architecture
```
┌────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                          │
│              (Dashboards, Analytics Tools, Scripts)                 │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                      FASTAPI APPLICATION                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    API ENDPOINTS LAYER                       │  │
│  │  • 11 Analytics Endpoints   • 5 ML Prediction Endpoints     │  │
│  │  • 2 Bulk Endpoints         • 3 Utility Endpoints           │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐  │
│  │                   CACHE MANAGER                              │  │
│  │  • In-Memory Cache         • Filesystem Persistence          │  │
│  │  • TTL Management (24hrs)  • Metadata Tracking               │  │
│  └──────────────┬───────────────────────┬─────────────────────┘  │
│                 │                       │                          │
│  ┌──────────────▼───────────┐  ┌───────▼──────────────────────┐  │
│  │   FEATURE SERVICE        │  │   ML MODEL MANAGER           │  │
│  │  • Feature Engineering   │  │  • Model Training            │  │
│  │  • Training Data Prep    │  │  • Champion Selection        │  │
│  │  • Prediction Features   │  │  • Ensemble Management       │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                             │
                             │ API Calls
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                       DUNE ANALYTICS                                │
│  • Query Execution     • Data Aggregation     • Result Storage     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **API Layer**
- **Framework**: FastAPI with async support
- **CORS**: Enabled for cross-origin requests
- **Documentation**: Auto-generated OpenAPI/Swagger docs at `/docs`
- **Health Checks**: `/api/health` endpoint for monitoring

#### 2. **Cache Manager**
- **Storage**: Filesystem-based using joblib serialization
- **TTL**: Configurable cache duration (default: 24 hours)
- **Metadata**: Tracks last update, row count, cache age
- **Validation**: Automatic cache expiration and refresh

#### 3. **Feature Service**
- **Training Pipeline**: Converts raw data into ML-ready features
- **Prediction Pipeline**: Generates features for live users
- **Feature Set**: 10 engineered features per user-game pair

#### 4. **ML Model Manager**
- **Training**: Automatic model training on data refresh
- **Evaluation**: ROC-AUC and accuracy-based selection
- **Persistence**: Models saved to disk for fast loading
- **Champion Logic**: Best model automatically selected

---

## Data Pipeline

### Data Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW PIPELINE                          │
└─────────────────────────────────────────────────────────────────────┘

1. INGESTION
   ┌─────────────┐
   │ Dune Query  │──────► Raw blockchain transactions
   │ Execution   │         and user activity data
   └──────┬──────┘
          │
          ▼
2. CACHING
   ┌─────────────┐
   │ Cache Layer │──────► Store for 24 hours
   │             │         Metadata tracking
   └──────┬──────┘
          │
          ▼
3. FEATURE ENGINEERING
   ┌─────────────────┐
   │ Feature Service │──────► Transform to ML features:
   │                 │         - Activity patterns
   │                 │         - Transaction metrics
   │                 │         - Engagement trends
   └──────┬──────────┘
          │
          ▼
4. MODEL TRAINING
   ┌─────────────────┐
   │ ML Manager      │──────► Train 5 models:
   │                 │         - Logistic Regression
   │                 │         - Random Forest
   │                 │         - Gradient Boosting
   │                 │         - XGBoost
   │                 │         - LightGBM
   └──────┬──────────┘
          │
          ▼
5. CHAMPION SELECTION
   ┌─────────────────┐
   │ Evaluation      │──────► Select best model by:
   │                 │         - ROC-AUC score
   │                 │         - Accuracy
   └──────┬──────────┘
          │
          ▼
6. PREDICTION GENERATION
   ┌─────────────────┐
   │ Predictions     │──────► Generate churn risk for:
   │                 │         - All active users
   │                 │         - Per-game breakdown
   └──────┬──────────┘
          │
          ▼
7. API RESPONSE
   ┌─────────────────┐
   │ JSON Response   │──────► Served to frontend via
   │                 │         REST API endpoints
   └─────────────────┘
```

### Dune Analytics Queries

The API consumes 11 Dune Analytics queries:

| Query | Purpose | Data Returned |
|-------|---------|---------------|
| **gamer_activation** | New user acquisition | Daily count of new gamers per game |
| **gamer_retention** | Cohort retention analysis | Week-over-week retention percentages |
| **gamer_reactivation** | Returning user tracking | Weekly reactivated user counts |
| **gamer_deactivation** | Churn tracking | Weekly churned user counts |
| **high_retention_users** | Power user identification | Users with >50% retention rate |
| **high_retention_summary** | Retention aggregates | Retention statistics per game |
| **gamers_by_games_played** | Multi-game analysis | Distribution of users by game count |
| **cross_game_gamers** | Cross-platform behavior | Users playing multiple games |
| **gaming_activity_total** | Overall metrics | Total transactions and users per game |
| **daily_gaming_activity** | Time-series data | Daily activity aggregates |
| **user_daily_activity** | User-level granularity | Individual user transactions (ML training source) |

### Query Execution Flow
```python
# Pseudo-code representation
async def fetch_dune_data(query_name):
    # 1. Check cache first
    if cache_valid(query_name):
        return load_from_cache(query_name)
    
    # 2. Fetch fresh data from Dune
    query_id = config.dune_queries[query_name]
    result = dune_client.get_latest_result(query_id)
    
    # 3. Convert to DataFrame
    df = pd.DataFrame(result.result.rows)
    
    # 4. Cache for future use
    cache_data(query_name, df)
    
    # 5. Return data
    return df
```

---

## Feature Engineering

### Overview

The Feature Service transforms raw user activity data into machine learning features. It operates in two modes:

1. **Training Mode**: Creates labeled datasets with historical user behavior
2. **Prediction Mode**: Generates features for current users for real-time predictions

### Training Pipeline

#### Input Data Requirements
```python
# Required columns from user_daily_activity query:
{
    "day": "Date of activity",
    "user_wallet": "Solana wallet address",
    "project": "Game name",
    "daily_transactions": "Number of transactions"
}
```

#### Feature Creation Process
```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE ENGINEERING PIPELINE                  │
└─────────────────────────────────────────────────────────────────┘

For each user-game pair:

1. TIME WINDOW DEFINITION
   ├─ Training Period: Historical data up to cutoff date
   ├─ Target Period: 14 days after cutoff
   └─ Cutoff Date: max_date - (60 - lookback_days)

2. ACTIVITY FEATURES
   ├─ active_days_last_7: Days active in last week
   ├─ transactions_last_7: Total transactions in last week
   ├─ total_active_days: Total days active
   ├─ total_transactions: All-time transaction count
   └─ avg_transactions_per_day: Mean daily transactions

3. ENGAGEMENT FEATURES
   ├─ days_since_last_activity: Recency metric
   ├─ week1_transactions: First week activity
   ├─ week_last_transactions: Most recent week activity
   └─ early_to_late_momentum: Ratio of recent to early activity

4. CONSISTENCY FEATURES
   └─ consistency_score: 1 / (std_dev_of_gaps + 1)
      • High score = regular activity
      • Low score = sporadic activity

5. TARGET LABEL (Training Only)
   └─ will_be_active_next_14_days:
      • 1 = User active in target period (stayed)
      • 0 = User inactive in target period (churned)
```

#### Feature Definitions

| Feature | Type | Calculation | Interpretation |
|---------|------|-------------|----------------|
| `active_days_last_7` | Integer | Count of unique days in last 7 days | Recent activity level |
| `transactions_last_7` | Integer | Sum of transactions in last 7 days | Recent engagement intensity |
| `total_active_days` | Integer | Count of all unique active days | Tenure/experience |
| `total_transactions` | Integer | Sum of all transactions | Lifetime value indicator |
| `avg_transactions_per_day` | Float | total_transactions / total_active_days | Average engagement rate |
| `days_since_last_activity` | Integer | Days between cutoff and last activity | Recency (lower = more recent) |
| `week1_transactions` | Integer | Transactions in first 7 days | Initial engagement |
| `week_last_transactions` | Integer | Transactions in most recent 7 days | Current engagement |
| `early_to_late_momentum` | Float | week_last / week1 | Engagement trend (>1 = increasing) |
| `consistency_score` | Float | 1 / (std_dev_of_activity_gaps + 1) | Activity regularity (higher = more consistent) |

### Prediction Pipeline

For real-time predictions, features are calculated using all available historical data:
```python
# Pseudo-code
def create_prediction_features(user_data):
    latest_date = max(user_data.activity_date)
    
    # Last 7 days window
    last_7 = user_data[date >= latest_date - 7 days]
    
    # All-time metrics
    features = {
        'active_days_last_7': count_unique(last_7.dates),
        'transactions_last_7': sum(last_7.transactions),
        'total_active_days': count_unique(user_data.dates),
        'total_transactions': sum(user_data.transactions),
        'avg_transactions_per_day': mean(user_data.daily_transactions),
        'days_since_last_activity': (today - latest_date).days,
        # ... momentum and consistency features
    }
    
    return features
```

### Feature Scaling

All features are standardized using `StandardScaler` during training:
```python
# Z-score normalization
scaled_feature = (feature - mean) / std_dev
```

This ensures:
- Features are on comparable scales
- Models converge faster
- No feature dominates due to magnitude

---

## Machine Learning Models

### Model Architecture

The API implements a **multi-model ensemble** with automatic champion selection. This approach provides:

- **Robustness**: Multiple models reduce risk of single-model failure
- **Performance**: Best model is automatically selected
- **Flexibility**: Easy to add/remove models
- **Transparency**: All model metrics are exposed via API

### Model Suite

#### 1. Logistic Regression
```python
LogisticRegression(max_iter=1000, random_state=42)
```
- **Type**: Linear classifier
- **Strengths**: Fast, interpretable, good baseline
- **Use Case**: Linear relationships in data

#### 2. Random Forest
```python
RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    min_samples_split=10,
    random_state=42
)
```
- **Type**: Ensemble of decision trees
- **Strengths**: Handles non-linearity, robust to overfitting
- **Use Case**: Complex feature interactions

#### 3. Gradient Boosting
```python
GradientBoostingClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    random_state=42
)
```
- **Type**: Sequential boosted trees
- **Strengths**: High accuracy, feature importance
- **Use Case**: Maximizing predictive performance

#### 4. XGBoost
```python
XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    eval_metric='logloss'
)
```
- **Type**: Optimized gradient boosting
- **Strengths**: Speed, scalability, regularization
- **Use Case**: Large datasets, production deployments

#### 5. LightGBM
```python
LGBMClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    verbose=-1
)
```
- **Type**: Leaf-wise gradient boosting
- **Strengths**: Memory efficiency, speed, accuracy
- **Use Case**: Fast training, large feature spaces

### Training Process
```
┌─────────────────────────────────────────────────────────────────┐
│                      MODEL TRAINING FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. DATA PREPARATION
   ├─ Input: Labeled training dataset
   ├─ Split: 75% train, 25% test (stratified)
   └─ Scaling: StandardScaler on features

2. PARALLEL MODEL TRAINING
   ├─ Train all 5 models independently
   ├─ Each model fits on scaled training data
   └─ Training time tracked per model

3. MODEL EVALUATION
   For each trained model:
   ├─ Generate predictions on test set
   ├─ Calculate ROC-AUC score
   ├─ Calculate accuracy, precision, recall
   └─ Store metrics with timestamp

4. CHAMPION SELECTION
   ├─ Sort models by (ROC-AUC, accuracy)
   ├─ Select top performer as champion
   └─ Top 3 models form ensemble

5. MODEL PERSISTENCE
   ├─ Save all trained models to disk
   ├─ Save scaler for feature transformation
   └─ Save metadata (champion, metrics, timestamp)
```

### Champion Selection Logic
```python
# Pseudo-code
def select_champion(trained_models):
    # Sort by ROC-AUC (primary) and accuracy (secondary)
    sorted_models = sorted(
        trained_models,
        key=lambda m: (m['roc_auc'], m['accuracy']),
        reverse=True
    )
    
    champion = sorted_models[0]
    top_3_ensemble = sorted_models[:3]
    
    return champion, top_3_ensemble
```

### Evaluation Metrics

| Metric | Formula | Interpretation | Ideal Value |
|--------|---------|----------------|-------------|
| **ROC-AUC** | Area under ROC curve | Model's ability to rank predictions | 1.0 (perfect) |
| **Accuracy** | (TP + TN) / Total | Overall correctness | 1.0 (perfect) |
| **Precision** | TP / (TP + FP) | Accuracy of positive predictions | 1.0 (no false positives) |
| **Recall** | TP / (TP + FN) | Coverage of actual positives | 1.0 (no false negatives) |

Where:
- TP = True Positives (correctly predicted churners)
- TN = True Negatives (correctly predicted retained users)
- FP = False Positives (incorrectly predicted churners)
- FN = False Negatives (missed churners)

### Ensemble Predictions

The API offers two prediction methods:

#### 1. Champion Method
Uses only the best-performing model:
```python
churn_probability = champion_model.predict_proba(features)
```

#### 2. Ensemble Method
Weighted average of top 3 models:
```python
# Weights based on ROC-AUC scores
ensemble_prediction = (
    w1 * model1_prediction +
    w2 * model2_prediction +
    w3 * model3_prediction
) / (w1 + w2 + w3)
```

### Churn Risk Classification

Predictions are categorized into risk levels:
```python
def classify_risk(churn_probability):
    if churn_probability > 0.65:
        return "High"
    elif churn_probability > 0.35:
        return "Medium"
    else:
        return "Low"
```

| Risk Level | Probability Range | Interpretation | Recommended Action |
|------------|-------------------|----------------|-------------------|
| **High** | > 65% | User very likely to churn | Immediate intervention needed |
| **Medium** | 35% - 65% | Moderate churn risk | Monitor closely, consider engagement campaigns |
| **Low** | < 35% | User likely to stay active | Maintain current engagement |

---

## API Endpoints

### Endpoint Categories

The API provides 21 total endpoints across 4 categories:
```
📊 Analytics Endpoints (11)
🤖 ML Prediction Endpoints (5)
📦 Bulk Endpoints (2)
🔧 Utility Endpoints (3)
```

### Analytics Endpoints

Base path: `/api/analytics/`

#### 1. Gamer Activation
```http
GET /api/analytics/gamer-activation
```

**Returns**: Daily count of new gamers per game

**Response Structure**:
```json
{
  "metadata": {
    "source": "Dune Analytics",
    "query_id": 6255646,
    "last_updated": "ISO-8601 timestamp",
    "cache_age_hours": 5.2,
    "is_fresh": true,
    "next_refresh": "ISO-8601 timestamp",
    "row_count": 663
  },
  "data": [
    {
      "day": "2025-11-20 00:00:00.000 UTC",
      "project": "Star Atlas",
      "number_of_new_gamers": 1175
    }
  ]
}
```

#### 2. Gamer Retention
```http
GET /api/analytics/gamer-retention
```

**Returns**: Cohort retention analysis showing week-over-week retention percentages

**Response Structure**:
```json
{
  "metadata": { /* ... */ },
  "data": [
    {
      "cohort_week": "2025-11-01 00:00:00.000 UTC",
      "game_project": "Genopets",
      "new_users": 229,
      "% retention 1 week later": 36.24,
      "% retention 2 weeks later": 30.57
      /* ... up to 8 weeks */
    }
  ]
}
```

#### 3. Gamer Reactivation
```http
GET /api/analytics/gamer-reactivation
```

**Returns**: Weekly count of users who returned after being inactive

#### 4. Gamer Deactivation
```http
GET /api/analytics/gamer-deactivation
```

**Returns**: Weekly count of users who became inactive

#### 5. High Retention Users
```http
GET /api/analytics/high-retention-users
```

**Returns**: Individual users with >50% retention rate

**Response Structure**:
```json
{
  "metadata": { /* ... */ },
  "data": [
    {
      "user": "wallet_address",
      "game": "Star Atlas",
      "first active week": "2025-09-22",
      "weeks active": 10,
      "total weeks since start": 10,
      "retention rate %": 100.0,
      "status": "currently active",
      "portfolio link": "<a href='...'>View Portfolio</a>"
    }
  ]
}
```

#### 6. High Retention Summary
```http
GET /api/analytics/high-retention-summary
```

**Returns**: Aggregated retention statistics per game

#### 7. Gamers by Games Played
```http
GET /api/analytics/gamers-by-games-played
```

**Returns**: Distribution of users by number of games played

#### 8. Cross-Game Gamers
```http
GET /api/analytics/cross-game-gamers
```

**Returns**: Users who play multiple games

#### 9. Gaming Activity Total
```http
GET /api/analytics/gaming-activity-total
```

**Returns**: Total transactions and unique users per game

#### 10. Daily Gaming Activity
```http
GET /api/analytics/daily-gaming-activity
```

**Returns**: Time-series of daily activity aggregates

#### 11. User Daily Activity
```http
GET /api/analytics/user-daily-activity
```

**Returns**: User-level daily transaction data (used for ML training)

---

### ML Prediction Endpoints

Base path: `/api/ml/predictions/`

#### 1. Churn Predictions
```http
GET /api/ml/predictions/churn?method={champion|ensemble}
```

**Parameters**:
- `method` (optional): `champion` or `ensemble` (default: `ensemble`)

**Returns**: Churn risk predictions for all active users

**Response Structure**:
```json
{
  "prediction_type": "churn_risk_14_days",
  "method": "ensemble",
  "total_users": 9653,
  "predictions_count": 100,
  "summary": {
    "total_users": 9653,
    "high_risk": 1245,
    "medium_risk": 3421,
    "low_risk": 4987,
    "avg_churn_probability": 0.342
  },
  "predictions": [
    {
      "user_wallet": "wallet_address",
      "project": "Star Atlas",
      "churn_probability": 0.78,
      "churn_risk": "High",
      "active_days_last_7": 2,
      "transactions_last_7": 5,
      "total_active_days": 45,
      "total_transactions": 230,
      "avg_transactions_per_day": 5.1,
      "days_since_last_activity": 3,
      "early_to_late_momentum": 0.4,
      "consistency_score": 0.65,
      "week1_transactions": 12,
      "week_last_transactions": 5
    }
  ],
  "model_info": {
    "champion": "random_forest",
    "roc_auc": 0.8978,
    "ensemble_models": ["random_forest", "lightgbm", "xgboost"]
  },
  "note": "Showing first 100 predictions..."
}
```

#### 2. Churn Predictions by Game
```http
GET /api/ml/predictions/churn/by-game?method={champion|ensemble}
```

**Returns**: Aggregated churn statistics per game

**Response Structure**:
```json
{
  "prediction_type": "churn_by_game",
  "method": "ensemble",
  "data": [
    {
      "project": "Star Atlas",
      "total_users": 3421,
      "avg_churn_probability": 0.34,
      "High": 234,
      "Medium": 1200,
      "Low": 1987
    }
  ],
  "model_info": { /* ... */ }
}
```

#### 3. High-Risk Users
```http
GET /api/ml/predictions/high-risk-users?limit=100
```

**Parameters**:
- `limit` (optional): Number of users to return (1-1000, default: 100)

**Returns**: Top N users with highest churn probability

**Response Structure**:
```json
{
  "prediction_type": "high_risk_users",
  "total_high_risk": 1245,
  "showing": 100,
  "users": [
    {
      "user_wallet": "wallet_address",
      "project": "Genopets",
      "churn_probability": 0.92,
      "churn_risk": "High",
      /* all features */
    }
  ],
  "model_info": { /* ... */ }
}
```

#### 4. Model Leaderboard
```http
GET /api/ml/models/leaderboard
```

**Returns**: Rankings of all trained models

**Response Structure**:
```json
{
  "timestamp": "ISO-8601 timestamp",
  "champion": "random_forest",
  "total_models": 5,
  "leaderboard": [
    {
      "rank": 1,
      "model_name": "random_forest",
      "roc_auc": 0.8978,
      "accuracy": 0.9809,
      "precision": 0.8234,
      "recall": 0.7621,
      "training_time_seconds": 2.34,
      "is_champion": true,
      "in_ensemble": true
    },
    {
      "rank": 2,
      "model_name": "lightgbm",
      "roc_auc": 0.8756,
      /* ... */
      "is_champion": false,
      "in_ensemble": true
    }
    /* ... remaining models */
  ]
}
```

#### 5. Model Info
```http
GET /api/ml/models/info
```

**Returns**: Detailed information about current ML models

**Response Structure**:
```json
{
  "status": "trained",
  "champion": {
    "name": "random_forest",
    "roc_auc": 0.8978,
    "accuracy": 0.9809,
    "trained_at": "ISO-8601 timestamp"
  },
  "ensemble": {
    "models": ["random_forest", "lightgbm", "xgboost"],
    "size": 3
  },
  "features": [
    "active_days_last_7",
    "transactions_last_7",
    /* ... all 10 features */
  ],
  "prediction_window_days": 14
}
```

---

### Bulk Endpoints

#### 1. All Analytics
```http
GET /api/bulk/analytics
```

**Returns**: All 11 analytics endpoints in a single response

**Response Structure**:
```json
{
  "timestamp": "ISO-8601 timestamp",
  "data": {
    "gamer_activation": { /* full response */ },
    "gamer_retention": { /* full response */ },
    "gamer_reactivation": { /* full response */ },
    /* ... all 11 endpoints */
  }
}
```

**Use Case**: Dashboards that need all analytics data at once

#### 2. All Predictions
```http
GET /api/bulk/predictions
```

**Returns**: All ML prediction endpoints in a single response

**Response Structure**:
```json
{
  "timestamp": "ISO-8601 timestamp",
  "predictions": {
    "churn": { /* full churn predictions */ },
    "churn_by_game": { /* per-game breakdown */ },
    "high_risk_users": { /* top 50 high-risk users */ },
    "model_info": { /* model details */ }
  }
}
```

---

### Utility Endpoints

#### 1. Health Check
```http
GET /api/health
```

**Returns**: System health status

**Response Structure**:
```json
{
  "status": "healthy",
  "timestamp": "ISO-8601 timestamp",
  "version": "1.0.0",
  "dune_api_configured": true,
  "ml_models_trained": true,
  "champion_model": "random_forest",
  "models_available": [
    "logistic_regression",
    "random_forest",
    "gradient_boosting",
    "xgboost",
    "lightgbm"
  ]
}
```

#### 2. Cache Status
```http
GET /api/cache/status
```

**Returns**: Detailed cache information for all data sources

**Response Structure**:
```json
{
  "cache_directory": "raw_data_cache",
  "cache_duration_hours": 24,
  "total_sources": 11,
  "sources": {
    "gamer_activation": {
      "type": "Dune Analytics",
      "query_id": 6255646,
      "cache_age_hours": 5.2,
      "is_cached": true,
      "is_fresh": true,
      "last_updated": "ISO-8601 timestamp",
      "row_count": 663
    }
    /* ... all 11 sources */
  }
}
```

#### 3. Force Refresh
```http
POST /api/cache/refresh
```

**Headers**:
```
X-API-Secret: <your_secret_key>
```

**Returns**: Refresh and retraining status

**Response Structure**:
```json
{
  "status": "success",
  "message": "Data refreshed and ML models trained successfully",
  "timestamp": "ISO-8601 timestamp",
  "elapsed_time_seconds": 70.69,
  "data_refreshed": 11,
  "total_queries": 11,
  "models_trained": 5,
  "champion_model": "random_forest",
  "champion_roc_auc": 0.8978,
  "champion_accuracy": 0.9809,
  "top_3_ensemble": ["random_forest", "lightgbm", "xgboost"],
  "training_samples": 4402,
  "predictions_generated": 9653,
  "warning": null
}
```

**Triggers**:
1. Refresh all 11 Dune Analytics queries
2. Retrain all 5 ML models
3. Select new champion
4. Generate fresh predictions
5. Cache all results

---

## Cache Management

### Caching Strategy

The API implements a **time-based caching layer** to optimize performance and reduce API calls to Dune Analytics.

### Cache Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CACHE ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

STORAGE LAYER
├─ Filesystem: raw_data_cache/
├─ Format: joblib serialized DataFrames
└─ Metadata: cache_metadata.json

CACHE KEYS
├─ Pattern: MD5 hash of query name
├─ Example: gamer_activation → a3b2c1d4e5f6...
└─ Files: {hash}.joblib

METADATA TRACKING
├─ last_updated: Timestamp of cache creation
├─ row_count: Number of rows cached
└─ cache_age_hours: Age since last update

TTL MANAGEMENT
├─ Default: 24 hours
├─ Configurable: CACHE_DURATION env var
└─ Validation: Checked on every request
```

### Cache Workflow

```python
# Pseudo-code
async def fetch_data(query_name):
    # Step 1: Check if cache exists and is valid
    if cache_exists(query_name) and cache_age < 24_hours:
        logger.info(f"Using cached data for {query_name}")
        return load_from_cache(query_name)
    
    # Step 2: Cache miss - fetch fresh data
    logger.info(f"Fetching fresh data for {query_name}")
    data = await fetch_from_dune(query_name)
    
    # Step 3: Store in cache
    save_to_cache(query_name, data)
    update_metadata(query_name, timestamp, row_count)
    
    # Step 4: Return data
    return data
```

### Cache Invalidation

**Automatic Invalidation**:
- Cache expires after 24 hours (configurable)
- Next request triggers fresh data fetch

**Manual Invalidation**:
```http
POST /api/cache/refresh
```
Forces immediate refresh of all cached data

### Cache Metadata

Each cached item has associated metadata:

```json
{
  "gamer_activation": {
    "last_updated": "2025-11-29T10:30:00.000000",
    "row_count": 663
  }
}
```

Stored in `raw_data_cache/cache_metadata.json`

### Performance Implications

| Scenario | Response Time | Data Freshness |
|----------|---------------|----------------|
| **Cache Hit** | < 100ms | Up to 24 hours old |
| **Cache Miss** | 2-5 seconds | Real-time |
| **Bulk Request (cached)** | < 500ms | Up to 24 hours old |
| **Bulk Request (miss)** | 20-30 seconds | Real-time |

---

## Deployment & Operations

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAILWAY DEPLOYMENT                            │
└─────────────────────────────────────────────────────────────────┘

CONTAINER
├─ Base Image: python:3.11-slim
├─ Working Directory: /app
└─ Exposed Port: $PORT (dynamic)

BUILD PROCESS
├─ Install system dependencies
├─ Install Python requirements
├─ Copy application code
└─ Create cache directories

RUNTIME
├─ Command: uvicorn main:app --host 0.0.0.0 --port $PORT
├─ Workers: 1
└─ Reload: Disabled (production)

HEALTH CHECKS
├─ Path: /api/health
├─ Timeout: 100 seconds
└─ Restart Policy: ON_FAILURE (max 3 retries)
```

### Environment Variables

Required environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DEFI_JOSH_DUNE_QUERY_API_KEY` | Dune Analytics API key | `dune_api_key_123...` |
| `PORT` | Application port (set by Railway) | `8000` |
| `CACHE_DURATION` | Cache TTL in seconds | `86400` (24 hours) |
| `MIN_TRAINING_SAMPLES` | Minimum samples for training | `100` |
| `PREDICTION_WINDOW_DAYS` | Churn prediction window | `14` |
| `FASTAPI_SECRET` | API secret for protected endpoints | `your_secret_key` |

Query ID environment variables (11 total):
```bash
QUERY_ID_GAMER_ACTIVATION=6255646
QUERY_ID_GAMER_RETENTION=6258723
QUERY_ID_GAMER_REACTIVATION=6258969
QUERY_ID_GAMER_DEACTIVATION=6259007
QUERY_ID_HIGH_RETENTION_USERS=6259066
QUERY_ID_HIGH_RETENTION_SUMMARY=6259161
QUERY_ID_GAMERS_BY_GAMES_PLAYED=6255499
QUERY_ID_CROSS_GAME_GAMERS=6258915
QUERY_ID_GAMING_ACTIVITY_TOTAL=6251582
QUERY_ID_DAILY_GAMING_ACTIVITY=6255551
QUERY_ID_USER_DAILY_ACTIVITY=6273417
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Create directories
RUN mkdir -p raw_data_cache ml_models

# Expose port
EXPOSE 8000

# Run application - Railway will inject PORT env var
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"
```

### Monitoring

**Health Check Endpoint**:
```http
GET /api/health
```

**Logs**:
- Accessible via Railway dashboard
- Structured logging with timestamps
- Log levels: INFO, WARNING, ERROR

**Key Metrics to Monitor**:
- Response times per endpoint
- Cache hit/miss ratio
- Model training success rate
- Error rates

### Scaling Considerations

**Current Configuration**:
- Single worker process
- Suitable for moderate traffic (<100 req/s)

**Scaling Options**:
1. **Vertical**: Increase Railway plan resources
2. **Horizontal**: Add workers with load balancer
3. **Caching**: Implement Redis for shared cache
4. **Database**: Move cache to PostgreSQL for persistence

---

## Integration Guide

### Quick Start

#### 1. Basic Analytics Request

```python
import requests

# Fetch gamer activation data
response = requests.get(
    'https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/analytics/gamer-activation'
)

data = response.json()
print(f"Retrieved {data['metadata']['row_count']} rows")
print(f"Cache age: {data['metadata']['cache_age_hours']} hours")
```

#### 2. Get Churn Predictions

```python
# Get ensemble predictions
response = requests.get(
    'https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/ml/predictions/churn',
    params={'method': 'ensemble'}
)

predictions = response.json()
print(f"Total users analyzed: {predictions['total_users']}")
print(f"High-risk users: {predictions['summary']['high_risk']}")
```

#### 3. Trigger Data Refresh

```python
# Force refresh all data and retrain models
response = requests.post(
    'https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/cache/refresh',
    headers={'X-API-Secret': 'your_secret_key'}
)

result = response.json()
print(f"Champion model: {result['champion_model']}")
print(f"ROC-AUC: {result['champion_roc_auc']}")
```

### Python Client Example

```python
import requests
from typing import Dict, List

class SolanaGamesAPI:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def get_analytics(self, endpoint: str) -> Dict:
        """Fetch analytics data"""
        url = f"{self.base_url}/api/analytics/{endpoint}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    
    def get_churn_predictions(self, method: str = 'ensemble') -> Dict:
        """Get churn predictions"""
        url = f"{self.base_url}/api/ml/predictions/churn"
        response = requests.get(url, params={'method': method})
        response.raise_for_status()
        return response.json()
    
    def get_high_risk_users(self, limit: int = 100) -> List[Dict]:
        """Get high-risk users"""
        url = f"{self.base_url}/api/ml/predictions/high-risk-users"
        response = requests.get(url, params={'limit': limit})
        response.raise_for_status()
        return response.json()['users']

# Usage
api = SolanaGamesAPI('https://solana-game-signals-and-predictive-modelling-production.up.railway.app')

# Get activation data
activation = api.get_analytics('gamer-activation')

# Get predictions
predictions = api.get_churn_predictions()

# Get high-risk users
high_risk = api.get_high_risk_users(limit=50)
```

### JavaScript Client Example

```javascript
class SolanaGamesAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getAnalytics(endpoint) {
    const response = await fetch(
      `${this.baseUrl}/api/analytics/${endpoint}`
    );
    return response.json();
  }

  async getChurnPredictions(method = 'ensemble') {
    const response = await fetch(
      `${this.baseUrl}/api/ml/predictions/churn?method=${method}`
    );
    return response.json();
  }

  async getHighRiskUsers(limit = 100) {
    const response = await fetch(
      `${this.baseUrl}/api/ml/predictions/high-risk-users?limit=${limit}`
    );
    const data = await response.json();
    return data.users;
  }
}

// Usage
const api = new SolanaGamesAPI('https://solana-game-signals-and-predictive-modelling-production.up.railway.app');

// Get activation data
const activation = await api.getAnalytics('gamer-activation');

// Get predictions
const predictions = await api.getChurnPredictions();

// Get high-risk users
const highRisk = await api.getHighRiskUsers(50);
```

### Webhook Integration

For automated workflows, trigger refresh via webhook:

```bash
# In GitHub Actions, cron job, etc.
curl -X POST \
  https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/cache/refresh \
  -H "X-API-Secret: your_secret_key"
```

---

## Troubleshooting

### Common Issues

#### Issue: "ML models not trained yet"

**Symptoms**:
```json
{
  "detail": "ML models not trained yet. Trigger /api/cache/refresh first."
}
```

**Cause**: No models have been trained since deployment

**Solution**:
```bash
curl -X POST https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/cache/refresh \
  -H "X-API-Secret: your_secret_key"
```

---

#### Issue: "No predictions available"

**Symptoms**:
```json
{
  "detail": "No predictions available. Trigger /api/cache/refresh to generate predictions."
}
```

**Cause**: Models trained but predictions not generated

**Solution**: Same as above - trigger refresh

---

#### Issue: Training fails with "only 1 class"

**Symptoms** (in logs):
```
Training data has only 1 class! This will cause model training to fail.
```

**Cause**: Insufficient historical data or data too recent

**Explanation**: 
- ML requires both "churned" and "active" users
- If all users are recent, none have had time to churn
- Training data needs 60+ days of history

**Solution**:
1. Wait for more data accumulation (60+ days)
2. Adjust lookback window in code
3. Or accept that predictions will be unavailable until sufficient data exists

---

#### Issue: Slow response times

**Symptoms**: Requests take 5-10+ seconds

**Possible Causes**:
1. Cache expired - triggering Dune API call
2. Bulk endpoint with all cache misses
3. First request after deployment

**Solutions**:
- Pre-warm cache after deployment
- Schedule regular refresh to keep cache fresh
- Use individual endpoints instead of bulk for faster response

---

#### Issue: 500 Internal Server Error

**Symptoms**: Endpoint returns generic error

**Debug Steps**:
1. Check Railway logs for detailed error
2. Verify environment variables are set
3. Test `/api/health` endpoint
4. Check Dune API key validity

---

### Health Check Verification

Always start troubleshooting with health check:

```bash
curl https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "dune_api_configured": true,
  "ml_models_trained": true,
  "champion_model": "random_forest"
}
```

If `false` values appear, address those first.

---

### Cache Inspection

Check cache status:

```bash
curl https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/cache/status
```

Look for:
- `is_cached: false` - Data never fetched
- `is_fresh: false` - Cache expired
- `cache_age_hours: > 24` - Data stale

---

### Log Monitoring

Key log patterns to watch:

**Successful refresh**:
```
INFO - FORCE REFRESH TRIGGERED
INFO - Successfully fetched gamer_activation: 663 rows
INFO - Created training dataset with 4402 samples
INFO - CHAMPION MODEL: RANDOM_FOREST
INFO - REFRESH COMPLETE in 70.1s
```

**Failed training**:
```
ERROR - Failed to train logistic_regression: only 1 class
WARNING - Training data has only 1 class!
```

**Cache usage**:
```
INFO - Using cached data for gamer_activation
INFO - Fetching fresh data for gamer_retention...
```

---

## Performance Benchmarks

### Response Time Benchmarks

| Endpoint Type | Cache Hit | Cache Miss |
|---------------|-----------|------------|
| Single Analytics | < 100ms | 2-5s |
| Single Prediction | < 150ms | N/A |
| Bulk Analytics | < 500ms | 20-30s |
| Bulk Predictions | < 300ms | N/A |
| Health Check | < 50ms | N/A |
| Cache Status | < 100ms | N/A |

### Training Benchmarks

| Process | Typical Duration |
|---------|------------------|
| Full Data Refresh | 5-10 seconds |
| Feature Engineering | 10-20 seconds |
| Model Training (5 models) | 5-15 seconds |
| Prediction Generation | 15-25 seconds |
| **Total Refresh Cycle** | **60-90 seconds** |

### Resource Usage

| Resource | Typical Usage | Peak Usage |
|----------|---------------|------------|
| Memory | 500MB | 1GB (during training) |
| CPU | 10-20% | 80-100% (during training) |
| Disk | 100MB | 500MB (with cache) |

---

## Advanced Topics

### Custom Feature Engineering

To add new features, modify `FeatureService.create_user_features()`:

```python
# Example: Add average session length
def create_user_features(self, user_data):
    # ... existing features ...
    
    # New feature: average session length
    user_data_sorted = user_data.sort_values('activity_date')
    session_gaps = user_data_sorted['activity_date'].diff()
    features['avg_session_gap'] = session_gaps.mean().days
    
    return features
```

Don't forget to:
1. Add feature name to `self.feature_columns` list
2. Include in prediction pipeline
3. Retrain models

### Adding New ML Models

To add a new model to the ensemble:

```python
# In MLModelManager.__init__()
self.model_configs['catboost'] = {
    'model': CatBoostClassifier(
        iterations=100,
        depth=6,
        learning_rate=0.1,
        verbose=False
    ),
    'priority': 1
}
```

Model will automatically:
- Train with other models
- Compete for champion position
- Be included in ensemble if top 3

### Custom Churn Windows

To predict churn over different time windows:

```python
# Modify prediction window (default: 14 days)
config.prediction_window_days = 30  # Predict 30-day churn

# Adjust feature engineering cutoffs accordingly
target_end = cutoff_date + pd.Timedelta(days=30)
```

### Real-Time Predictions

For individual user predictions without full refresh:

```python
# Create features for specific user
user_data = fetch_user_activity(wallet_address, game_project)
features = feature_service.create_prediction_features(user_data)

# Generate prediction
churn_prob = ml_manager.predict_champion(features)
```

---

## API Versioning

**Current Version**: 1.0.0

**Version Format**: Semantic Versioning (MAJOR.MINOR.PATCH)

- **MAJOR**: Breaking changes to API structure
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

**Accessing Version**:
```http
GET /
```

Returns:
```json
{
  "version": "1.0.0"
}
```

---

## Security Considerations

### API Security

1. **Protected Endpoints**: 
   - `/api/cache/refresh` requires `X-API-Secret` header
   - All other endpoints are public (read-only)

2. **CORS**: 
   - Enabled for all origins
   - Consider restricting in production

3. **Rate Limiting**:
   - Not currently implemented
   - Consider adding for production (e.g., 100 req/min per IP)

4. **HTTPS**: 
   - Railway provides automatic HTTPS
   - All traffic encrypted

### Data Privacy

- **User Wallets**: Public blockchain addresses, not PII
- **No Authentication**: No user accounts or stored credentials
- **No PII**: System processes only on-chain activity data

### Environment Variables

- Store in Railway dashboard, not in code
- Never commit `.env` files to git
- Rotate API keys regularly

---

## Future Enhancements

### Potential Features

1. **Real-Time Streaming**
   - WebSocket support for live updates
   - Server-Sent Events for predictions

2. **Advanced Analytics**
   - Cohort analysis API
   - Funnel tracking
   - Revenue predictions

3. **Model Improvements**
   - Deep learning models (LSTM, Transformers)
   - Reinforcement learning for game-specific tuning
   - Multi-task learning (churn + LTV prediction)

4. **Infrastructure**
   - PostgreSQL for persistent storage
   - Redis for distributed caching
   - Celery for background tasks

5. **Developer Experience**
   - GraphQL endpoint
   - SDK packages (Python, JS, Go)
   - Webhook subscriptions

---

## Contributing

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd solana-games-ml-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Dune API key

# Run locally
uvicorn main:app --reload --port 8000
```

### Testing

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test analytics endpoint
curl http://localhost:8000/api/analytics/gamer-activation

# Trigger refresh (requires data)
curl -X POST http://localhost:8000/api/cache/refresh \
  -H "X-API-Secret: your_secret"
```

### Code Structure

```
.
├── main.py                 # Main application file
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
├── railway.json           # Railway deployment config
├── .env.example           # Example environment variables
├── raw_data_cache/        # Cache directory (created at runtime)
│   ├── *.joblib          # Cached DataFrames
│   └── cache_metadata.json
└── ml_models/             # Model storage (created at runtime)
    ├── *.joblib          # Trained models
    ├── scaler.joblib     # Feature scaler
    └── metadata.json     # Model metadata
```

---

## License

This project is licensed under the MIT License.

---

## Support

For issues, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling/issues)
- **Documentation**: This file + API docs at `/docs`

---

## Changelog

### Version 1.0.0 (2025-11-29)

**Initial Release**
- 11 Dune Analytics endpoints
- 5 ML models with auto-selection
- Champion and ensemble prediction modes
- 24-hour caching system
- Automated retraining pipeline
- Bulk endpoints for efficiency
- Comprehensive API documentation
- Railway deployment configuration

---

## Acknowledgments

- **Dune Analytics**: For blockchain data infrastructure
- **Solana Gaming Community**: For ecosystem support
- **FastAPI Team**: For excellent framework
- **scikit-learn, XGBoost, LightGBM**: For ML libraries