import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrediction } from '@/context/PredictionContext';
import { compareAllModels, ML_MODELS } from '@/services/mlService';
import { Cpu, Play, CheckCircle, Database, Trophy, Clock, TrendingUp, BarChart3, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatters';

interface ComparisonState {
  models: {
    [key: string]: {
      avgClv: number;
      avgChurn: number;
      processingTime: number;
      modelUsed: string;
      modelMetrics: {
        r2Score: number;
        mse: number;
        accuracy: number;
        trainingSize: number;
        testSize: number;
      };
    };
  };
  bestModel: string;
  totalTime: number;
}

export function ModelComparison() {
  const navigate = useNavigate();
  const { predictionData, hasPredictions, dataSource, setSelectedMLModel, setPredictionEngine } = usePrediction();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState<ComparisonState | null>(null);

  const customers = predictionData.map(r => ({
    id: r.id,
    name: r.name,
    age: r.age,
    gender: r.gender,
    company: r.company,
    category: r.category,
    tenure: r.tenure,
    monthlySpend: r.monthlySpend,
    totalSpend: r.totalSpend,
    lastPurchaseDate: r.lastPurchaseDate,
    supportCalls: r.supportCalls,
  }));

  const handleRunComparison = async () => {
    if (!hasPredictions) {
      toast.error('Upload a dataset first from the Data Upload page.');
      return;
    }

    setRunning(true);
    setProgress(0);
    setResult(null);

    try {
      setProgressLabel('Initialising comparison engine...');
      setProgress(5);

      const data = await compareAllModels(customers, (pct) => {
        setProgress(pct);
        if (pct < 30) setProgressLabel('Training XGBoost...');
        else if (pct < 60) setProgressLabel('Training Random Forest...');
        else if (pct < 90) setProgressLabel('Training Neural Network...');
        else setProgressLabel('Finalising results...');
      });

      setResult(data as ComparisonState);
      setProgress(100);
      toast.success(`Comparison complete in ${data.totalTime}s!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Comparison failed. Is the backend running?');
    } finally {
      setRunning(false);
    }
  };

  const handleUseModel = (modelId: string) => {
    setSelectedMLModel(modelId as any);
    setPredictionEngine('ml');
    toast.success(`${ML_MODELS.find(m => m.id === modelId)?.name} selected! Go to Data Upload to run a prediction.`);
    navigate('/upload');
  };

  const modelOrder = ['xgboost', 'random_forest', 'neural_network'];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-violet-500" />
          Model Comparison
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Run all 3 ML algorithms on your dataset and compare their accuracy, speed, and predictions side-by-side.
        </p>
      </div>

      {/* No data state */}
      {!hasPredictions && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Database className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">No Dataset Loaded</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            Upload customer data on the Data Upload page first, then come back here to compare all 3 models.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Database className="h-4 w-4" />
            Go to Data Upload
          </button>
        </div>
      )}

      {/* Run button + progress */}
      {hasPredictions && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Dataset: <span className="text-indigo-600 dark:text-indigo-400">{dataSource}</span>
                {' '}({customers.length} customers)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All 3 models will be trained on your data simultaneously. Estimated time: 8–15 seconds.
              </p>
            </div>
            <button
              id="run-comparison-btn"
              onClick={handleRunComparison}
              disabled={running}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {running ? (
                <>
                  <Cpu className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run All 3 Models & Compare
                </>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {(running || progress > 0) && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{progressLabel || 'Starting...'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Model indicators */}
              <div className="flex justify-between mt-2 px-1">
                {modelOrder.map((id, i) => {
                  const meta   = ML_MODELS.find(m => m.id === id)!;
                  const done   = progress >= (i + 1) * 30;
                  const active = progress >= i * 30 && !done;
                  return (
                    <div key={id} className="flex items-center gap-1 text-xs">
                      <span>{meta.icon}</span>
                      <span className={done ? 'text-green-600 dark:text-green-400' : active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}>
                        {meta.name}
                      </span>
                      {done && <CheckCircle className="h-3 w-3 text-green-500" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {modelOrder.map(id => {
              const meta = ML_MODELS.find(m => m.id === id)!;
              const data = result.models[id];
              const isBest = result.bestModel === id;
              if (!data) return null;
              return (
                <div
                  key={id}
                  className={`relative rounded-xl p-5 shadow-sm ring-1 transition-all ${
                    isBest
                      ? 'bg-gradient-to-br from-violet-50 to-purple-50 ring-violet-300 dark:from-violet-900/20 dark:to-purple-900/20 dark:ring-violet-700'
                      : 'bg-white ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                        <Trophy className="h-3 w-3" /> Best Model
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{meta.name}</p>
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: meta.badgeColor + '22', color: meta.badgeColor }}
                      >
                        {meta.badge}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Avg CLV</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(data.avgClv)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">R² Score</span>
                      <span className={`font-semibold ${isBest ? 'text-violet-600 dark:text-violet-400' : 'text-slate-900 dark:text-white'}`}>
                        {data.modelMetrics.r2Score.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Churn Accuracy</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{data.modelMetrics.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Avg Churn</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{data.avgChurn.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Speed</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{data.processingTime}s</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUseModel(id)}
                    className={`mt-4 w-full rounded-lg py-2 text-xs font-semibold transition-all ${
                      isBest
                        ? 'bg-violet-600 text-white hover:bg-violet-500'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Use {meta.name} →
                  </button>
                </div>
              );
            })}
          </div>

          {/* Full comparison table */}
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden dark:bg-slate-800 dark:ring-slate-700">
            <div className="border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Side-by-Side Comparison
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total runtime: {result.totalTime}s
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Metric</th>
                    {modelOrder.map(id => {
                      const meta   = ML_MODELS.find(m => m.id === id)!;
                      const isBest = result.bestModel === id;
                      return (
                        <th key={id} className={`px-5 py-3 text-center text-xs font-medium uppercase tracking-wider ${isBest ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {meta.icon} {meta.name} {isBest && '🏆'}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
                  {[
                    { label: 'Avg CLV', key: 'avgClv',  format: (v: number) => formatCurrency(v) },
                    { label: 'R² Score',           key: 'r2Score',   format: (v: number) => v.toFixed(3),       metric: true },
                    { label: 'MSE',                key: 'mse',       format: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }), metric: true },
                    { label: 'Churn Accuracy',     key: 'accuracy',  format: (v: number) => `${v.toFixed(1)}%`, metric: true },
                    { label: 'Avg Churn Risk',     key: 'avgChurn',  format: (v: number) => `${v.toFixed(1)}%` },
                    { label: 'Processing Time',    key: 'time',      format: (v: number) => `${v}s` },
                  ].map(row => (
                    <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</td>
                      {modelOrder.map(id => {
                        const d    = result.models[id];
                        const val  = row.key === 'r2Score'  ? d?.modelMetrics?.r2Score
                                   : row.key === 'mse'      ? d?.modelMetrics?.mse
                                   : row.key === 'accuracy' ? d?.modelMetrics?.accuracy
                                   : row.key === 'time'     ? d?.processingTime
                                   : row.key === 'avgChurn' ? d?.avgChurn
                                   : d?.avgClv;
                        const isBest = result.bestModel === id;
                        return (
                          <td key={id} className={`px-5 py-3 text-sm text-center ${isBest ? 'font-bold text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {val !== undefined && val !== null ? row.format(val) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Best model banner */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm font-medium text-violet-900 dark:text-violet-200 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Best Model for Your Data:{' '}
                  <span className="font-bold">
                    {ML_MODELS.find(m => m.id === result.bestModel)?.icon}{' '}
                    {ML_MODELS.find(m => m.id === result.bestModel)?.name}
                  </span>
                  {' '}(R² = {result.models[result.bestModel]?.modelMetrics?.r2Score?.toFixed(3)})
                </p>
                <button
                  onClick={() => handleUseModel(result.bestModel)}
                  className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                  Use This Model for Analysis
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
