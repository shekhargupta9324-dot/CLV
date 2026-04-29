import { useNavigate } from 'react-router-dom';
import { usePrediction } from '@/context/PredictionContext';
import { generateBenchmarkReport, mapToIndustry, getIndustryBenchmark } from '@/services/benchmarkService';
import { 
  Database, 
  TrendingUp, 
  Lightbulb, 
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Award,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';

export function Insights() {
  const navigate = useNavigate();
  const { predictionData, dataSource, hasPredictions } = usePrediction();

  if (!hasPredictions) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">AI Insights & Benchmarking</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">AI-generated recommendations and industry comparisons.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
          <div className="rounded-full bg-slate-100 p-4 sm:p-6 dark:bg-slate-800">
            <Database className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">No Data Available</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Run a prediction to generate AI insights and compare your metrics against industry benchmarks.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-6 flex items-center rounded-md bg-indigo-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Upload Data & Run Prediction
          </button>
        </div>
      </div>
    );
  }

  // Generate benchmark report
  const company = dataSource.split(' ')[0]; // Extract company name
  const benchmarkReport = generateBenchmarkReport(predictionData, company);
  const industry = mapToIndustry(company);
  const industryBenchmark = getIndustryBenchmark(industry);

  // Collect all AI insights from predictions
  const allInsights = predictionData
    .flatMap(p => p.prediction.recommendations || [])
    .reduce((acc, rec) => {
      acc[rec] = (acc[rec] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topRecommendations = Object.entries(allInsights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([rec, count]) => ({ recommendation: rec, frequency: count }));

  // Radar chart data for benchmark comparison
  const radarData = benchmarkReport.comparisons.map(c => ({
    metric: c.metric.split(' ').slice(0, 2).join(' '),
    yours: c.percentile,
    industry: 50,
    topPerformer: 90
  }));

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'average': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'below_average': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'weakness': return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'opportunity': return <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'threat': return <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default: return <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-50 dark:bg-green-900/20';
      case 'weakness': return 'bg-red-50 dark:bg-red-900/20';
      case 'opportunity': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'threat': return 'bg-orange-50 dark:bg-orange-900/20';
      default: return 'bg-indigo-50 dark:bg-indigo-900/20';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">AI Insights & Benchmarking</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Comparing <span className="font-medium text-indigo-600 dark:text-indigo-400">{dataSource}</span> against {industry} industry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(benchmarkReport.overallRating)}`}>
            <Award className="h-4 w-4 mr-1" />
            {benchmarkReport.overallRating.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {benchmarkReport.overallScore}th percentile
          </span>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 sm:p-8 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-xl sm:text-2xl font-bold">Industry Performance Overview</h3>
            <p className="mt-2 text-indigo-100">
              Your {industry} performance places you in the <span className="font-bold">{benchmarkReport.overallScore}th percentile</span> compared to industry peers.
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">{formatCurrency(Math.round(predictionData.reduce((s, r) => s + r.prediction.clv, 0) / predictionData.length))}</p>
                <p className="text-xs text-indigo-200">Your Avg CLV</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">{formatCurrency(industryBenchmark?.avgClv || 0)}</p>
                <p className="text-xs text-indigo-200">Industry Avg</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">{(100 - (predictionData.reduce((s, r) => s + r.prediction.churnProbability, 0) / predictionData.length)).toFixed(1)}%</p>
                <p className="text-xs text-indigo-200">Your Retention</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">{industryBenchmark?.avgRetentionRate}%</p>
                <p className="text-xs text-indigo-200">Industry Avg</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-32 w-32 sm:h-40 sm:w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="12"
                  strokeDasharray={`${benchmarkReport.overallScore * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold">{benchmarkReport.overallScore}</span>
                <span className="text-xs text-indigo-200">Percentile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Comparisons */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Metrics Table */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden dark:bg-slate-800 dark:ring-slate-700">
          <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Metric Comparison
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase dark:text-slate-400">Metric</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase dark:text-slate-400">Yours</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase dark:text-slate-400 hidden sm:table-cell">Industry</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {benchmarkReport.comparisons.map((comp) => (
                  <tr key={comp.metric} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{comp.metric}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {comp.metric.includes('CLV') || comp.metric.includes('Spend') 
                          ? formatCurrency(comp.yourValue) 
                          : comp.yourValue.toLocaleString() + (comp.metric.includes('Rate') || comp.metric.includes('Retention') ? '%' : '')}
                      </span>
                      <span className={`ml-2 inline-flex items-center text-xs ${
                        comp.percentile >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {comp.percentile >= 50 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {comp.percentile}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {comp.metric.includes('CLV') || comp.metric.includes('Spend') 
                          ? formatCurrency(comp.industryAvg) 
                          : `${comp.industryAvg.toLocaleString()}${comp.metric.includes('Rate') || comp.metric.includes('Retention') ? '%' : ''}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(comp.status)}`}>
                        {comp.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Target className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Performance Radar
          </h3>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                <Radar name="Your Score" dataKey="yours" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Radar name="Industry Avg" dataKey="industry" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                <Radar name="Top Performer" dataKey="topPerformer" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Legend 
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <h3 className="mb-4 sm:mb-6 text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Strategic Insights (SWOT Analysis)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benchmarkReport.insights.map((insight, index) => (
            <div 
              key={index}
              className={`rounded-lg p-4 ${getInsightBg(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{insight.title}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      insight.impact === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                      insight.impact === 'medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                      'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top AI Recommendations */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            AI-Generated Recommendations
          </h3>
          <div className="space-y-3">
            {topRecommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs dark:bg-indigo-900 dark:text-indigo-300 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white">{rec.recommendation}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Applies to {rec.frequency} customers</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Action Items
          </h3>
          <div className="space-y-3">
            {benchmarkReport.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Improvement Potential Chart */}
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <h3 className="mb-4 text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
          Improvement Potential by Metric
        </h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchmarkReport.comparisons} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
              <YAxis dataKey="metric" type="category" width={100} stroke="#94a3b8" fontSize={10} />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.2 }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                formatter={(value) => [`${value}th percentile`, 'Your Score']}
              />
              <Bar dataKey="percentile" radius={[0, 4, 4, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
