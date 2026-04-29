import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SampleCustomer } from '@/utils/sampleData';
import { usePrediction, PredictionRow } from '@/context/PredictionContext';
import { predictBatchWithGemini, checkRateLimit } from '@/services/geminiAIService';
import { predictWithML, ML_MODELS } from '@/services/mlService';
import { cleanCustomerData, CleaningResult } from '@/services/dataCleaningService';
import { Loader2, TrendingUp, AlertTriangle, Users, BarChart2, Download, Database, Shield, Sparkles, CheckCircle, XCircle, Cpu, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatters';

export function Prediction() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [cleaningResult, setCleaningResult] = useState<CleaningResult | null>(null);
  const [showDataQuality, setShowDataQuality] = useState(false);
  
  const { 
    predictionData, 
    setPredictionData, 
    dataSource, 
    setDataSource,
    hasPredictions,
    aggregateStats,
    predictionEngine,
    setPredictionEngine,
    selectedMLModel,
    setSelectedMLModel,
    mlModelMetrics,
    setMLModelMetrics,
  } = usePrediction();

  const dataset = location.state?.dataset as SampleCustomer[];
  const source  = location.state?.source  as string;
  const engine  = location.state?.engine  as 'gemini' | 'ml' | undefined;
  const mlModel = location.state?.mlModel as string | undefined;

  useEffect(() => {
    if (dataset && dataset.length > 0) {
      // Sync engine/model from navigation state into context
      if (engine) setPredictionEngine(engine);
      if (mlModel) setSelectedMLModel(mlModel as any);
      setLoading(true);
      processBatch(dataset, source, engine || 'gemini', mlModel || 'xgboost');
    }
  }, [dataset, source]);

  const processBatch = async (data: SampleCustomer[], sourceName: string, eng: 'gemini' | 'ml' = 'gemini', model: string = 'xgboost') => {
    // Step 1: Data Cleaning
    toast.loading('Cleaning and validating data...', { id: 'cleaning' });
    const cleaned = cleanCustomerData(data);
    setCleaningResult(cleaned);
    toast.dismiss('cleaning');
    
    if (cleaned.report.overallScore < 50) {
      toast.error(`Data quality score: ${cleaned.report.overallScore}%. Please review data quality.`);
    } else {
      toast.success(`Data quality score: ${cleaned.report.overallScore}%`);
    }

    try {
      let results: PredictionRow[];

      if (eng === 'ml') {
        // ── ML path ───────────────────────────────────────────────────
        const modelMeta = ML_MODELS.find(m => m.id === model);
        toast.loading(`Training ${modelMeta?.name || 'ML'} model...`, { id: 'predictions' });

        const predictions = await predictWithML(
          cleaned.cleanedData,
          model as any,
          (done, total) => setProgress({ completed: done, total }),
        );

        // Store ML metrics in context
        if (predictions.length > 0 && predictions[0].modelMetrics) {
          setMLModelMetrics(predictions[0].modelMetrics);
        }

        results = cleaned.cleanedData.map((customer, index) => ({
          ...customer,
          prediction: {
            clv:              predictions[index].clv,
            churnProbability: predictions[index].churnProbability,
            segment:          predictions[index].segment,
            factors:          predictions[index].factors,
            recommendations:  predictions[index].recommendations,
          },
        }));

      } else {
        // ── Gemini path (existing) ─────────────────────────────────────
        const rateCheck = checkRateLimit();
        if (!rateCheck.allowed) {
          toast.error(`Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 1000)}s`);
          setLoading(false);
          return;
        }

        toast.loading('Running AI predictions with Gemini...', { id: 'predictions' });

        const predictions = await predictBatchWithGemini(
          cleaned.cleanedData.map(c => ({ ...c, company: c.company })),
          undefined,
          (completed, total) => setProgress({ completed, total }),
        );

        setMLModelMetrics(null); // clear ML metrics when using Gemini

        results = cleaned.cleanedData.map((customer, index) => ({
          ...customer,
          prediction: {
            clv:              predictions[index].clv,
            churnProbability: predictions[index].churnProbability,
            segment:          predictions[index].segment,
            factors:          predictions[index].factors,
            recommendations:  predictions[index].recommendations,
          },
        }));
      }

      setPredictionData(results);
      setDataSource(sourceName);
      toast.dismiss('predictions');
      toast.success(`Predictions complete for ${results.length} customers!`);
    } catch (error) {
      toast.dismiss('predictions');
      toast.error(error instanceof Error ? error.message : 'Prediction failed');
    }

    setLoading(false);
  };

  const handleExport = () => {
    if (predictionData.length === 0) return;

    const headers = ['ID', 'Name', 'Company', 'Category', 'Age', 'Gender', 'Tenure', 'Monthly Spend', 'Total Spend', 'Last Purchase Date', 'Support Calls', 'Predicted CLV', 'Churn Probability', 'Segment'].join(',');
    const rows = predictionData.map(r => [
        r.id,
        `"${r.name}"`,
        r.company,
        r.category,
        r.age,
        r.gender,
        r.tenure,
        r.monthlySpend,
        r.totalSpend,
        r.lastPurchaseDate,
        r.supportCalls,
        r.prediction.clv,
        r.prediction.churnProbability + '%',
        r.prediction.segment
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CLV_Predictions_${dataSource || 'Dataset'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Results exported to CSV');
  };

  if (loading) {
    const modelMeta = ML_MODELS.find(m => m.id === selectedMLModel);
    return (
      <div className="flex h-[60vh] sm:h-[80vh] flex-col items-center justify-center px-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-indigo-600 dark:text-indigo-400" />
          {predictionEngine === 'ml'
            ? <Cpu className="absolute -right-2 -top-2 h-6 w-6 text-violet-500 animate-pulse" />
            : <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-yellow-500 animate-pulse" />
          }
        </div>
        <p className="mt-4 text-base sm:text-lg font-medium text-slate-900 dark:text-white">
          {predictionEngine === 'ml' ? `Training ${modelMeta?.name || 'ML'} Model...` : 'Running AI Predictions...'}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center">
          {predictionEngine === 'ml' ? 'Fitting model on your dataset & generating predictions' : 'Processing with Google Gemini AI'}
        </p>
        {progress.total > 0 && (
          <div className="mt-4 w-64">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Progress</span>
              <span>{progress.completed} / {progress.total}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        {predictionEngine !== 'ml' && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Shield className="h-4 w-4" />
            <span>Rate limited: {checkRateLimit().remainingRequests} requests remaining</span>
          </div>
        )}
      </div>
    );
  }

  if (!hasPredictions) {
    return (
      <div className="flex h-[60vh] sm:h-[70vh] flex-col items-center justify-center text-center px-4">
        <Database className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-900 dark:text-white">No Prediction Data</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Upload a dataset or select a sample dataset to run predictions. All pages will display results based on the selected data.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="mt-6 flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Go to Data Upload
        </button>
      </div>
    );
  }

  const chartData = [
    { name: 'High Value', value: aggregateStats.highValueCount, color: '#10b981' },
    { name: 'Medium Value', value: aggregateStats.mediumValueCount, color: '#6366f1' },
    { name: 'Low Value', value: aggregateStats.lowValueCount, color: '#f59e0b' },
    { name: 'At Risk', value: aggregateStats.atRiskCount, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Batch Prediction Results
            {predictionEngine === 'ml' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <Cpu className="h-3.5 w-3.5" />
                {ML_MODELS.find(m => m.id === selectedMLModel)?.icon} {ML_MODELS.find(m => m.id === selectedMLModel)?.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Gemini AI
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Analysis for {dataSource || 'Uploaded Dataset'} ({predictionData.length} records)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {cleaningResult && (
            <button
              onClick={() => setShowDataQuality(!showDataQuality)}
              className="flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              <Shield className="mr-2 h-4 w-4" />
              Data Quality: {cleaningResult.report.overallScore}%
            </button>
          )}
          <button
              onClick={handleExport}
              className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
              <Download className="mr-2 h-4 w-4" />
              Export Results
          </button>
          <button
              onClick={() => navigate('/upload')}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:hover:bg-slate-600"
          >
              New Analysis
          </button>
        </div>
      </div>

      {/* ML Metrics Card — only shown when ML engine was used */}
      {predictionEngine === 'ml' && mlModelMetrics && (
        <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-4 sm:p-5 ring-1 ring-violet-200 dark:from-violet-900/10 dark:to-purple-900/10 dark:ring-violet-800">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              {ML_MODELS.find(m => m.id === selectedMLModel)?.name} — Model Performance Metrics
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-white/70 dark:bg-slate-800/60 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">R² Score</p>
              <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{mlModelMetrics.r2Score.toFixed(3)}</p>
              <p className="text-xs text-slate-400">(1.0 = perfect)</p>
            </div>
            <div className="rounded-lg bg-white/70 dark:bg-slate-800/60 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">MSE</p>
              <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{mlModelMetrics.mse.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              <p className="text-xs text-slate-400">Mean Sq. Error</p>
            </div>
            <div className="rounded-lg bg-white/70 dark:bg-slate-800/60 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Churn Accuracy</p>
              <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{mlModelMetrics.accuracy.toFixed(1)}%</p>
              <p className="text-xs text-slate-400">Classifier</p>
            </div>
            <div className="rounded-lg bg-white/70 dark:bg-slate-800/60 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Train / Test</p>
              <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{mlModelMetrics.trainingSize} / {mlModelMetrics.testSize}</p>
              <p className="text-xs text-slate-400">Records split</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Report */}
      {showDataQuality && cleaningResult && (
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-indigo-600" />
            Data Quality Report
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Records</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{cleaningResult.report.totalRecords}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-xs text-green-600 dark:text-green-400">Valid Records</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{cleaningResult.report.validRecords}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Completeness</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{cleaningResult.report.completenessScore}%</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Accuracy</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{cleaningResult.report.accuracyScore}%</p>
            </div>
          </div>
          
          {(cleaningResult.warnings.length > 0 || cleaningResult.errors.length > 0) && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cleaningResult.errors.slice(0, 5).map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Row {err.rowIndex + 1}: {err.message}</span>
                </div>
              ))}
              {cleaningResult.warnings.slice(0, 5).map((warn, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Row {warn.rowIndex + 1}: {warn.message} {warn.autoFixed && '(auto-fixed)'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
           <div className="flex items-center">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/50">
                 <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                 <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Predicted CLV</p>
                 <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(aggregateStats.avgClv)}</p>
              </div>
           </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
           <div className="flex items-center">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/50">
                 <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                 <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Churn Risk</p>
                 <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{aggregateStats.avgChurn.toFixed(1)}%</p>
              </div>
           </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
           <div className="flex items-center">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/50">
                 <Users className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                 <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">At Risk Customers</p>
                 <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{aggregateStats.atRiskCount}</p>
              </div>
           </div>
        </div>
        
        <div className="overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
           <div className="flex items-center">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/50">
                 <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                 <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Total Projected Value</p>
                 <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(aggregateStats.totalRevenue)}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-3">
         {/* Chart */}
         <div className="xl:col-span-1 rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
             <h3 className="mb-4 text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Segment Distribution</h3>
             <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={10} />
                    <Tooltip 
                      cursor={{ fill: '#334155', opacity: 0.2 }}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
         </div>

         {/* Detailed Table */}
         <div className="xl:col-span-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden dark:bg-slate-800 dark:ring-slate-700">
           <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 dark:border-slate-700">
             <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Customer Predictions</h3>
           </div>
           <div className="overflow-x-auto max-h-[400px] sm:max-h-[500px]">
             <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
               <thead className="bg-slate-50 sticky top-0 z-10 dark:bg-slate-900">
                 <tr>
                   <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Name</th>
                   <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden sm:table-cell">Category</th>
                   <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">CLV</th>
                   <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden md:table-cell">Churn</th>
                   <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Segment</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
                 {predictionData.map((row) => (
                   <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                     <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{row.name}</td>
                     <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{row.category}</td>
                     <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-white">{formatCurrency(row.prediction.clv)}</td>
                     <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">
                       <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                         row.prediction.churnProbability > 50 
                           ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                           : row.prediction.churnProbability > 30
                           ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                           : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                       }`}>
                         {row.prediction.churnProbability}%
                       </span>
                     </td>
                     <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                       <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                         row.prediction.segment === 'High Value' 
                           ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                           : row.prediction.segment === 'At Risk'
                           ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                           : row.prediction.segment === 'Low Value'
                           ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                           : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                       }`}>
                         {row.prediction.segment}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
      </div>
    </div>
  );
}
