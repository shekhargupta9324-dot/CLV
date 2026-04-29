import { createContext, useContext, useState, ReactNode } from 'react';
import { SampleCustomer } from '@/utils/sampleData';
import { PredictionResult } from '@/services/aiService';
import { MLModelId, MLModelMetrics } from '@/services/mlService';

export interface PredictionRow extends SampleCustomer {
  prediction: PredictionResult;
}

interface PredictionContextType {
  predictionData: PredictionRow[];
  setPredictionData: (data: PredictionRow[]) => void;
  dataSource: string;
  setDataSource: (source: string) => void;
  lastUpdated: Date | null;
  setLastUpdated: (date: Date | null) => void;
  hasPredictions: boolean;
  clearPredictions: () => void;
  aggregateStats: {
    totalCustomers: number;
    avgClv: number;
    avgChurn: number;
    totalRevenue: number;
    highValueCount: number;
    mediumValueCount: number;
    lowValueCount: number;
    atRiskCount: number;
  };
  // ── ML engine state ──────────────────────────────────────────────
  predictionEngine: 'gemini' | 'ml';
  setPredictionEngine: (engine: 'gemini' | 'ml') => void;
  selectedMLModel: MLModelId;
  setSelectedMLModel: (model: MLModelId) => void;
  mlModelMetrics: MLModelMetrics | null;
  setMLModelMetrics: (m: MLModelMetrics | null) => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export function PredictionProvider({ children }: { children: ReactNode }) {
  const [predictionData, setPredictionDataState] = useState<PredictionRow[]>([]);
  const [dataSource, setDataSource] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ML engine state
  const [predictionEngine, setPredictionEngine] = useState<'gemini' | 'ml'>('gemini');
  const [selectedMLModel, setSelectedMLModel] = useState<MLModelId>('xgboost');
  const [mlModelMetrics, setMLModelMetrics] = useState<MLModelMetrics | null>(null);

  const setPredictionData = (data: PredictionRow[]) => {
    setPredictionDataState(data);
    setLastUpdated(new Date());
  };

  const clearPredictions = () => {
    setPredictionDataState([]);
    setDataSource('');
    setLastUpdated(null);
    setMLModelMetrics(null);
  };

  const hasPredictions = predictionData.length > 0;

  const aggregateStats = {
    totalCustomers: predictionData.length,
    avgClv: predictionData.length > 0 
      ? predictionData.reduce((sum, r) => sum + r.prediction.clv, 0) / predictionData.length 
      : 0,
    avgChurn: predictionData.length > 0 
      ? predictionData.reduce((sum, r) => sum + r.prediction.churnProbability, 0) / predictionData.length 
      : 0,
    totalRevenue: predictionData.reduce((sum, r) => sum + r.prediction.clv, 0),
    highValueCount: predictionData.filter(r => r.prediction.segment === 'High Value').length,
    mediumValueCount: predictionData.filter(r => r.prediction.segment === 'Medium Value').length,
    lowValueCount: predictionData.filter(r => r.prediction.segment === 'Low Value').length,
    atRiskCount: predictionData.filter(r => r.prediction.segment === 'At Risk').length,
  };

  return (
    <PredictionContext.Provider value={{
      predictionData,
      setPredictionData,
      dataSource,
      setDataSource,
      lastUpdated,
      setLastUpdated,
      hasPredictions,
      clearPredictions,
      aggregateStats,
      predictionEngine,
      setPredictionEngine,
      selectedMLModel,
      setSelectedMLModel,
      mlModelMetrics,
      setMLModelMetrics,
    }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
}
