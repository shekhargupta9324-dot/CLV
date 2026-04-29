/**
 * mlService.ts — ML Prediction Service
 * Calls the FastAPI backend for XGBoost, Random Forest, and Neural Network predictions.
 * Returns the same PredictionResult shape as geminiAIService so all existing pages work unchanged.
 */

import { PredictionResult } from '@/services/aiService';
import { SampleCustomer } from '@/utils/sampleData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────────────
// Model Definitions (shown in DataUpload UI)
// ─────────────────────────────────────────────────────────────────────────────

export type MLModelId = 'xgboost' | 'random_forest' | 'neural_network';

export interface MLModelMeta {
  id: MLModelId;
  name: string;
  icon: string;
  badge: string;
  badgeColor: string;
  description: string;
  pros: string[];
  speed: string;
}

export const ML_MODELS: MLModelMeta[] = [
  {
    id:          'xgboost',
    name:        'XGBoost',
    icon:        '⚡',
    badge:       'Best Accuracy',
    badgeColor:  '#f59e0b',
    description: 'Gradient boosting — industry gold standard for tabular CLV prediction. Trains sequential trees, each correcting the previous one\'s errors.',
    pros:        ['~93% R² accuracy', 'Handles missing data', 'Feature importance built-in'],
    speed:       'Fast (~1-2s)',
  },
  {
    id:          'random_forest',
    name:        'Random Forest',
    icon:        '🌳',
    badge:       'Most Interpretable',
    badgeColor:  '#10b981',
    description: 'Ensemble of 100 decision trees — each trained on a random subset. Averages predictions for robust CLV estimation with clear explanations.',
    pros:        ['High accuracy', 'Explains what drives CLV', 'Resistant to overfitting'],
    speed:       'Medium (~2-3s)',
  },
  {
    id:          'neural_network',
    name:        'Neural Network (MLP)',
    icon:        '🧠',
    badge:       'Deep Learning',
    badgeColor:  '#8b5cf6',
    description: '3-layer deep network (64→32→16 neurons) that learns non-linear CLV patterns automatically.',
    pros:        ['Complex pattern detection', 'No manual feature engineering', 'Academic credibility'],
    speed:       'Slower (~3-5s)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MLModelMetrics {
  r2Score:      number;
  mse:          number;
  accuracy:     number;
  trainingSize: number;
  testSize:     number;
}

export interface MLPredictionResult extends PredictionResult {
  modelUsed:    string;
  confidence:   number;
  modelMetrics: MLModelMetrics;
}

export interface ModelComparisonData {
  [modelId: string]: {
    predictions:    MLPredictionResult[];
    modelMetrics:   MLModelMetrics;
    avgClv:         number;
    avgChurn:       number;
    processingTime: number;
    modelUsed:      string;
  };
}

export interface CompareResult {
  models:    ModelComparisonData;
  bestModel: string;
  totalTime: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Calls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a single ML model on the customer dataset.
 * Returns normalized PredictionResult[] (same shape as Gemini output).
 */
export async function predictWithML(
  customers: SampleCustomer[],
  model: MLModelId,
  onProgress?: (done: number, total: number) => void,
): Promise<MLPredictionResult[]> {
  const total = customers.length;
  if (onProgress) onProgress(0, total);

  const response = await fetch(`${API_BASE}/ml/predict`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model, customers }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ML prediction failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  if (onProgress) onProgress(total, total);

  // Normalize to app's PredictionResult shape
  return (data.predictions as any[]).map((p: any): MLPredictionResult => ({
    clv:              p.clv,
    churnProbability: p.churnProbability,
    segment:          p.segment,
    factors:          p.factors || [],
    recommendations:  p.recommendations || [],
    modelUsed:        p.modelUsed || model,
    confidence:       p.confidence || 0,
    modelMetrics:     p.modelMetrics || {},
  }));
}

/**
 * Run all 3 models simultaneously and return comparison results.
 * Used by the ModelComparison page.
 */
export async function compareAllModels(
  customers: SampleCustomer[],
  onProgress?: (pct: number) => void,
): Promise<CompareResult> {
  if (onProgress) onProgress(5);

  const response = await fetch(`${API_BASE}/ml/compare`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ customers }),
  });

  if (onProgress) onProgress(95);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Model comparison failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  if (onProgress) onProgress(100);

  return data as CompareResult;
}

/**
 * Get available model metadata from the backend.
 */
export async function fetchAvailableModels(): Promise<MLModelMeta[]> {
  try {
    const response = await fetch(`${API_BASE}/ml/models`);
    if (!response.ok) return ML_MODELS; // fallback to local definitions
    const data = await response.json();
    return data.models || ML_MODELS;
  } catch {
    return ML_MODELS;
  }
}
