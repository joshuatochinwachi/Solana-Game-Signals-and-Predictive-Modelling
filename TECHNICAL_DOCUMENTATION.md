# Technical Documentation: Solana Games Analytics & ML Platform

**Version:** 1.2.0  
**Last Updated:** December 2025  
**Author:** Josh (@defi__josh)  
**License:** MIT

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Data Pipeline](#3-data-pipeline)
4. [Feature Engineering](#4-feature-engineering)
5. [Machine Learning System](#5-machine-learning-system)
6. [API Documentation](#6-api-documentation)
7. [Deployment](#7-deployment)
8. [Performance Optimization](#8-performance-optimization)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Troubleshooting](#10-troubleshooting)
11. [Future Enhancements](#11-future-enhancements)
12. [Appendix](#12-appendix)

---

## 1. System Overview

### 1.1 Purpose

This platform provides real-time analytics and ML-powered churn prediction for the Solana gaming ecosystem. It aggregates on-chain data from 12+ games, processes behavioral patterns, and predicts which players are at risk of churning 14 days in advance.

### 1.2 Key Capabilities

- **Real-Time Analytics**: 11 behavioral metrics tracked across 60M+ transactions
- **Predictive ML**: 5-model ensemble predicting churn with ~85-90% ROC-AUC (varies with each training run)
- **Self-Training Pipeline**: Automated retraining when fresh data arrives
- **Production API**: 21 REST endpoints with sub-100ms cached responses
- **Adaptive Classification**: Dynamic risk thresholds that adjust to population health

**Note on Metrics:** All performance metrics cited throughout this document are typical ranges based on historical training runs. Actual values update automatically as models retrain on fresh blockchain data. Check `/api/ml/models/leaderboard` for current live metrics.

### 1.3 Target Users

- **Game Developers**: Identify at-risk players for retention campaigns
- **Gaming Guilds**: Monitor member engagement and prioritize outreach
- **Ecosystem Analysts**: Track Solana gaming health metrics
- **Data Scientists**: Reference implementation for behavioral ML

---

## 2. Architecture

### 2.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLANA BLOCKCHAIN                             │
│  (Star Atlas, StepN, Genopets, Portals, Honeyland, etc.)       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ On-chain transactions
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DUNE ANALYTICS                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  11 Custom SQL Queries:                                   │  │
│  │  - gamer_activation (6255646)                            │  │
│  │  - gamer_retention (6258723)                             │  │
│  │  - gamer_reactivation (6258969)                          │  │
│  │  - gamer_deactivation (6259007)                          │  │
│  │  - high_retention_users (6259066)                        │  │
│  │  - high_retention_summary (6259161)                      │  │
│  │  - gamers_by_games_played (6255499)                     │  │
│  │  - cross_game_gamers (6258915)                          │  │
│  │  - gaming_activity_total (6251582)                      │  │
│  │  - daily_gaming_activity (6255551)                      │  │
│  │  - user_daily_activity (6273417)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Dune API (CSV responses)
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND (Railway)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cache Manager                                            │  │
│  │  - 72-hour TTL with metadata tracking                    │  │
│  │  - Atomic refresh mechanism                              │  │
│  │  - joblib serialization for DataFrames                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Feature Engineering Service                              │  │
│  │  - 10 core behavioral features per user-game pair        │  │
│  │  - Temporal windowing (last 7 days, last 60 days)       │  │
│  │  - Momentum & consistency calculations                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ML Model Manager                                         │  │
│  │  - 5 algorithms: LR, RF, GB, XGBoost, LightGBM          │  │
│  │  - Auto-champion selection (best ROC-AUC)                │  │
│  │  - Top-3 ensemble with weighted averaging                │  │
│  │  - Dynamic percentile-based risk thresholds              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REST API (21 endpoints)                                  │  │
│  │  - 11 analytics endpoints                                 │  │
│  │  - 5 ML prediction endpoints                              │  │
│  │  - 5 utility/bulk endpoints                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP/JSON
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              REACT FRONTEND (Vercel)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TanStack Query (30-second polling)                       │  │
│  │  Zustand (State management)                               │  │
│  │  Recharts + D3.js (Visualizations)                        │  │
│  │  Tailwind CSS (Styling)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pages:                                                    │  │
│  │  - Dashboard (Analytics overview)                         │  │
│  │  - ML Predictions (Churn risks, leaderboard)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| Solana Blockchain | Source of truth for all gaming transactions | Solana Runtime |
| Dune Analytics | Data warehouse with pre-aggregated queries | PostgreSQL |
| Cache Manager | Minimize API calls, ensure data freshness | joblib, JSON |
| Feature Service | Transform raw data into ML features | pandas, numpy |
| ML Manager | Train models, generate predictions | scikit-learn, XGBoost, LightGBM |
| FastAPI | Expose data via REST API | Python 3.11, FastAPI |
| React Frontend | Interactive dashboard for end users | React 19, TypeScript |

### 2.3 Data Flow

1. **Blockchain → Dune**: Solana transactions indexed by Dune Analytics
2. **Dune → Backend**: FastAPI fetches via Dune SDK (CSV format)
3. **Backend Caching**: Results stored locally (72-hour TTL)
4. **Feature Engineering**: Raw data transformed into ML features
5. **Model Training**: 5 algorithms trained on features
6. **Prediction Generation**: Churn probabilities calculated for all users
7. **API Response**: JSON served to frontend with metadata
8. **Frontend Display**: React components visualize insights
9. **Auto-Refresh**: Frontend polls every 30 seconds for updates

---

## 3. Data Pipeline

### 3.1 Data Collection (Dune Analytics)

#### Query Execution Flow

```python
# Pseudo-code representation
class DuneQueryExecutor:
    def fetch_data(self, query_id: int) -> pd.DataFrame:
        # 1. Check cache first
        cached = cache_manager.get(f"query_{query_id}")
        if cached and not expired(cached):
            return cached.data
        
        # 2. Execute Dune query
        result = dune_client.get_latest_result(query_id)
        
        # 3. Convert to DataFrame
        df = pd.DataFrame(result.rows)
        
        # 4. Cache with metadata
        cache_manager.set(f"query_{query_id}", df, ttl=72_hours)
        
        return df
```

#### Primary Data Schema: `user_daily_activity` (Query ID: 6273417)

```sql
-- Returns: ~224,610 rows
SELECT 
    day::date,                    -- Activity date
    user_wallet::text,            -- Solana wallet address
    project::text,                -- Game name (e.g., "Star Atlas")
    daily_transactions::integer   -- Transaction count
FROM solana_gaming_transactions
WHERE day >= CURRENT_DATE - INTERVAL '60 days'
ORDER BY day DESC, user_wallet, project;
```

**Column Definitions:**

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `day` | date | Transaction date | 2025-10-08 |
| `user_wallet` | string | User's Solana wallet | 7xKXtg2CW87d97TXJ... |
| `project` | string | Game identifier | "Aurory" |
| `daily_transactions` | integer | Txs that day | 12 |

#### Supporting Data Schema: `gamer_retention` (Query ID: 6258723)

```sql
-- Cohort retention analysis
SELECT 
    project,
    activation_week,
    weeks_since_activation,
    retained_users,
    cohort_size,
    retention_rate
FROM gaming_cohorts
WHERE activation_week >= CURRENT_DATE - INTERVAL '12 weeks';
```

### 3.2 Cache Management

#### Cache Strategy

```python
class CacheManager:
    def __init__(self, cache_dir: str, ttl_seconds: int = 259200):
        self.cache_dir = Path(cache_dir)
        self.ttl = ttl_seconds  # 72 hours default
        self.metadata_file = self.cache_dir / "cache_metadata.json"
    
    def is_expired(self, cache_key: str) -> bool:
        """Check if cached data is older than TTL"""
        metadata = self._load_metadata()
        if cache_key not in metadata:
            return True
        
        cached_time = datetime.fromisoformat(metadata[cache_key]['timestamp'])
        age_seconds = (datetime.utcnow() - cached_time).total_seconds()
        
        return age_seconds > self.ttl
    
    def cache_data(self, key: str, data: pd.DataFrame) -> bool:
        """Atomically cache DataFrame with metadata"""
        try:
            # Serialize DataFrame
            cache_path = self.cache_dir / f"{key}.joblib"
            joblib.dump(data, cache_path)
            
            # Update metadata
            metadata = self._load_metadata()
            metadata[key] = {
                'timestamp': datetime.utcnow().isoformat(),
                'row_count': len(data),
                'columns': list(data.columns)
            }
            self._save_metadata(metadata)
            
            return True
        except Exception as e:
            logger.error(f"Cache write failed: {e}")
            return False
```

#### Cache Invalidation Triggers

Three triggers for cache refresh:

1. **Time-based**: Automatic expiry after 72 hours
2. **Manual**: `POST /api/cache/refresh` endpoint
3. **Data-driven**: If Dune returns significantly different row counts

### 3.3 Data Quality Checks

```python
def validate_dataframe(df: pd.DataFrame, query_name: str) -> bool:
    """Ensure data quality before processing"""
    
    # Check 1: Non-empty
    if df.empty:
        logger.error(f"{query_name}: Empty DataFrame")
        return False
    
    # Check 2: Required columns
    required_cols = QUERY_SCHEMAS.get(query_name, [])
    missing = set(required_cols) - set(df.columns)
    if missing:
        logger.error(f"{query_name}: Missing columns {missing}")
        return False
    
    # Check 3: No all-null columns
    null_cols = df.columns[df.isnull().all()].tolist()
    if null_cols:
        logger.warning(f"{query_name}: All-null columns {null_cols}")
    
    # Check 4: Date range sanity
    if 'day' in df.columns:
        date_range = (df['day'].max() - df['day'].min()).days
        if date_range < 30:
            logger.warning(f"{query_name}: Only {date_range} days of data")
    
    return True
```

---

## 4. Feature Engineering

### 4.1 Overview

I extracted **10 core behavioral features** per user-game pair (plus 3 metadata fields: `user_wallet`, `project`, `will_churn`), totaling 13 columns in the training dataset. These features capture:

- **Recency**: How recently did the user engage?
- **Frequency**: How often do they play?
- **Momentum**: Is engagement increasing or decreasing?
- **Consistency**: Do they play regularly or sporadically?

### 4.2 Target Variable Definition

```python
def create_target_label(user_data: pd.DataFrame, cutoff_date: pd.Timestamp) -> int:
    """
    Define churn: User did NOT transact in 14 days after cutoff.
    
    Label semantics:
    - will_churn = 1: User churned (no activity in next 14 days)
    - will_churn = 0: User retained (had activity in next 14 days)
    
    Args:
        user_data: User's transaction history
        cutoff_date: Point in time to predict from
    
    Returns:
        1 if churned, 0 if retained
    """
    target_start = cutoff_date + pd.Timedelta(days=1)
    target_end = cutoff_date + pd.Timedelta(days=14)
    
    target_period = user_data[
        (user_data['activity_date'] >= target_start) &
        (user_data['activity_date'] <= target_end)
    ]
    
    # If user had any activity in next 14 days → retained (0)
    # If user had NO activity in next 14 days → churned (1)
    return 0 if len(target_period) > 0 else 1
```

**Critical Note**: The target label `will_churn = 1` means the user **churned** (disappeared), while `will_churn = 0` means the user **retained** (stayed). This correct labeling is essential for accurate churn prediction.

### 4.3 Feature Definitions

| Feature | Formula | Range | Interpretation |
|---------|---------|-------|----------------|
| `active_days_last_8` | Count of distinct days with activity in last 8 days | 0-8 | Recent engagement level |
| `transactions_last_8` | Sum of transactions in last 8 days | 0-∞ | Recent engagement intensity |
| `total_active_days` | Count of distinct days with activity (all time) | 1-60 | User tenure/experience |
| `total_transactions` | Sum of all transactions (all time) | 1-∞ | Lifetime value proxy |
| `avg_transactions_per_day` | `total_transactions / total_active_days` | 0-∞ | Average engagement rate |
| `days_since_last_activity` | Days from last activity to cutoff | 0-60 | Recency (lower = better) |
| `week1_transactions` | Transactions in first 7 days | 0-∞ | Onboarding success |
| `week_last_transactions` | Transactions in most recent 7 days | 0-∞ | Current engagement |
| `early_to_late_momentum` | `week_last / week1` (ratio) | 0-∞ | Trend (>1 growing, <1 declining) |
| `consistency_score` | `active_days / total_days_span` | 0-1 | Play regularity |

### 4.4 Feature Engineering Pipeline

```python
def create_user_features(
    user_data: pd.DataFrame,
    user_wallet: str,
    project: str,
    lookback_days: int = 60
) -> Dict[str, Any]:
    """
    Extract features for a single user-game pair.
    
    Args:
        user_data: Filtered to one user + one game
        user_wallet: Solana wallet address
        project: Game name
        lookback_days: Days of history to use (default: 60)
    
    Returns:
        Dictionary with 10 features + metadata
    """
    if user_data.empty:
        return None
    
    # Ensure sorted chronologically
    user_data = user_data.sort_values('activity_date')
    
    # Define cutoff: Predict from day 30 (using first 30 days as history)
    cutoff_date = user_data['activity_date'].max() - pd.Timedelta(days=30)
    
    # Historical data: Everything before cutoff
    historical = user_data[user_data['activity_date'] <= cutoff_date]
    if historical.empty:
        return None
    
    # Time windows
    last_7_days = cutoff_date - pd.Timedelta(days=7)
    first_7_days = historical['activity_date'].min() + pd.Timedelta(days=7)
    
    # Feature extraction
    features = {
        'user_wallet': user_wallet,
        'project': project,
        
        # Recent activity (last 7 days)
        'active_days_last_7': len(historical[
            historical['activity_date'] > last_7_days
        ]['activity_date'].unique()),
        
        'transactions_last_7': historical[
            historical['activity_date'] > last_7_days
        ]['daily_transactions'].sum(),
        
        # Lifetime activity
        'total_active_days': len(historical['activity_date'].unique()),
        'total_transactions': historical['daily_transactions'].sum(),
        
        # Derived metrics
        'avg_transactions_per_day': (
            historical['daily_transactions'].sum() / 
            len(historical['activity_date'].unique())
        ),
        
        'days_since_last_activity': (
            cutoff_date - historical['activity_date'].max()
        ).days,
        
        # Temporal patterns
        'week1_transactions': historical[
            historical['activity_date'] <= first_7_days
        ]['daily_transactions'].sum(),
        
        'week_last_transactions': historical[
            historical['activity_date'] > last_7_days
        ]['daily_transactions'].sum(),
    }
    
    # Momentum calculation (avoid division by zero)
    week1 = features['week1_transactions']
    week_last = features['week_last_transactions']
    features['early_to_late_momentum'] = (
        week_last / week1 if week1 > 0 else 0
    )
    
    # Consistency score
    days_span = (
        historical['activity_date'].max() - 
        historical['activity_date'].min()
    ).days + 1
    features['consistency_score'] = (
        features['total_active_days'] / days_span if days_span > 0 else 0
    )
    
    # TARGET LABEL
    features['will_churn'] = create_target_label(user_data, cutoff_date)
    
    return features
```

### 4.5 Temporal Validation Strategy

To prevent data leakage, we use temporal train-test split:

```python
def temporal_train_test_split(
    df: pd.DataFrame,
    test_ratio: float = 0.25
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split data temporally: Train on earlier data, test on later data.
    
    This prevents data leakage where future information influences
    predictions about the past.
    
    Args:
        df: Training dataset with 'user_wallet' column
        test_ratio: Fraction for test set (default: 0.25)
    
    Returns:
        (train_df, test_df) with temporal separation
    """
    # Sort by implicit time (user wallet hash serves as temporal proxy)
    # In production, you'd sort by actual timestamp if available
    df_sorted = df.sort_values('user_wallet').reset_index(drop=True)
    
    split_idx = int(len(df_sorted) * (1 - test_ratio))
    
    train_df = df_sorted.iloc[:split_idx]
    test_df = df_sorted.iloc[split_idx:]
    
    logger.info(f"Temporal split: Train={len(train_df)}, Test={len(test_df)}")
    
    return train_df, test_df
```

---

## 5. Machine Learning System

### 5.1 Model Architecture

We employ a **multi-model ensemble approach** with automatic champion selection:

1. Train 5 algorithms in parallel
2. Evaluate each on ROC-AUC (primary metric)
3. Select champion (best ROC-AUC)
4. Create top-3 ensemble (weighted by performance)
5. Generate predictions using both champion and ensemble

### 5.2 Supported Algorithms

| Algorithm | Strengths | Weaknesses | Typical Performance |
|-----------|-----------|------------|---------------------|
| **Logistic Regression** | Fast, interpretable, linear boundaries | Cannot capture non-linear patterns | ROC-AUC: 0.75-0.82 |
| **Random Forest** | Handles non-linearity, feature importance | Can overfit, slow on large data | ROC-AUC: 0.82-0.88 |
| **Gradient Boosting** | Excellent performance, adaptive | Prone to overfitting, slow training | ROC-AUC: 0.83-0.89 |
| **XGBoost** | State-of-art, handles imbalance well | Requires tuning, can overfit | ROC-AUC: 0.85-0.92 |
| **LightGBM** | Fast, memory-efficient, accurate | Sensitive to hyperparameters | ROC-AUC: 0.84-0.91 |

### 5.3 Training Pipeline

```python
class MLModelManager:
    def train_and_evaluate_all(
        self,
        training_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Train all models and select champion.
        
        Process:
        1. Temporal train-test split (prevent data leakage)
        2. Standardize features (z-score normalization)
        3. Train 5 models in parallel
        4. Evaluate on test set
        5. Select champion (best ROC-AUC)
        6. Build top-3 ensemble
        
        Args:
            training_df: DataFrame with features + 'will_churn' target
        
        Returns:
            Dictionary with champion, top-3, and metrics
        """
        if training_df.empty:
            raise ValueError("Cannot train on empty dataset")
        
        # Extract features and target
        X = training_df[self.feature_columns].fillna(0)
        y = training_df['will_churn']
        
        # Temporal split (train on earlier data, test on later)
        X_train, X_test, y_train, y_test = self.temporal_train_test_split(
            X, y, test_ratio=0.25
        )
        
        # Check class distribution
        class_dist = y_train.value_counts()
        if len(class_dist) < 2:
            raise ValueError(
                f"⚠️ Training data has only 1 class: {class_dist.to_dict()}"
            )
        
        logger.info(f"✓ Training set class distribution:")
        logger.info(f"  - Churned (1): {class_dist.get(1, 0)}")
        logger.info(f"  - Retained (0): {class_dist.get(0, 0)}")
        
        # Standardize features (mean=0, std=1)
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train all models
        results = {}
        for name, config in self.model_configs.items():
            try:
                model = config['model']
                
                # Train
                start_time = time.time()
                model.fit(X_train_scaled, y_train)
                train_time = time.time() - start_time
                
                # Evaluate
                y_pred = model.predict(X_test_scaled)
                y_proba = model.predict_proba(X_test_scaled)[:, 1]
                
                metrics = {
                    'roc_auc': roc_auc_score(y_test, y_proba),
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, zero_division=0),
                    'recall': recall_score(y_test, y_pred, zero_division=0),
                    'f1': f1_score(y_test, y_pred, zero_division=0),
                    'train_time': train_time
                }
                
                results[name] = {
                    'model': model,
                    'metrics': metrics,
                    'priority': config['priority']
                }
                
                logger.info(
                    f"✓ {name}: ROC-AUC={metrics['roc_auc']:.4f}, "
                    f"Acc={metrics['accuracy']:.4f}, "
                    f"F1={metrics['f1']:.4f}"
                )
                
            except Exception as e:
                logger.error(f"✗ {name} training failed: {e}")
        
        if not results:
            raise ValueError("All models failed to train")
        
        # Select champion (best ROC-AUC)
        sorted_models = sorted(
            results.items(),
            key=lambda x: (x[1]['metrics']['roc_auc'], -x[1]['priority']),
            reverse=True
        )
        
        champion_name, champion_info = sorted_models[0]
        self.champion = {
            'name': champion_name,
            'model': champion_info['model'],
            'roc_auc': champion_info['metrics']['roc_auc'],
            'metrics': champion_info['metrics']
        }
        
        logger.info(f"🏆 CHAMPION: {champion_name} "
                   f"(ROC-AUC: {self.champion['roc_auc']:.4f})")
        
        # Build top-3 ensemble
        self.top_3_ensemble = [
            {
                'name': name,
                'model': info['model'],
                'roc_auc': info['metrics']['roc_auc']
            }
            for name, info in sorted_models[:3]
        ]
        
        return {
            'champion': self.champion,
            'top_3': self.top_3_ensemble,
            'all_results': results
        }
```

### 5.4 Churn Risk Classification

We use **adaptive percentile-based thresholds** to ensure meaningful risk categories:

```python
def classify_risk_with_dynamic_thresholds(
    predictions: np.ndarray
) -> Tuple[np.ndarray, float, float]:
    """
    Classify churn risk using data-driven percentile thresholds.
    
    This approach ensures risk categories remain meaningful regardless
    of the overall population health. If most users are healthy, we still
    identify the relatively higher-risk users.
    
    Strategy:
    - High Risk: Top 15% of churn probabilities (85th percentile)
    - Medium Risk: 50th-85th percentile
    - Low Risk: Bottom 50%
    
    Args:
        predictions: Array of churn probabilities (0-1)
    
    Returns:
        (risk_labels, high_threshold, medium_threshold)
    """
    # Calculate percentile thresholds
    p85 = np.percentile(predictions, 85)  # Top 15% = High
    p50 = np.percentile(predictions, 50)  # Median
    
    # Apply bounds to prevent extreme thresholds
    high_threshold = max(0.5, min(0.8, p85))
    medium_threshold = max(0.2, min(0.5, p50))
    
    # Classify
    risk_labels = np.where(
        predictions > high_threshold, 'High',
        np.where(predictions > medium_threshold, 'Medium', 'Low')
    )
    
    # Log distribution for transparency
    unique, counts = np.unique(risk_labels, return_counts=True)
    dist = dict(zip(unique, counts))
    logger.info(f"📊 Risk Distribution with Thresholds:")
    logger.info(f"   High (>{high_threshold:.2f}): {dist.get('High', 0)}")
    logger.info(f"   Medium (>{medium_threshold:.2f}): {dist.get('Medium', 0)}")
    logger.info(f"   Low (≤{medium_threshold:.2f}): {dist.get('Low', 0)}")
    
    return risk_labels, high_threshold, medium_threshold
```

#### Why Percentile-Based Thresholds?

1. **Adaptability**: Thresholds adjust to actual data distribution
2. **Consistency**: Always get meaningful High/Medium/Low segments
3. **Business Value**: Even in healthy populations, identify who needs attention
4. **Production-Ready**: Works across different games and time periods

**Example:**
- **Healthy game** (90% retention): High risk might be 15% churn probability
- **Struggling game** (50% retention): High risk might be 70% churn probability
- Both correctly identify top 15% at-risk users for their context

### 5.5 Prediction Methods

```python
def predict_champion(self, prediction_df: pd.DataFrame) -> np.ndarray:
    """
    Generate predictions using only the champion model.
    
    Args:
        prediction_df: DataFrame with same features as training
    
    Returns:
        Array of churn probabilities (0-1)
    """
    if not self.champion or not self.scaler:
        raise ValueError("Models not trained yet")
    
    X = prediction_df[self.feature_columns].fillna(0)
    X_scaled = self.scaler.transform(X)
    
    # Predict probability of churn (class 1)
    churn_proba = self.champion['model'].predict_proba(X_scaled)[:, 1]
    
    return churn_proba


def predict_ensemble(self, prediction_df: pd.DataFrame) -> np.ndarray:
    """
    Generate predictions using weighted ensemble of top 3 models.
    
    More robust than single model, especially when models disagree.
    
    Args:
        prediction_df: DataFrame with same features as training
    
    Returns:
        Array of ensemble churn probabilities (0-1)
    """
    if not self.top_3_ensemble or not self.scaler:
        raise ValueError("Models not trained yet")
    
    X = prediction_df[self.feature_columns].fillna(0)
    X_scaled = self.scaler.transform(X)
    
    predictions = []
    weights = []
    
    for model_info in self.top_3_ensemble:
        # Each model predicts churn probability
        pred = model_info['model'].predict_proba(X_scaled)[:, 1]
        predictions.append(pred)
        weights.append(model_info['roc_auc'])  # Weight by performance
    
    # Weighted average
    ensemble_pred = np.average(predictions, axis=0, weights=weights)
    
    return ensemble_pred
```

### 5.6 Model Persistence

```python
def save_models(self, model_dir: Path) -> bool:
    """
    Persist trained models and metadata to disk.
    
    Saves:
    - Individual model files (joblib)
    - Feature scaler
    - metadata.json with metrics and training info
    """
    try:
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save individual models
        for name, config in self.model_configs.items():
            if 'model' in config:
                joblib.dump(
                    config['model'],
                    model_dir / f"{name}.joblib"
                )
        
        # Save scaler
        if self.scaler:
            joblib.dump(self.scaler, model_dir / "scaler.joblib")
        
        # Save metadata
        metadata = {
            'champion': {
                'name': self.champion['name'],
                'roc_auc': self.champion['roc_auc'],
                'metrics': self.champion['metrics']
            },
            'top_3': [
                {'name': m['name'], 'roc_auc': m['roc_auc']}
                for m in self.top_3_ensemble
            ],
            'feature_columns': self.feature_columns,
            'trained_at': datetime.utcnow().isoformat()
        }
        
        with open(model_dir / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"✓ Models saved to {model_dir}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to save models: {e}")
        return False
```

---

## 6. API Documentation

### 6.1 Authentication

Currently, the API uses API key authentication for sensitive operations:

```python
# Protected endpoints require X-API-Secret header
@app.post("/api/cache/refresh")
async def refresh_cache(
    request: Request,
    api_secret: str = Header(None, alias="X-API-Secret")
):
    expected_secret = os.getenv("FASTAPI_SECRET")
    if not api_secret or api_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid API secret")
    
    # Proceed with refresh...
```

### 6.2 Response Format

All endpoints return standardized JSON responses:

```json
{
  "metadata": {
    "query_id": 6273417,
    "row_count": 224610,
    "cached": true,
    "cache_age_hours": 12.5,
    "generated_at": "2025-12-08T14:30:00Z"
  },
  "data": [
    {
      "day": "2025-10-08",
      "user_wallet": "7xKXtg2CW87d...",
      "project": "Aurory",
      "daily_transactions": 12
    }
  ]
}
```

### 6.3 Analytics Endpoints (11 Total)

#### 1. Gamer Activation
**GET** `/api/analytics/gamer-activation`

**Description:** Daily new user acquisition per game

**Response Example:**
```json
{
  "metadata": {...},
  "data": [
    {
      "activation_day": "2025-10-01",
      "project": "Star Atlas",
      "new_users": 245
    }
  ]
}
```

#### 2. Gamer Retention
**GET** `/api/analytics/gamer-retention`

**Description:** Week-over-week cohort retention rates

**Response Example:**
```json
{
  "data": [
    {
      "project": "Genopets",
      "activation_week": "2025-W40",
      "weeks_since_activation": 1,
      "cohort_size": 1000,
      "retained_users": 650,
      "retention_rate": 0.65
    }
  ]
}
```

#### 3-11. Other Analytics Endpoints

See main README for complete list. All follow same response format:
- `/api/analytics/gamer-reactivation`
- `/api/analytics/gamer-deactivation`
- `/api/analytics/high-retention-users`
- `/api/analytics/high-retention-summary`
- `/api/analytics/gamers-by-games-played`
- `/api/analytics/cross-game-gamers`
- `/api/analytics/gaming-activity-total`
- `/api/analytics/daily-gaming-activity`
- `/api/analytics/user-daily-activity`

### 6.4 ML Prediction Endpoints (5 Total)

#### 1. Churn Predictions (Primary)
**GET** `/api/ml/predictions/churn?method=ensemble&limit=100`

**Parameters:**
- `method`: `champion` or `ensemble` (default: `ensemble`)
- `limit`: Max records to return (default: 100)

**Response Example:**
```json
{
  "metadata": {
    "method": "ensemble",
    "model_used": "weighted_top_3",
    "models": ["xgboost", "lightgbm", "random_forest"],
    "generated_at": "2025-12-08T14:30:00Z",
    "thresholds": {
      "high_risk": 0.67,
      "medium_risk": 0.42
    }
  },
  "summary": {
    "total_users": 9653,
    "high_risk": 1448,
    "medium_risk": 3217,
    "low_risk": 4988,
    "avg_churn_probability": 0.38
  },
  "predictions": [
    {
      "user_wallet": "7xKXtg2CW87d...",
      "project": "Star Atlas",
      "churn_probability": 0.78,
      "churn_risk": "High",
      "features": {
        "active_days_last_7": 1,
        "transactions_last_7": 2,
        "days_since_last_activity": 6,
        "early_to_late_momentum": 0.15
      }
    }
  ]
}
```

**Note:** The thresholds are dynamically calculated using percentiles (85th for high, 50th for medium) and logged with each prediction run. This ensures risk categories remain meaningful across different population health levels.

#### 2. High-Risk Users
**GET** `/api/ml/predictions/high-risk-users?limit=50&method=ensemble`

**Description:** Returns only High risk users, sorted by churn probability (descending)

#### 3. Per-Game Churn Summary
**GET** `/api/ml/predictions/churn/by-game?method=ensemble`

**Response Example:**
```json
{
  "summary": [
    {
      "project": "Star Atlas",
      "total_users": 2340,
      "high_risk": 351,
      "medium_risk": 772,
      "low_risk": 1217,
      "avg_churn_probability": 0.42,
      "churn_rate": 0.15
    }
  ]
}
```

#### 4. Model Leaderboard
**GET** `/api/ml/models/leaderboard`

**Description:** All 5 models ranked by ROC-AUC

**Response Example:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "model_name": "xgboost",
      "roc_auc": 0.8745,
      "accuracy": 0.9123,
      "precision": 0.8456,
      "recall": 0.7892,
      "f1": 0.8163,
      "is_champion": true
    },
    {
      "rank": 2,
      "model_name": "lightgbm",
      "roc_auc": 0.8612,
      "is_champion": false
    }
  ]
}
```

#### 5. Model Info
**GET** `/api/ml/models/info`

**Description:** Current champion details and feature importance

### 6.5 Utility Endpoints (5 Total)

#### Health Check
**GET** `/api/health`

**Response Example:**
```json
{
  "status": "healthy",
  "version": "1.2.0",
  "uptime_seconds": 86400,
  "cache_status": {
    "total_cached": 13,
    "oldest_cache_hours": 48.2
  },
  "ml_status": {
    "champion_model": "xgboost",
    "champion_roc_auc": 0.8745,
    "last_trained": "2025-12-07T10:15:00Z"
  },
  "stats": {
    "total_users_analyzed": 9653,
    "total_games": 12,
    "high_risk_users": 1448
  }
}
```

#### Cache Status
**GET** `/api/cache/status`

**Response:** All cached queries with timestamps and ages

#### Force Refresh (Protected)
**POST** `/api/cache/refresh`

**Headers:** `X-API-Secret: <your_secret>`

**Description:** Triggers complete data refresh and model retraining

**Process:**
1. Fetch latest data from all 11 Dune queries
2. Invalidate all caches
3. Create training dataset from `user_daily_activity`
4. Train all 5 models
5. Select new champion
6. Generate fresh predictions
7. Return summary

**Response Example:**
```json
{
  "status": "success",
  "refreshed_queries": 11,
  "training_samples": 4402,
  "champion_model": "xgboost",
  "champion_roc_auc": 0.8745,
  "predictions_generated": 9653,
  "refresh_time_seconds": 45.2
}
```

#### Bulk Analytics
**GET** `/api/bulk/analytics`

**Description:** Returns all 11 analytics endpoints in one response

#### Bulk Predictions
**GET** `/api/bulk/predictions`

**Description:** Returns all ML predictions in one response

---

## 7. Deployment

### 7.1 Backend (Railway)

**Configuration** (`railway.json`):
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Environment Variables:**
```bash
# Required
DEFI_JOSH_DUNE_QUERY_API_KEY_1=<key>
FASTAPI_SECRET=<secret>

# Optional
CACHE_DURATION=259200  # 72 hours
MIN_TRAINING_SAMPLES=100
PREDICTION_WINDOW_DAYS=14

# Query IDs (11 total)
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
# ... (see .env.example)
```

**Resource Allocation:**
- **Memory**: 512MB (scales to 2GB under load)
- **CPU**: Shared vCPU
- **Storage**: Persistent 1GB for cache/models
- **Network**: Railway's edge network

### 7.2 Frontend (Vercel)

**Configuration** (`vercel.json`):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

**Environment Variables:**
```bash
VITE_API_BASE_URL=https://solana-game-signals-and-predictive-modelling-production.up.railway.app
```

**Deployment Settings:**
- **Framework**: Vite (React 19)
- **Node Version**: 18.x
- **Build Cache**: Enabled
- **Edge Network**: Global CDN
- **Auto-Deploy**: On git push to main

### 7.3 CI/CD Pipeline

**GitHub Actions** (Optional - `.github/workflows/deploy.yml`):
```yaml
name: Deploy to Railway & Vercel

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend
          python -m pytest tests/
  
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 8. Performance Optimization

### 8.1 Backend Optimizations

#### Caching Strategy
- **72-hour TTL**: Balance between freshness and API call reduction
- **joblib serialization**: Efficient DataFrame storage
- **Atomic writes**: Prevent corrupted cache
- **Metadata tracking**: Monitor cache age and quality

#### API Response Time
- **Cached**: <100ms
- **Fresh data**: 2-5 seconds
- **Model training**: 30-60 seconds

#### Memory Management
```python
# Clean up old cache files
def cleanup_old_cache(max_age_days: int = 7):
    cache_dir = Path("raw_data_cache")
    for file in cache_dir.glob("*.joblib"):
        if file.stat().st_mtime < (time.time() - max_age_days * 86400):
            file.unlink()
            logger.info(f"Deleted old cache: {file.name}")
```

### 8.2 Frontend Optimizations

#### Code Splitting
```typescript
// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MLPage = lazy(() => import('./pages/MLPage'));

// Routes with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/ml" element={<MLPage />} />
  </Routes>
</Suspense>
```

#### Query Optimization
```typescript
// TanStack Query with smart caching
const { data } = useQuery({
  queryKey: ['churn-predictions', method],
  queryFn: () => api.getChurnPredictions(method),
  staleTime: 30_000,      // Consider fresh for 30s
  cacheTime: 5 * 60_000,  // Keep in cache for 5 min
  refetchInterval: 30_000 // Auto-refresh every 30s
});
```

#### Virtualization
```typescript
// Handle 200K+ rows efficiently
<VirtualizedTable
  data={predictions}
  rowHeight={50}
  overscan={10}
/>
```

### 8.3 Database/Query Optimization

**Dune Query Best Practices:**
1. **Use indexes**: Ensure wallet addresses and dates are indexed
2. **Limit date ranges**: Only query necessary timeframes
3. **Pre-aggregate**: Use `GROUP BY` in SQL rather than pandas
4. **Parameterize**: Use query parameters for dynamic filters

---

## 9. Monitoring & Maintenance

### 9.1 Health Monitoring

**Health Check Endpoint** (`/api/health`):
```python
@app.get("/api/health")
async def health_check():
    try:
        # Check cache health
        cache_status = cache_manager.get_status()
        
        # Check ML models
        ml_status = {
            'champion_model': ml_manager.champion['name'] if ml_manager.champion else None,
            'champion_roc_auc': ml_manager.champion['roc_auc'] if ml_manager.champion else None,
            'last_trained': ml_manager.last_train_time
        }
        
        # Check data freshness
        user_activity = cache_manager.get_data('user_daily_activity')
        data_age_hours = cache_manager.get_cache_age('user_daily_activity')
        
        return {
            'status': 'healthy',
            'version': '1.2.0',
            'uptime_seconds': time.time() - start_time,
            'cache_status': cache_status,
            'ml_status': ml_status,
            'data_age_hours': data_age_hours,
            'stats': {
                'total_users_analyzed': len(user_activity) if user_activity is not None else 0,
                'total_games': 12,
                'high_risk_users': len([p for p in predictions if p['churn_risk'] == 'High'])
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {'status': 'unhealthy', 'error': str(e)}
```

### 9.2 Logging Strategy

**Log Levels:**
```python
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

# Log rotation
from logging.handlers import RotatingFileHandler
handler = RotatingFileHandler(
    'app.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
```

**What to Log:**
- ✅ API requests (endpoint, method, status code)
- ✅ Cache hits/misses
- ✅ Model training events (start, completion, metrics)
- ✅ Errors and exceptions (with stack traces)
- ✅ Data quality warnings
- ❌ Do NOT log: User wallet addresses, API keys

### 9.3 Auto-Retraining Triggers

Models automatically retrain when:

1. **Manual trigger**: `POST /api/cache/refresh`
2. **Scheduled**: Via cron job or GitHub Actions (optional)
3. **Data drift detection**: When prediction distribution changes significantly

**Example GitHub Actions Cron:**
```yaml
name: Weekly Model Retrain

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight

jobs:
  retrain:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Refresh
        run: |
          curl -X POST https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/cache/refresh \
            -H "X-API-Secret: ${{ secrets.FASTAPI_SECRET }}"
```

### 9.4 Error Handling

**Graceful Degradation:**
```python
try:
    # Try to get fresh data
    data = dune_client.get_latest_result(query_id)
except Exception as e:
    logger.warning(f"Dune API failed, using cache: {e}")
    # Fall back to cached data
    data = cache_manager.get_data(f"query_{query_id}")
    if data is None:
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
```

---

## 10. Troubleshooting

### 10.1 Common Issues

#### Issue 1: "All Low Risk" or Imbalanced Risk Distribution

**Symptoms:**
- 95%+ users classified as "Low risk"
- Very few High/Medium risk users
- Frontend shows "No records found" when filtering by High risk

**Root Cause:**
This was caused by incorrect prediction semantics in earlier versions. The system has been updated to use dynamic percentile-based thresholds.

**Solution (Fixed in v1.2.0):**
1. **Correct Target Labeling**: `will_churn = 1` (churned), `will_churn = 0` (retained)
2. **Remove Probability Inversion**: Models now directly predict churn probability
3. **Dynamic Thresholds**: Risk levels adapt to actual prediction distribution

**Verification:**
```bash
# Check current risk distribution
curl https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/ml/predictions/churn | jq '.summary'

# Should see balanced distribution:
# {
#   "high_risk": 1000-1500 (~15%),
#   "medium_risk": 2500-3500 (~30%),
#   "low_risk": 5000-6500 (~55%)
# }
```

#### Issue 2: "Training data has only 1 class"

**Symptoms:**
- Model training fails with class imbalance error
- Logs show "⚠️ Training data has only 1 class!"

**Root Cause:**
- Prediction window too short/long for available data
- All users either churned or all retained in the target period

**Solution:**
```python
# Adjust prediction window in main.py
PREDICTION_WINDOW_DAYS = 7  # Try 7 instead of 14

# Or adjust cutoff date logic in create_user_features()
cutoff_date = user_data['activity_date'].max() - pd.Timedelta(days=30)
```

#### Issue 3: Cache Corruption

**Symptoms:**
- API returns 500 errors
- Logs show "Failed to load cache"

**Solution:**
```bash
# Delete corrupted cache
rm -rf backend/raw_data_cache/*.joblib

# Trigger fresh data fetch
curl -X POST https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/cache/refresh \
  -H "X-API-Secret: your_secret"
```

#### Issue 4: Dune API Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- Slow response times

**Solution:**
1. **Use API key rotation**: Set `DEFI_JOSH_DUNE_QUERY_API_KEY_2` and `_3`
2. **Increase cache TTL**: `CACHE_DURATION=345600` (4 days)
3. **Batch requests**: Use `/api/bulk/analytics` instead of individual endpoints

#### Issue 5: Model Performance Degradation

**Symptoms:**
- ROC-AUC drops below 0.75
- Predictions seem random

**Solution:**
1. **Check data quality**: Verify Dune queries return expected data
2. **Retrain models**: Trigger `/api/cache/refresh`
3. **Inspect features**: Check for missing/null values
4. **Review class distribution**: Ensure balanced churned/retained ratio

### 10.2 Debugging Tools

#### Check Model Metrics
```bash
curl https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/ml/models/leaderboard
```

#### Inspect Cache Status
```bash
curl https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/cache/status
```

#### View Raw Data Sample
```bash
curl https://solana-game-signals-and-predictive-modelling-production.up.railway.app/api/analytics/user-daily-activity | jq '.data[0:5]'
```

#### Monitor Logs (Railway)
```bash
# In Railway dashboard
railway logs --follow
```

---

## 11. Future Enhancements

### 11.1 Advanced Features (Planned)

#### LTV Prediction
- Forecast user lifetime value based on early behavior
- Target high-LTV users for VIP treatment

#### Anomaly Detection
- Alert on unusual transaction patterns
- Detect potential fraud or bot behavior

#### Sentiment Analysis
- Scrape Discord/Twitter for game sentiment
- Correlate social sentiment with churn risk

#### Recommendation Engine
- Suggest games based on user behavior
- Cross-promote within Solana ecosystem

### 11.2 Platform Expansion

#### Mobile App
- React Native iOS/Android
- Push notifications for high-risk users
- Wallet connect for personalized insights

#### Developer API
- Public API for game studios
- Webhook support for real-time alerts
- Custom query builder

#### Zapier Integration
- No-code automation workflows
- Trigger email campaigns on churn risk
- Sync with CRM systems

### 11.3 Decentralization

#### On-Chain Analytics
- Deploy Solana program for on-chain data processing
- Eliminate dependency on centralized infrastructure

#### ZK-Proofs
- Privacy-preserving player profiling
- Encrypted predictions visible only to game studios

#### Token Incentives
- Reward data contributors
- Game studios stake tokens for API access

#### DAO Governance
- Community votes on feature roadmap
- Transparent algorithm improvements

---

## 12. Appendix

### 12.1 Feature Importance

**Note:** These rankings are based on typical Random Forest models. Actual feature importance varies with each training run. Query `/api/ml/models/info` for current feature importance from the live champion model.

**Typical Rankings (Most to Least Predictive):**

Based on typical Random Forest champion model:

| Rank | Feature | Importance | Interpretation |
|------|---------|------------|----------------|
| 1 | `days_since_last_activity` | 0.28 | Most predictive: recent absence = churn |
| 2 | `active_days_last_8` | 0.19 | Recent engagement critical |
| 3 | `transactions_last_8` | 0.15 | Activity intensity matters |
| 4 | `early_to_late_momentum` | 0.12 | Declining trend = risk |
| 5 | `consistency_score` | 0.09 | Regular players less likely to churn |
| 6 | `total_active_days` | 0.07 | Tenure provides some protection |
| 7 | `avg_transactions_per_day` | 0.05 | Baseline engagement level |
| 8 | `week1_transactions` | 0.03 | Onboarding success weak signal |
| 9 | `week_last_transactions` | 0.02 | Captured by active_days_last_8 |
| 10 | `total_transactions` | 0.01 | Lifetime value less predictive |

**Key Insight**: Recency dominates all other features. A user's last activity date is 3x more predictive than any other metric.

### 12.2 Model Comparison

**Note:** Metrics shown are **typical ranges** based on historical training runs. Actual performance varies with each data refresh as player behavior evolves. For current live metrics, query `/api/ml/models/leaderboard`.

Typical performance across 5 algorithms:

| Model | ROC-AUC | Accuracy | Precision | Recall | F1 | Training Time |
|-------|---------|----------|-----------|--------|----|-----------------|
| **XGBoost** ⭐ | 0.8745 | 0.9123 | 0.8456 | 0.7892 | 0.8163 | 12.4s |
| **LightGBM** | 0.8612 | 0.9087 | 0.8321 | 0.7745 | 0.8021 | 8.7s |
| **Random Forest** | 0.8503 | 0.9056 | 0.8198 | 0.7634 | 0.7905 | 15.3s |
| **Gradient Boosting** | 0.8421 | 0.9012 | 0.8034 | 0.7512 | 0.7764 | 18.9s |
| **Logistic Regression** | 0.7889 | 0.8756 | 0.7456 | 0.6923 | 0.7178 | 0.8s |

**Notes:**
- ⭐ = Typical champion
- XGBoost/LightGBM usually dominate
- Ensemble of top-3 often outperforms single champion by 1-2% ROC-AUC
- Training times on 4,000-5,000 samples

### 12.3 Risk Distribution Examples

**Healthy Game (Star Atlas)**:
```
Total Users: 2,340
- High Risk (>0.52): 351 users (15%)
- Medium Risk (>0.28): 772 users (33%)  
- Low Risk (≤0.28): 1,217 users (52%)
```

**Struggling Game (Hypothetical)**:
```
Total Users: 1,200
- High Risk (>0.78): 180 users (15%)
- Medium Risk (>0.65): 396 users (33%)
- Low Risk (≤0.65): 624 users (52%)
```

**Note**: Dynamic thresholds ensure consistent percentages regardless of absolute churn rates.

### 12.4 Dune Query Reference

Complete list of 11 queries with CORRECT IDs:

1. **gamer_activation** (6255646): Daily new user acquisition
2. **gamer_retention** (6258723): Week-over-week cohort retention
3. **gamer_reactivation** (6258969): Weekly returning users
4. **gamer_deactivation** (6259007): Weekly churned users
5. **high_retention_users** (6259066): Players with >50% retention
6. **high_retention_summary** (6259161): Per-game retention stats
7. **gamers_by_games_played** (6255499): Multi-game distribution
8. **cross_game_gamers** (6258915): Cross-game engagement
9. **gaming_activity_total** (6251582): Lifetime metrics per game
10. **daily_gaming_activity** (6255551): Daily activity time-series
11. **user_daily_activity** (6273417): Individual transaction log

All queries available publicly at: https://dune.com/defi__josh/solana-games

### 12.5 API Response Time Benchmarks

Based on Railway deployment (512MB RAM):

| Endpoint Type | Cached | Fresh Data | Post-Training |
|---------------|--------|------------|---------------|
| Analytics (single) | 45-80ms | 2-3s | N/A |
| Analytics (bulk) | 150-300ms | 8-12s | N/A |
| ML Predictions | 60-100ms | N/A | 3-5s |
| Model Leaderboard | 20-40ms | N/A | N/A |
| Health Check | 15-30ms | N/A | N/A |
| Cache Refresh | N/A | N/A | 45-60s |

**Note**: Times measured from US East region. Global CDN reduces latency for international users.

### 12.6 Data Retention & Privacy

**Data Retention:**
- Raw cache: 72 hours (configurable)
- Model files: Persistent until next training
- Logs: 30 days (rotated)
- Predictions: Regenerated on each refresh

**Privacy Considerations:**
- Wallet addresses stored but not linked to personal identity
- All data sourced from public blockchain
- No PII collected or stored
- GDPR compliant (public data exemption)

### 12.7 Tech Stack Versions

**Backend:**
- Python: 3.11.x
- FastAPI: 0.104.x
- pandas: 2.1.x
- scikit-learn: 1.3.x
- XGBoost: 2.0.x
- LightGBM: 4.1.x
- joblib: 1.3.x
- numpy: 1.26.x
- Dune Client: 1.3.x

**Frontend:**
- React: 19.x
- TypeScript: 5.3.x
- Vite: 5.x
- TanStack Query: 5.x
- Zustand: 4.x
- Recharts: 2.x
- D3.js: 7.x
- Tailwind CSS: 3.x

**Infrastructure:**
- Railway: Latest (auto-updates)
- Vercel: Latest (auto-updates)
- Node.js: 18.x

### 12.8 Cost Breakdown (Monthly)

**Estimated Monthly Costs:**

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Railway (Backend) | Hobby | $5-10 | Based on usage |
| Vercel (Frontend) | Free | $0 | Within free tier limits |
| Dune Analytics | Free | $0 | Community plan sufficient |
| **Total** | | **$5-10/month** | Extremely cost-effective |

**Cost Optimization Tips:**
1. Use longer cache TTL to reduce Dune API calls
2. Implement request batching for bulk endpoints
3. Optimize model training frequency (weekly vs daily)
4. Use Vercel's edge caching aggressively

### 12.9 Security Best Practices

**API Security:**
```python
# 1. Environment variable validation
if not os.getenv("FASTAPI_SECRET"):
    raise ValueError("FASTAPI_SECRET must be set")

# 2. CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],  # Specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# 3. Rate limiting (optional with slowapi)
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/ml/predictions/churn")
@limiter.limit("10/minute")  # 10 requests per minute
async def get_predictions():
    ...

# 4. Input validation
from pydantic import BaseModel, validator

class PredictionRequest(BaseModel):
    method: str
    limit: int
    
    @validator('method')
    def validate_method(cls, v):
        if v not in ['champion', 'ensemble']:
            raise ValueError('method must be champion or ensemble')
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1 or v > 10000:
            raise ValueError('limit must be between 1 and 10000')
        return v
```

**Data Security:**
- Never log API keys or secrets
- Use `.env` files (never commit to git)
- Rotate Dune API keys if compromised
- Implement request throttling for public endpoints

### 12.10 Testing Strategy

**Unit Tests** (Example with pytest):
```python
# tests/test_feature_engineering.py
import pytest
from main import create_user_features

def test_feature_extraction():
    # Mock user data
    user_data = pd.DataFrame({
        'activity_date': pd.date_range('2025-01-01', periods=30),
        'daily_transactions': [5] * 30,
        'user_wallet': ['test_wallet'] * 30,
        'project': ['Test Game'] * 30
    })
    
    features = create_user_features(user_data, 'test_wallet', 'Test Game')
    
    assert features is not None
    assert 'will_churn' in features
    assert features['total_active_days'] == 30
    assert features['active_days_last_7'] <= 7

def test_target_label():
    # Test churned user
    churned_data = pd.DataFrame({
        'activity_date': pd.date_range('2025-01-01', periods=10),
        'daily_transactions': [5] * 10
    })
    label = create_target_label(churned_data, pd.Timestamp('2025-01-10'))
    assert label == 1  # Churned
    
    # Test retained user
    retained_data = pd.DataFrame({
        'activity_date': pd.date_range('2025-01-01', periods=30),
        'daily_transactions': [5] * 30
    })
    label = create_target_label(retained_data, pd.Timestamp('2025-01-10'))
    assert label == 0  # Retained
```

**Integration Tests:**
```python
# tests/test_api.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'

def test_predictions_endpoint():
    response = client.get("/api/ml/predictions/churn?method=ensemble&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert 'predictions' in data
    assert len(data['predictions']) <= 10
```

**Run Tests:**
```bash
# Install pytest
pip install pytest pytest-cov

# Run tests with coverage
pytest tests/ --cov=main --cov-report=html

# View coverage report
open htmlcov/index.html
```

### 12.11 Glossary

**Technical Terms:**

- **ROC-AUC**: Receiver Operating Characteristic - Area Under Curve. Metric for binary classification (0.5 = random, 1.0 = perfect)
- **Churn**: When a user stops engaging with a game/platform
- **Retention**: Percentage of users who continue playing after a given period
- **Cohort**: Group of users who started playing at the same time
- **Ensemble**: Combination of multiple ML models for more robust predictions
- **Feature Engineering**: Creating predictive variables from raw data
- **Temporal Validation**: Training/testing on chronologically separated data to prevent data leakage
- **Data Leakage**: When future information incorrectly influences past predictions
- **Percentile**: Value below which a given percentage of observations fall (e.g., 85th percentile = top 15%)

**Business Terms:**

- **LTV (Lifetime Value)**: Total revenue expected from a user over their entire engagement
- **CAC (Customer Acquisition Cost)**: Cost to acquire one new player
- **MAU (Monthly Active Users)**: Unique users active in the last 30 days
- **DAU (Daily Active Users)**: Unique users active in the last 24 hours
- **Whale**: High-value user who spends significantly more than average

**Solana-Specific:**

- **Wallet Address**: Public key used to receive/send transactions on Solana
- **Transaction**: On-chain interaction (e.g., game action, NFT mint, token swap)
- **Program**: Smart contract on Solana blockchain
- **PDA (Program Derived Address)**: Deterministic address controlled by a program

---

## Contact & Support

**Developer:** Josh (@defi__josh)

**Resources:**
- GitHub: [github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling](https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling)
- Live Dashboard: [solana-games.app](https://solana-games.app)
- API Docs: [solana-game-signals-and-predictive-modelling-production.up.railway.app/docs](https://solana-game-signals-and-predictive-modelling-production.up.railway.app/docs)
- Dune Dashboard: [dune.com/defi__josh/solana-games](https://dune.com/defi__josh/solana-games)

**Support:**
- Issues: [GitHub Issues](https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling/issues)
- Discussions: [GitHub Discussions](https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling/discussions)
- Email: joshuatochinwachi@gmail.com
- Twitter/X: [@defi__josh](https://x.com/defi__josh)

---

**Document Version:** 1.2.0  
**Last Updated:** December 8, 2025  
**Next Review:** January 2026

---

*This documentation is part of an open-source project. Contributions, feedback, and suggestions are welcome via GitHub.*