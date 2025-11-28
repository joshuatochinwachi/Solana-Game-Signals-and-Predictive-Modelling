"""
Solana Games ML Analytics API
Version: 1.0.0
Features:
- 10 Dune Analytics endpoints (cached data)
- Multi-model ML ensemble with auto-selection
- Automated retraining on data refresh
- GitHub Actions integration
"""

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import os
import time
import hashlib
import joblib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from dune_client.client import DuneClient
from dotenv import load_dotenv
import asyncio
from pydantic import BaseModel
from contextlib import asynccontextmanager
import json

# ML imports
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    
try:
    from lightgbm import LGBMClassifier
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== CONFIGURATION ====================

class Config:
    def __init__(self):
        self.dune_api_key = os.getenv("DEFI_JOSH_DUNE_QUERY_API_KEY")
        
        self.dune_queries = {
            'gamer_activation': int(os.getenv('QUERY_ID_GAMER_ACTIVATION', 6255646)),
            'gamer_retention': int(os.getenv('QUERY_ID_GAMER_RETENTION', 6258723)),
            'gamer_reactivation': int(os.getenv('QUERY_ID_GAMER_REACTIVATION', 6258969)),
            'gamer_deactivation': int(os.getenv('QUERY_ID_GAMER_DEACTIVATION', 6259007)),
            'high_retention_users': int(os.getenv('QUERY_ID_HIGH_RETENTION_USERS', 6259066)),
            'high_retention_summary': int(os.getenv('QUERY_ID_HIGH_RETENTION_SUMMARY', 6259161)),
            'gamers_by_games_played': int(os.getenv('QUERY_ID_GAMERS_BY_GAMES_PLAYED', 6255499)),
            'cross_game_gamers': int(os.getenv('QUERY_ID_CROSS_GAME_GAMERS', 6258915)),
            'gaming_activity_total': int(os.getenv('QUERY_ID_GAMING_ACTIVITY_TOTAL', 6251582)),
            'daily_gaming_activity': int(os.getenv('QUERY_ID_DAILY_GAMING_ACTIVITY', 6255551))
        }
        
        self.cache_duration = int(os.getenv('CACHE_DURATION', 86400))
        self.min_training_samples = int(os.getenv('MIN_TRAINING_SAMPLES', 100))
        self.prediction_window_days = int(os.getenv('PREDICTION_WINDOW_DAYS', 14))
        self.api_secret = os.getenv('FASTAPI_SECRET', '')

config = Config()

# ==================== PYDANTIC MODELS ====================

class DataMetadata(BaseModel):
    source: str
    query_id: Optional[int] = None
    last_updated: str
    cache_age_hours: float
    is_fresh: bool
    next_refresh: str
    row_count: int

# ==================== CACHE MANAGER ====================

class CacheManager:
    def __init__(self):
        self.cache_dir = "raw_data_cache"
        os.makedirs(self.cache_dir, exist_ok=True)
        
        if config.dune_api_key:
            self.dune_client = DuneClient(config.dune_api_key)
        
        self.metadata_file = os.path.join(self.cache_dir, "cache_metadata.json")
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict:
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_metadata(self):
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save metadata: {e}")
    
    def _get_cache_path(self, key: str) -> str:
        safe_key = hashlib.md5(key.encode()).hexdigest()
        return os.path.join(self.cache_dir, f"{safe_key}.joblib")
    
    def _is_cache_valid(self, key: str) -> bool:
        filepath = self._get_cache_path(key)
        if not os.path.exists(filepath):
            return False
        file_age = time.time() - os.path.getmtime(filepath)
        return file_age < config.cache_duration
    
    def _get_cache_age(self, key: str) -> float:
        filepath = self._get_cache_path(key)
        if not os.path.exists(filepath):
            return float('inf')
        file_age = time.time() - os.path.getmtime(filepath)
        return file_age / 3600
    
    def get_cached_data(self, key: str) -> Optional[pd.DataFrame]:
        if self._is_cache_valid(key):
            filepath = self._get_cache_path(key)
            try:
                return joblib.load(filepath)
            except Exception as e:
                logger.warning(f"Cache read error for {key}: {e}")
        return None
    
    def cache_data(self, key: str, data: pd.DataFrame):
        filepath = self._get_cache_path(key)
        try:
            joblib.dump(data, filepath)
            self.metadata[key] = {
                'last_updated': datetime.now().isoformat(),
                'row_count': len(data)
            }
            self._save_metadata()
            logger.info(f"Cached {key}: {len(data)} rows")
        except Exception as e:
            logger.error(f"Cache write error for {key}: {e}")
    
    async def fetch_dune_raw(self, query_key: str) -> pd.DataFrame:
        cached = self.get_cached_data(query_key)
        if cached is not None:
            logger.info(f"Using cached data for {query_key}")
            return cached
        
        if not hasattr(self, 'dune_client'):
            logger.warning("Dune client not initialized")
            return pd.DataFrame()
        
        try:
            logger.info(f"Fetching fresh data for {query_key}...")
            
            def fetch_sync():
                query_id = config.dune_queries[query_key]
                result = self.dune_client.get_latest_result(query_id)
                return pd.DataFrame(result.result.rows)
            
            loop = asyncio.get_event_loop()
            df = await loop.run_in_executor(None, fetch_sync)
            
            self.cache_data(query_key, df)
            logger.info(f"Successfully fetched {query_key}: {len(df)} rows")
            return df
        except Exception as e:
            logger.error(f"Failed to fetch {query_key}: {e}")
            return pd.DataFrame()
    
    def get_metadata_for_key(self, key: str, source: str, query_id: Optional[int] = None) -> DataMetadata:
        cache_age = self._get_cache_age(key)
        last_updated = self.metadata.get(key, {}).get('last_updated', 'Unknown')
        row_count = self.metadata.get(key, {}).get('row_count', 0)
        
        if cache_age == float('inf'):
            next_refresh = 'Not cached yet'
            is_fresh = False
        else:
            cache_duration_hours = config.cache_duration / 3600
            is_fresh = cache_age < cache_duration_hours
            hours_until_refresh = cache_duration_hours - cache_age
            next_refresh_time = datetime.now() + timedelta(hours=hours_until_refresh)
            next_refresh = next_refresh_time.isoformat()
        
        return DataMetadata(
            source=source,
            query_id=query_id,
            last_updated=last_updated,
            cache_age_hours=round(cache_age, 2) if cache_age != float('inf') else 0,
            is_fresh=is_fresh,
            next_refresh=next_refresh,
            row_count=row_count
        )

# ==================== FEATURE ENGINEERING ====================

class FeatureService:
    def __init__(self):
        self.feature_columns = [
            'active_days_last_7',
            'transactions_last_7',
            'total_active_days',
            'total_transactions',
            'avg_transactions_per_day',
            'days_since_last_activity',
            'early_to_late_momentum',
            'consistency_score',
            'week1_transactions',
            'week_last_transactions'
        ]
    
    def create_user_features(self, user_data: pd.DataFrame, lookback_days: int = 45) -> Optional[Dict]:
        if len(user_data) == 0:
            return None
        
        user_data = user_data.sort_values('activity_date')
        cutoff_date = user_data['activity_date'].max() - pd.Timedelta(days=(60 - lookback_days))
        
        training_period = user_data[user_data['activity_date'] <= cutoff_date]
        target_period = user_data[user_data['activity_date'] > cutoff_date]
        
        if len(training_period) == 0:
            return None
        
        features = {}
        
        try:
            last_7_days = training_period[
                training_period['activity_date'] >= (cutoff_date - pd.Timedelta(days=7))
            ]
            features['active_days_last_7'] = last_7_days['activity_date'].nunique()
            features['transactions_last_7'] = last_7_days.get('daily_transactions', pd.Series([0])).sum()
            
            features['total_active_days'] = training_period['activity_date'].nunique()
            features['total_transactions'] = training_period.get('daily_transactions', pd.Series([0])).sum()
            
            features['avg_transactions_per_day'] = (
                features['total_transactions'] / features['total_active_days']
                if features['total_active_days'] > 0 else 0
            )
            
            week1 = training_period[
                training_period['activity_date'] <= (training_period['activity_date'].min() + pd.Timedelta(days=7))
            ]
            week_last = training_period[
                training_period['activity_date'] >= (cutoff_date - pd.Timedelta(days=7))
            ]
            
            features['week1_transactions'] = week1.get('daily_transactions', pd.Series([0])).sum()
            features['week_last_transactions'] = week_last.get('daily_transactions', pd.Series([0])).sum()
            
            if features['week1_transactions'] > 0:
                features['early_to_late_momentum'] = (
                    features['week_last_transactions'] / features['week1_transactions']
                )
            else:
                features['early_to_late_momentum'] = 0
            
            training_sorted = training_period.sort_values('activity_date')
            training_sorted['days_gap'] = training_sorted['activity_date'].diff().dt.days
            std_gap = training_sorted['days_gap'].std()
            features['consistency_score'] = 1 / (std_gap + 1) if std_gap > 0 else 1
            
            features['days_since_last_activity'] = (
                cutoff_date - training_period['activity_date'].max()
            ).days
            
            features['will_be_active_next_14_days'] = 1 if len(target_period) > 0 else 0
            
            return features
        except Exception as e:
            logger.error(f"Error creating features: {e}")
            return None
    
    def create_training_dataset(self, daily_activity_df: pd.DataFrame) -> pd.DataFrame:
        training_data = []
        
        for (user, project), group in daily_activity_df.groupby(['user_wallet', 'project']):
            if len(group) >= 10:
                features = self.create_user_features(group, lookback_days=45)
                if features:
                    features['user_wallet'] = user
                    features['project'] = project
                    training_data.append(features)
        
        df = pd.DataFrame(training_data)
        logger.info(f"Created training dataset with {len(df)} samples")
        return df
    
    def create_prediction_features(self, daily_activity_df: pd.DataFrame) -> pd.DataFrame:
        prediction_data = []
        
        for (user, project), group in daily_activity_df.groupby(['user_wallet', 'project']):
            if len(group) >= 5:
                user_data = group.sort_values('activity_date')
                latest_date = user_data['activity_date'].max()
                
                features = {}
                
                last_7 = user_data[user_data['activity_date'] >= (latest_date - pd.Timedelta(days=7))]
                features['active_days_last_7'] = last_7['activity_date'].nunique()
                features['transactions_last_7'] = last_7.get('daily_transactions', pd.Series([0])).sum()
                
                features['total_active_days'] = user_data['activity_date'].nunique()
                features['total_transactions'] = user_data.get('daily_transactions', pd.Series([0])).sum()
                features['avg_transactions_per_day'] = (
                    features['total_transactions'] / features['total_active_days']
                    if features['total_active_days'] > 0 else 0
                )
                
                features['days_since_last_activity'] = (
                    datetime.now() - user_data['activity_date'].max()
                ).days
                
                first_week = user_data.head(7)
                last_week = user_data.tail(7)
                features['week1_transactions'] = first_week.get('daily_transactions', pd.Series([0])).sum()
                features['week_last_transactions'] = last_week.get('daily_transactions', pd.Series([0])).sum()
                
                if features['week1_transactions'] > 0:
                    features['early_to_late_momentum'] = (
                        features['week_last_transactions'] / features['week1_transactions']
                    )
                else:
                    features['early_to_late_momentum'] = 0
                
                user_data_sorted = user_data.sort_values('activity_date')
                user_data_sorted['days_gap'] = user_data_sorted['activity_date'].diff().dt.days
                std_gap = user_data_sorted['days_gap'].std()
                features['consistency_score'] = 1 / (std_gap + 1) if std_gap > 0 else 1
                
                features['user_wallet'] = user
                features['project'] = project
                prediction_data.append(features)
        
        df = pd.DataFrame(prediction_data)
        logger.info(f"Created prediction dataset with {len(df)} samples")
        return df

# ==================== ML MODEL MANAGER ====================

class MLModelManager:
    def __init__(self):
        self.models_dir = "ml_models"
        os.makedirs(self.models_dir, exist_ok=True)
        
        self.feature_columns = [
            'active_days_last_7', 'transactions_last_7', 'total_active_days',
            'total_transactions', 'avg_transactions_per_day', 'days_since_last_activity',
            'early_to_late_momentum', 'consistency_score', 'week1_transactions', 'week_last_transactions'
        ]
        
        self.champion = None
        self.top_3_ensemble = []
        self.all_models = []
        self.scaler = None
        self.model_history = []
        
        self.model_configs = {
            'logistic_regression': {
                'model': LogisticRegression(max_iter=1000, random_state=42),
                'priority': 3
            },
            'random_forest': {
                'model': RandomForestClassifier(
                    n_estimators=100, max_depth=8, min_samples_split=10,
                    random_state=42, n_jobs=-1
                ),
                'priority': 2
            },
            'gradient_boosting': {
                'model': GradientBoostingClassifier(
                    n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42
                ),
                'priority': 2
            }
        }
        
        if XGBOOST_AVAILABLE:
            self.model_configs['xgboost'] = {
                'model': XGBClassifier(
                    n_estimators=100, max_depth=6, learning_rate=0.1,
                    random_state=42, eval_metric='logloss'
                ),
                'priority': 1
            }
        
        if LIGHTGBM_AVAILABLE:
            self.model_configs['lightgbm'] = {
                'model': LGBMClassifier(
                    n_estimators=100, max_depth=6, learning_rate=0.1,
                    random_state=42, verbose=-1
                ),
                'priority': 1
            }
        
        self._load_models()
    
    def train_and_evaluate_all(self, training_df: pd.DataFrame) -> List[Dict]:
        logger.info("=" * 60)
        logger.info("TRAINING MULTIPLE ML MODELS")
        logger.info("=" * 60)
        
        X = training_df[self.feature_columns].fillna(0)
        y = training_df['will_be_active_next_14_days']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )
        
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        results = []
        
        for name, config in self.model_configs.items():
            try:
                logger.info(f"Training {name}...")
                start_time = time.time()
                
                model = config['model']
                model.fit(X_train_scaled, y_train)
                training_time = time.time() - start_time
                
                y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
                y_pred = model.predict(X_test_scaled)
                
                metrics = {
                    'name': name,
                    'model': model,
                    'roc_auc': roc_auc_score(y_test, y_pred_proba),
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, zero_division=0),
                    'recall': recall_score(y_test, y_pred, zero_division=0),
                    'training_time': training_time,
                    'timestamp': datetime.now().isoformat()
                }
                
                results.append(metrics)
                logger.info(f"  ✓ {name}: ROC-AUC={metrics['roc_auc']:.4f}, Accuracy={metrics['accuracy']:.4f}")
                
            except Exception as e:
                logger.error(f"  ✗ Failed to train {name}: {e}")
        
        results.sort(key=lambda x: (x['roc_auc'], x['accuracy']), reverse=True)
        
        if results:
            self.champion = results[0]
            self.top_3_ensemble = results[:min(3, len(results))]
            self.all_models = results
            
            logger.info("=" * 60)
            logger.info(f"CHAMPION MODEL: {self.champion['name'].upper()}")
            logger.info(f"ROC-AUC: {self.champion['roc_auc']:.4f}")
            logger.info(f"Top 3: {', '.join([m['name'] for m in self.top_3_ensemble])}")
            logger.info("=" * 60)
            
            self._save_models()
            
            self.model_history.append({
                'timestamp': datetime.now().isoformat(),
                'champion': self.champion['name'],
                'roc_auc': self.champion['roc_auc']
            })
        
        return results
    
    def predict_champion(self, prediction_df: pd.DataFrame) -> np.ndarray:
        if not self.champion or not self.scaler:
            raise ValueError("Models not trained yet")
        
        X = prediction_df[self.feature_columns].fillna(0)
        X_scaled = self.scaler.transform(X)
        churn_proba = 1 - self.champion['model'].predict_proba(X_scaled)[:, 1]
        return churn_proba
    
    def predict_ensemble(self, prediction_df: pd.DataFrame) -> np.ndarray:
        if not self.top_3_ensemble or not self.scaler:
            raise ValueError("Models not trained yet")
        
        X = prediction_df[self.feature_columns].fillna(0)
        X_scaled = self.scaler.transform(X)
        
        predictions = []
        weights = []
        
        for model_info in self.top_3_ensemble:
            pred = 1 - model_info['model'].predict_proba(X_scaled)[:, 1]
            predictions.append(pred)
            weights.append(model_info['roc_auc'])
        
        ensemble_pred = np.average(predictions, axis=0, weights=weights)
        return ensemble_pred
    
    def _save_models(self):
        try:
            joblib.dump(self.scaler, os.path.join(self.models_dir, 'scaler.joblib'))
            
            for model_info in self.all_models:
                model_path = os.path.join(self.models_dir, f"{model_info['name']}.joblib")
                joblib.dump(model_info['model'], model_path)
            
            metadata = {
                'champion': self.champion['name'] if self.champion else None,
                'champion_roc_auc': self.champion['roc_auc'] if self.champion else 0,
                'top_3': [m['name'] for m in self.top_3_ensemble],
                'last_trained': datetime.now().isoformat(),
                'model_history': self.model_history[-10:]
            }
            
            with open(os.path.join(self.models_dir, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def _load_models(self):
        try:
            metadata_path = os.path.join(self.models_dir, 'metadata.json')
            if not os.path.exists(metadata_path):
                return
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            scaler_path = os.path.join(self.models_dir, 'scaler.joblib')
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            
            champion_name = metadata.get('champion')
            if champion_name:
                model_path = os.path.join(self.models_dir, f"{champion_name}.joblib")
                if os.path.exists(model_path):
                    model = joblib.load(model_path)
                    self.champion = {
                        'name': champion_name,
                        'model': model,
                        'roc_auc': metadata.get('champion_roc_auc', 0)
                    }
            
            logger.info(f"Loaded existing models. Champion: {champion_name}")
        except Exception as e:
            logger.error(f"Error loading models: {e}")

# Global instances
cache_manager = CacheManager()
feature_service = FeatureService()
ml_manager = MLModelManager()

# ==================== FASTAPI APP ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("Starting Solana Games ML Analytics API v1.0")
    logger.info(f"XGBoost: {XGBOOST_AVAILABLE} | LightGBM: {LIGHTGBM_AVAILABLE}")
    logger.info("=" * 60)
    yield
    logger.info("Shutting down API")

app = FastAPI(
    title="Solana Games ML Analytics API",
    description="Real-time analytics and ML predictions for Solana gaming ecosystem",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ROOT ENDPOINT ====================

@app.get("/")
async def root():
    return {
        "message": "Solana Games ML Analytics API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "cache_info": "/api/cache/status",
        "endpoints": {
            "analytics": {
                "gamer_activation": "/api/analytics/gamer-activation",
                "gamer_retention": "/api/analytics/gamer-retention",
                "gamer_reactivation": "/api/analytics/gamer-reactivation",
                "gamer_deactivation": "/api/analytics/gamer-deactivation",
                "high_retention_users": "/api/analytics/high-retention-users",
                "high_retention_summary": "/api/analytics/high-retention-summary",
                "gamers_by_games_played": "/api/analytics/gamers-by-games-played",
                "cross_game_gamers": "/api/analytics/cross-game-gamers",
                "gaming_activity_total": "/api/analytics/gaming-activity-total",
                "daily_gaming_activity": "/api/analytics/daily-gaming-activity"
            },
            "ml_predictions": {
                "churn_predictions": "/api/ml/predictions/churn",
                "churn_by_game": "/api/ml/predictions/churn/by-game",
                "high_risk_users": "/api/ml/predictions/high-risk-users",
                "model_leaderboard": "/api/ml/models/leaderboard",
                "model_info": "/api/ml/models/info"
            },
            "bulk": {
                "all_analytics": "/api/bulk/analytics",
                "all_predictions": "/api/bulk/predictions"
            },
            "utilities": {
                "cache_status": "/api/cache/status",
                "force_refresh": "/api/cache/refresh",
                "health": "/api/health"
            }
        },
        "total_analytics_sources": 10,
        "ml_models_available": len(ml_manager.model_configs),
        "champion_model": ml_manager.champion['name'] if ml_manager.champion else "Not trained yet",
        "cache_duration_hours": config.cache_duration / 3600
    }

# ==================== ANALYTICS ENDPOINTS ====================

@app.get("/api/analytics/gamer-activation")
async def get_gamer_activation():
    df = await cache_manager.fetch_dune_raw('gamer_activation')
    metadata = cache_manager.get_metadata_for_key(
        'gamer_activation',
        'Dune Analytics',
        config.dune_queries['gamer_activation']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/gamer-retention")
async def get_gamer_retention():
    df = await cache_manager.fetch_dune_raw('gamer_retention')
    metadata = cache_manager.get_metadata_for_key(
        'gamer_retention',
        'Dune Analytics',
        config.dune_queries['gamer_retention']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/gamer-reactivation")
async def get_gamer_reactivation():
    df = await cache_manager.fetch_dune_raw('gamer_reactivation')
    metadata = cache_manager.get_metadata_for_key(
        'gamer_reactivation',
        'Dune Analytics',
        config.dune_queries['gamer_reactivation']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/gamer-deactivation")
async def get_gamer_deactivation():
    df = await cache_manager.fetch_dune_raw('gamer_deactivation')
    metadata = cache_manager.get_metadata_for_key(
        'gamer_deactivation',
        'Dune Analytics',
        config.dune_queries['gamer_deactivation']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/high-retention-users")
async def get_high_retention_users():
    df = await cache_manager.fetch_dune_raw('high_retention_users')
    metadata = cache_manager.get_metadata_for_key(
        'high_retention_users',
        'Dune Analytics',
        config.dune_queries['high_retention_users']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/high-retention-summary")
async def get_high_retention_summary():
    df = await cache_manager.fetch_dune_raw('high_retention_summary')
    metadata = cache_manager.get_metadata_for_key(
        'high_retention_summary',
        'Dune Analytics',
        config.dune_queries['high_retention_summary']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/gamers-by-games-played")
async def get_gamers_by_games_played():
    df = await cache_manager.fetch_dune_raw('gamers_by_games_played')
    metadata = cache_manager.get_metadata_for_key(
        'gamers_by_games_played',
        'Dune Analytics',
        config.dune_queries['gamers_by_games_played']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/cross-game-gamers")
async def get_cross_game_gamers():
    df = await cache_manager.fetch_dune_raw('cross_game_gamers')
    metadata = cache_manager.get_metadata_for_key(
        'cross_game_gamers',
        'Dune Analytics',
        config.dune_queries['cross_game_gamers']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/gaming-activity-total")
async def get_gaming_activity_total():
    df = await cache_manager.fetch_dune_raw('gaming_activity_total')
    metadata = cache_manager.get_metadata_for_key(
        'gaming_activity_total',
        'Dune Analytics',
        config.dune_queries['gaming_activity_total']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

@app.get("/api/analytics/daily-gaming-activity")
async def get_daily_gaming_activity():
    df = await cache_manager.fetch_dune_raw('daily_gaming_activity')
    metadata = cache_manager.get_metadata_for_key(
        'daily_gaming_activity',
        'Dune Analytics',
        config.dune_queries['daily_gaming_activity']
    )
    return {"metadata": metadata.dict(), "data": df.to_dict('records')}

# ==================== ML PREDICTION ENDPOINTS ====================

@app.get("/api/ml/predictions/churn")
async def predict_churn(method: str = Query(default="ensemble", regex="^(champion|ensemble)$")):
    """
    Get churn predictions for all users
    Parameters:
    - method: 'champion' (best single model) or 'ensemble' (top 3 weighted average)
    """
    try:
        if not ml_manager.champion:
            raise HTTPException(
                status_code=503,
                detail="ML models not trained yet. Trigger /api/cache/refresh first."
            )
        
        pred_key = f'predictions_{method}'
        cached_predictions = cache_manager.get_cached_data(pred_key)
        
        if cached_predictions is None or cached_predictions.empty:
            raise HTTPException(
                status_code=503,
                detail="No predictions available. Trigger /api/cache/refresh to generate predictions."
            )
        
        predictions = cached_predictions.to_dict('records')
        
        summary = {
            'total_users': len(predictions),
            'high_risk': sum(1 for p in predictions if p.get('churn_risk') == 'High'),
            'medium_risk': sum(1 for p in predictions if p.get('churn_risk') == 'Medium'),
            'low_risk': sum(1 for p in predictions if p.get('churn_risk') == 'Low'),
            'avg_churn_probability': np.mean([p.get('churn_probability', 0) for p in predictions])
        }
        
        return {
            "prediction_type": "churn_risk_14_days",
            "method": method,
            "total_users": summary['total_users'],
            "predictions_count": len(predictions),
            "summary": summary,
            "predictions": predictions[:100],
            "model_info": {
                "champion": ml_manager.champion['name'],
                "roc_auc": round(ml_manager.champion['roc_auc'], 4),
                "ensemble_models": [m['name'] for m in ml_manager.top_3_ensemble] if method == 'ensemble' else None
            },
            "note": "Showing first 100 predictions. Use /api/ml/predictions/churn/by-game for game-specific results."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in churn prediction endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/predictions/churn/by-game")
async def predict_churn_by_game(method: str = Query(default="ensemble", regex="^(champion|ensemble)$")):
    """Get churn predictions aggregated by game"""
    try:
        if not ml_manager.champion:
            raise HTTPException(status_code=503, detail="ML models not trained yet")
        
        pred_key = f'predictions_{method}'
        cached_predictions = cache_manager.get_cached_data(pred_key)
        
        if cached_predictions is None or cached_predictions.empty:
            raise HTTPException(status_code=503, detail="No predictions available")
        
        by_game = cached_predictions.groupby('project').agg({
            'user_wallet': 'count',
            'churn_probability': 'mean'
        }).reset_index()
        
        by_game.columns = ['project', 'total_users', 'avg_churn_probability']
        
        risk_counts = cached_predictions.groupby(['project', 'churn_risk']).size().unstack(fill_value=0)
        by_game = by_game.merge(risk_counts, left_on='project', right_index=True, how='left')
        
        data = by_game.to_dict('records')
        
        return {
            "prediction_type": "churn_by_game",
            "method": method,
            "data": data,
            "model_info": {
                "champion": ml_manager.champion['name'],
                "roc_auc": round(ml_manager.champion['roc_auc'], 4)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in churn by game endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/predictions/high-risk-users")
async def get_high_risk_users(limit: int = Query(default=100, ge=1, le=1000)):
    """Get list of high-risk users most likely to churn"""
    try:
        if not ml_manager.champion:
            raise HTTPException(status_code=503, detail="ML models not trained yet")
        
        pred_key = 'predictions_ensemble'
        cached_predictions = cache_manager.get_cached_data(pred_key)
        
        if cached_predictions is None or cached_predictions.empty:
            raise HTTPException(status_code=503, detail="No predictions available")
        
        high_risk = cached_predictions[cached_predictions['churn_risk'] == 'High'].copy()
        high_risk = high_risk.sort_values('churn_probability', ascending=False)
        
        data = high_risk.head(limit).to_dict('records')
        
        return {
            "prediction_type": "high_risk_users",
            "total_high_risk": len(high_risk),
            "showing": len(data),
            "users": data,
            "model_info": {
                "champion": ml_manager.champion['name'],
                "roc_auc": round(ml_manager.champion['roc_auc'], 4)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in high risk users endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/models/leaderboard")
async def get_model_leaderboard():
    """Get current model rankings"""
    try:
        if not ml_manager.all_models:
            return {
                "message": "No models trained yet",
                "leaderboard": []
            }
        
        leaderboard = [
            {
                "rank": i + 1,
                "model_name": m['name'],
                "roc_auc": round(m['roc_auc'], 4),
                "accuracy": round(m['accuracy'], 4),
                "precision": round(m['precision'], 4),
                "recall": round(m['recall'], 4),
                "training_time_seconds": round(m['training_time'], 2),
                "is_champion": (i == 0),
                "in_ensemble": (i < 3)
            }
            for i, m in enumerate(ml_manager.all_models)
        ]
        
        return {
            "timestamp": datetime.now().isoformat(),
            "champion": leaderboard[0]['model_name'] if leaderboard else None,
            "total_models": len(leaderboard),
            "leaderboard": leaderboard
        }
        
    except Exception as e:
        logger.error(f"Error in leaderboard endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/models/info")
async def get_model_info():
    """Get detailed information about current ML models"""
    try:
        if not ml_manager.champion:
            return {
                "status": "not_trained",
                "message": "Models not trained yet. Trigger /api/cache/refresh to train models."
            }
        
        return {
            "status": "trained",
            "champion": {
                "name": ml_manager.champion['name'],
                "roc_auc": round(ml_manager.champion['roc_auc'], 4),
                "accuracy": round(ml_manager.champion.get('accuracy', 0), 4),
                "trained_at": ml_manager.champion.get('timestamp', 'Unknown')
            },
            "ensemble": {
                "models": [m['name'] for m in ml_manager.top_3_ensemble],
                "size": len(ml_manager.top_3_ensemble)
            },
            "features": ml_manager.feature_columns,
            "prediction_window_days": config.prediction_window_days
        }
        
    except Exception as e:
        logger.error(f"Error in model info endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CACHE MANAGEMENT ENDPOINTS ====================

@app.get("/api/cache/status")
async def get_cache_status():
    """Get detailed cache status"""
    try:
        status = {
            "cache_directory": cache_manager.cache_dir,
            "cache_duration_hours": config.cache_duration / 3600,
            "total_sources": len(config.dune_queries),
            "sources": {}
        }
        
        for query_key in config.dune_queries.keys():
            age = cache_manager._get_cache_age(query_key)
            status['sources'][query_key] = {
                "type": "Dune Analytics",
                "query_id": config.dune_queries[query_key],
                "cache_age_hours": round(age, 2) if age != float('inf') else None,
                "is_cached": age != float('inf'),
                "is_fresh": age < (config.cache_duration / 3600) if age != float('inf') else False,
                "last_updated": cache_manager.metadata.get(query_key, {}).get('last_updated', 'Never'),
                "row_count": cache_manager.metadata.get(query_key, {}).get('row_count', 0)
            }
        
        return status
        
    except Exception as e:
        logger.error(f"Error getting cache status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cache/refresh")
async def force_refresh_and_train(request: Request):
    """
    Force refresh all data and retrain ML models
    Called by GitHub Actions after Dune queries are refreshed
    """
    if config.api_secret:
        provided_secret = request.headers.get("X-API-Secret")
        if provided_secret != config.api_secret:
            raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        logger.info("=" * 60)
        logger.info("FORCE REFRESH TRIGGERED")
        logger.info("=" * 60)
        
        start_time = time.time()
        
        # Step 1: Fetch all data
        logger.info("Step 1: Fetching data from Dune...")
        query_results = {}
        
        for query_name in config.dune_queries.keys():
            try:
                df = await cache_manager.fetch_dune_raw(query_name)
                query_results[query_name] = df
                logger.info(f"  ✓ {query_name}: {len(df)} rows")
            except Exception as e:
                logger.error(f"  ✗ {query_name}: {e}")
                query_results[query_name] = pd.DataFrame()
        
        successful_queries = sum(1 for df in query_results.values() if not df.empty)
        
        # Step 2: Prepare ML data
        logger.info("Step 2: Preparing ML training data...")
        daily_activity = query_results.get('daily_gaming_activity')
        
        if daily_activity is None or daily_activity.empty:
            return {
                "status": "partial_success",
                "message": "Data refreshed but ML training skipped",
                "data_refreshed": successful_queries,
                "models_trained": 0
            }
        
        # Clean data
        daily_activity['activity_date'] = pd.to_datetime(
            daily_activity.get('day', daily_activity.get('activity_date'))
        )
        
        if 'user_wallet' not in daily_activity.columns:
            if 'gamer' in daily_activity.columns:
                daily_activity['user_wallet'] = daily_activity['gamer']
            else:
                logger.error("No user identifier column found")
                return {
                    "status": "error",
                    "message": "No user identifier column found in data"
                }
        
        daily_activity['user_wallet'] = daily_activity['user_wallet'].astype(str)
        daily_activity['project'] = daily_activity['project'].astype(str)
        daily_activity['daily_transactions'] = daily_activity.get('number_of_transactions', 1)
        
        # Create training dataset
        training_df = feature_service.create_training_dataset(daily_activity)
        
        if len(training_df) < config.min_training_samples:
            return {
                "status": "partial_success",
                "message": f"Insufficient training samples ({len(training_df)} < {config.min_training_samples})",
                "data_refreshed": successful_queries,
                "models_trained": 0
            }
        
        # Step 3: Train models
        logger.info("Step 3: Training ML models...")
        ml_results = ml_manager.train_and_evaluate_all(training_df)
        
        # Step 4: Generate predictions
        logger.info("Step 4: Generating predictions...")
        prediction_df = feature_service.create_prediction_features(daily_activity)
        
        if not prediction_df.empty:
            # Champion predictions
            champion_pred = ml_manager.predict_champion(prediction_df)
            prediction_df_champion = prediction_df.copy()
            prediction_df_champion['churn_probability'] = champion_pred
            prediction_df_champion['churn_risk'] = prediction_df_champion['churn_probability'].apply(
                lambda x: 'High' if x > 0.65 else ('Medium' if x > 0.35 else 'Low')
            )
            cache_manager.cache_data('predictions_champion', prediction_df_champion)
            
            # Ensemble predictions
            ensemble_pred = ml_manager.predict_ensemble(prediction_df)
            prediction_df_ensemble = prediction_df.copy()
            prediction_df_ensemble['churn_probability'] = ensemble_pred
            prediction_df_ensemble['churn_risk'] = prediction_df_ensemble['churn_probability'].apply(
                lambda x: 'High' if x > 0.65 else ('Medium' if x > 0.35 else 'Low')
            )
            cache_manager.cache_data('predictions_ensemble', prediction_df_ensemble)
        
        elapsed_time = time.time() - start_time
        
        logger.info("=" * 60)
        logger.info(f"REFRESH COMPLETE in {elapsed_time:.1f}s")
        logger.info(f"Champion: {ml_manager.champion['name']}")
        logger.info(f"ROC-AUC: {ml_manager.champion['roc_auc']:.4f}")
        logger.info("=" * 60)
        
        return {
            "status": "success",
            "message": "Data refreshed and ML models trained successfully",
            "timestamp": datetime.now().isoformat(),
            "elapsed_time_seconds": round(elapsed_time, 2),
            "data_refreshed": successful_queries,
            "total_queries": len(config.dune_queries),
            "models_trained": len(ml_results),
            "champion_model": ml_manager.champion['name'],
            "champion_roc_auc": round(ml_manager.champion['roc_auc'], 4),
            "champion_accuracy": round(ml_manager.champion.get('accuracy', 0), 4),
            "top_3_ensemble": [m['name'] for m in ml_manager.top_3_ensemble],
            "training_samples": len(training_df),
            "predictions_generated": len(prediction_df) if not prediction_df.empty else 0
        }
        
    except Exception as e:
        logger.error(f"Error in force refresh: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "dune_api_configured": bool(config.dune_api_key),
        "ml_models_trained": ml_manager.champion is not None,
        "champion_model": ml_manager.champion['name'] if ml_manager.champion else None,
        "models_available": list(ml_manager.model_configs.keys())
    }

# ==================== BULK ENDPOINTS ====================

@app.get("/api/bulk/analytics")
async def get_all_analytics():
    """Get all analytics data at once"""
    try:
        result = {
            "timestamp": datetime.now().isoformat(),
            "data": {}
        }
        
        analytics_endpoints = {
            'gamer_activation': get_gamer_activation,
            'gamer_retention': get_gamer_retention,
            'gamer_reactivation': get_gamer_reactivation,
            'gamer_deactivation': get_gamer_deactivation,
            'high_retention_users': get_high_retention_users,
            'high_retention_summary': get_high_retention_summary,
            'gamers_by_games_played': get_gamers_by_games_played,
            'cross_game_gamers': get_cross_game_gamers,
            'gaming_activity_total': get_gaming_activity_total,
            'daily_gaming_activity': get_daily_gaming_activity
        }
        
        for query_key, endpoint_func in analytics_endpoints.items():
            try:
                response = await endpoint_func()
                result['data'][query_key] = response
            except Exception as e:
                logger.error(f"Error fetching {query_key}: {e}")
                result['data'][query_key] = {"error": str(e)}
        
        return result
        
    except Exception as e:
        logger.error(f"Error in bulk analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bulk/predictions")
async def get_all_predictions():
    """Get all ML predictions at once"""
    try:
        result = {
            "timestamp": datetime.now().isoformat(),
            "predictions": {}
        }
        
        try:
            result['predictions']['churn'] = await predict_churn(method='ensemble')
        except:
            result['predictions']['churn'] = {"error": "Not available"}
        
        try:
            result['predictions']['churn_by_game'] = await predict_churn_by_game(method='ensemble')
        except:
            result['predictions']['churn_by_game'] = {"error": "Not available"}
        
        try:
            result['predictions']['high_risk_users'] = await get_high_risk_users(limit=50)
        except:
            result['predictions']['high_risk_users'] = {"error": "Not available"}
        
        try:
            result['model_info'] = await get_model_info()
        except:
            result['model_info'] = {"error": "Not available"}
        
        return result
        
    except Exception as e:
        logger.error(f"Error in bulk predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RUN ====================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )