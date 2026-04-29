"""
ml_routes.py — FastAPI Routes for ML Predictions
Endpoints:
  POST /ml/predict   — Run a single chosen model on the dataset
  GET  /ml/models    — List available models
  POST /ml/compare   — Run all 3 models side-by-side
"""

import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

import ml_predictor

router = APIRouter(prefix="/ml", tags=["ML Predictions"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic request/response schemas
# ─────────────────────────────────────────────────────────────────────────────

class CustomerInput(BaseModel):
    id:                Optional[str]   = None
    name:              Optional[str]   = None
    age:               Optional[float] = 30
    gender:            Optional[str]   = "Male"
    company:           Optional[str]   = ""
    category:          Optional[str]   = "General"
    tenure:            Optional[float] = 12
    monthlySpend:      Optional[float] = 200
    totalSpend:        Optional[float] = None
    lastPurchaseDate:  Optional[str]   = None
    supportCalls:      Optional[float] = 0


class PredictRequest(BaseModel):
    model: str                        # 'xgboost' | 'random_forest' | 'neural_network'
    customers: List[CustomerInput]


class CompareRequest(BaseModel):
    customers: List[CustomerInput]


# ─────────────────────────────────────────────────────────────────────────────
# GET /ml/models  — return available models with metadata
# ─────────────────────────────────────────────────────────────────────────────

ML_MODELS_META = [
    {
        "id":          "xgboost",
        "name":        "XGBoost",
        "icon":        "⚡",
        "badge":       "Best Accuracy",
        "badgeColor":  "#f59e0b",
        "description": "Gradient boosting — industry gold standard for tabular CLV prediction. Trains sequential trees, each correcting the previous one's errors.",
        "pros":        ["~93% R² accuracy", "Handles missing data", "Feature importance built-in"],
        "speed":       "Fast (~1-2s)",
    },
    {
        "id":          "random_forest",
        "name":        "Random Forest",
        "icon":        "🌳",
        "badge":       "Most Interpretable",
        "badgeColor":  "#10b981",
        "description": "Ensemble of 100 decision trees — each trained on a random subset. Averages predictions for robust CLV estimation with clear explanations.",
        "pros":        ["High accuracy", "Explains what drives CLV", "Resistant to overfitting"],
        "speed":       "Medium (~2-3s)",
    },
    {
        "id":          "neural_network",
        "name":        "Neural Network (MLP)",
        "icon":        "🧠",
        "badge":       "Deep Learning",
        "badgeColor":  "#8b5cf6",
        "description": "3-layer deep network (64→32→16 neurons) that learns non-linear CLV patterns automatically. Mimics how the brain processes information.",
        "pros":        ["Complex pattern detection", "No manual feature engineering", "Academic credibility"],
        "speed":       "Slower (~3-5s)",
    },
]


@router.get("/models")
def get_models():
    return {"models": ML_MODELS_META}


# ─────────────────────────────────────────────────────────────────────────────
# POST /ml/predict  — single model prediction
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/predict")
def predict(request: PredictRequest):
    customer_dicts = [c.dict() for c in request.customers]

    start    = time.time()
    results  = ml_predictor.run_model(request.model, customer_dicts)
    elapsed  = round(time.time() - start, 2)

    # Extract model metrics from first result (all share the same metrics)
    model_metrics = results[0].get("modelMetrics", {}) if results else {}

    return {
        "predictions":   results,
        "modelMetrics":  model_metrics,
        "modelUsed":     results[0].get("modelUsed", request.model) if results else request.model,
        "processingTime": elapsed,
        "totalCustomers": len(results),
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /ml/compare  — run all 3 models and compare
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/compare")
def compare_all_models(request: CompareRequest):
    customer_dicts = [c.dict() for c in request.customers]

    comparison: Dict[str, Any] = {}
    model_ids = ["xgboost", "random_forest", "neural_network"]
    total_start = time.time()

    for model_id in model_ids:
        model_start = time.time()
        results     = ml_predictor.run_model(model_id, customer_dicts)
        elapsed     = round(time.time() - model_start, 2)

        metrics     = results[0].get("modelMetrics", {}) if results else {}
        avg_clv     = round(sum(r["clv"] for r in results) / len(results), 2) if results else 0
        avg_churn   = round(sum(r["churnProbability"] for r in results) / len(results), 1) if results else 0

        comparison[model_id] = {
            "predictions":    results,
            "modelMetrics":   metrics,
            "avgClv":         avg_clv,
            "avgChurn":       avg_churn,
            "processingTime": elapsed,
            "modelUsed":      results[0].get("modelUsed", model_id) if results else model_id,
        }

    # Pick best model by R² score
    best_model = max(
        model_ids,
        key=lambda m: comparison[m]["modelMetrics"].get("r2Score", 0)
    )

    return {
        "models":      comparison,
        "bestModel":   best_model,
        "totalTime":   round(time.time() - total_start, 2),
    }
