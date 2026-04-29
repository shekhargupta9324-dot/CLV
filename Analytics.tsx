import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line
} from 'recharts';
import { usePrediction } from '@/context/PredictionContext';
import { Database, TrendingUp, Target, Zap, Award, Users } from 'lucide-react';

export function Analytics() {
  const navigate = useNavigate();
  const { predictionData, dataSource, hasPredictions, aggregateStats } = usePrediction();

  if (!hasPredictions) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Advanced Analytics</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Deep dive into customer behavior and trends.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
          <div className="rounded-full bg-slate-100 p-4 sm:p-6 dark:bg-slate-800">
            <Database className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">No Analytics Data</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Run a prediction on a dataset to unlock advanced analytics. All insights are derived from your prediction results.
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

  // Category breakdown
  const categoryData = predictionData.reduce((acc, row) => {
    const cat = row.category;
    if (!acc[cat]) {
      acc[cat] = { clv: 0, count: 0, spend: 0, churn: 0 };
    }
    acc[cat].clv += row.prediction.clv;
    acc[cat].spend += row.monthlySpend;
    acc[cat].churn += row.prediction.churnProbability;
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { clv: number; count: number; spend: number; churn: number }>);

  const revenueData = Object.entries(categoryData).map(([name, data]) => ({
    category: name.length > 8 ? name.substring(0, 8) + '...' : name,
    fullName: name,
    clv: Math.round(data.clv),
    avgClv: Math.round(data.clv / data.count),
    avgSpend: Math.round(data.spend / data.count),
    count: data.count,
    avgChurn: Math.round(data.churn / data.count)
  }));

  // Segment data
  const segmentData = [
    { name: 'High Value', count: aggregateStats.highValueCount, clv: predictionData.filter(r => r.prediction.segment === 'High Value').reduce((s, r) => s + r.prediction.clv, 0) },
    { name: 'Medium Value', count: aggregateStats.mediumValueCount, clv: predictionData.filter(r => r.prediction.segment === 'Medium Value').reduce((s, r) => s + r.prediction.clv, 0) },
    { name: 'Low Value', count: aggregateStats.lowValueCount, clv: predictionData.filter(r => r.prediction.segment === 'Low Value').reduce((s, r) => s + r.prediction.clv, 0) },
    { name: 'At Risk', count: aggregateStats.atRiskCount, clv: predictionData.filter(r => r.prediction.segment === 'At Risk').reduce((s, r) => s + r.prediction.clv, 0) },
  ];

  // Age distribution
  const ageGroups = [
    { name: '18-25', min: 18, max: 25 },
    { name: '26-35', min: 26, max: 35 },
    { name: '36-45', min: 36, max: 45 },
    { name: '46-55', min: 46, max: 55 },
    { name: '56+', min: 56, max: 100 },
  ];

  const ageData = ageGroups.map(group => {
    const customers = predictionData.filter(r => r.age >= group.min && r.age <= group.max);
    return {
      name: group.name,
      count: customers.length,
      avgClv: customers.length > 0 ? Math.round(customers.reduce((s, r) => s + r.prediction.clv, 0) / customers.length) : 0,
      avgChurn: customers.length > 0 ? Math.round(customers.reduce((s, r) => s + r.prediction.churnProbability, 0) / customers.length) : 0
    };
  });

  // Radar data for category performance
  const radarData = Object.entries(categoryData).slice(0, 5).map(([name, data]) => ({
    category: name.length > 6 ? name.substring(0, 6) + '...' : name,
    clv: Math.min(100, Math.round((data.clv / data.count) / 100)),
    engagement: Math.min(100, Math.round((data.spend / data.count) / 10)),
    retention: Math.max(0, 100 - Math.round(data.churn / data.count)),
    volume: Math.min(100, data.count * 10)
  }));

  // Gender breakdown
  const genderData = predictionData.reduce((acc, row) => {
    const gender = row.gender;
    if (!acc[gender]) {
      acc[gender] = { count: 0, clv: 0 };
    }
    acc[gender].count += 1;
    acc[gender].clv += row.prediction.clv;
    return acc;
  }, {} as Record<string, { count: number; clv: number }>);

  const genderChartData = Object.entries(genderData).map(([name, data]) => ({
    name,
    count: data.count,
    avgClv: Math.round(data.clv / data.count)
  }));

  // Key insights
  const topCategory = revenueData.reduce((max, cat) => cat.clv > max.clv ? cat : max, revenueData[0]);
  const bestRetentionCategory = revenueData.reduce((min, cat) => cat.avgChurn < min.avgChurn ? cat : min, revenueData[0]);
  const highestSpendCategory = revenueData.reduce((max, cat) => cat.avgSpend > max.avgSpend ? cat : max, revenueData[0]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Advanced Analytics</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Deep dive into <span className="font-medium text-indigo-600 dark:text-indigo-400">{dataSource}</span> customer behavior
        </p>
      </div>

      {/* Key Insights Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 sm:p-6 shadow-sm text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/30">
          <div className="flex items-start sm:items-center">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 opacity-80 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-indigo-100">Top Category</p>
              <p className="text-base sm:text-xl font-bold truncate">{topCategory?.category}</p>
              <p className="text-xs text-indigo-200 truncate">${topCategory?.clv.toLocaleString()} CLV</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-6 shadow-sm text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/30">
          <div className="flex items-start sm:items-center">
            <Award className="h-6 w-6 sm:h-8 sm:w-8 opacity-80 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-100">Best Retention</p>
              <p className="text-base sm:text-xl font-bold truncate">{bestRetentionCategory?.category}</p>
              <p className="text-xs text-green-200">{bestRetentionCategory?.avgChurn}% churn</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 sm:p-6 shadow-sm text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/30">
          <div className="flex items-start sm:items-center">
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 opacity-80 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-orange-100">Highest Spend</p>
              <p className="text-base sm:text-xl font-bold truncate">{highestSpendCategory?.category}</p>
              <p className="text-xs text-orange-200">${highestSpendCategory?.avgSpend}/mo</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-6 shadow-sm text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/30">
          <div className="flex items-start sm:items-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 opacity-80 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-purple-100">Total Revenue</p>
              <p className="text-base sm:text-xl font-bold">${(aggregateStats.totalRevenue / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-purple-200">{aggregateStats.totalCustomers} customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Category - Full Width */}
      <div className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
        <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">CLV & Churn by Category</h3>
        <div className="h-72 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueData}>
              <defs>
                <linearGradient id="colorAvgClv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend 
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} 
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Bar yAxisId="left" dataKey="avgClv" name="Avg CLV" fill="url(#colorAvgClv)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgChurn" name="Avg Churn %" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Segment Breakdown */}
        <div className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Customer Segments</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData} layout="vertical">
                <defs>
                  <linearGradient id="colorSegment" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Customers" fill="url(#colorSegment)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Demographics */}
        <div className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Age Demographics & CLV</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ageData}>
                <defs>
                  <linearGradient id="colorClvAge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="avgClv" name="Avg CLV" stroke="#6366f1" fillOpacity={1} fill="url(#colorClvAge)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Radar Chart - Category Performance */}
        <div className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Category Performance Radar</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Radar name="CLV Score" dataKey="clv" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Radar name="Retention" dataKey="retention" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Legend 
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Demographics */}
        <div className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Gender Distribution & CLV</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderChartData}>
                <defs>
                  <linearGradient id="colorMale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorFemale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Count" fill="url(#colorMale)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgClv" name="Avg CLV" fill="url(#colorFemale)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Category Table */}
      <div className="rounded-2xl bg-white/60 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 overflow-hidden dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
        <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 dark:border-slate-700">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Category Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Category</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Count</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden sm:table-cell">Total CLV</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Avg CLV</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden md:table-cell">Avg Spend</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Churn</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
              {revenueData.map((row) => (
                <tr key={row.category} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-none">{row.fullName}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-slate-500 dark:text-slate-400">{row.count}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-medium text-slate-900 dark:text-white hidden sm:table-cell">${row.clv.toLocaleString()}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-slate-500 dark:text-slate-400">${row.avgClv.toLocaleString()}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-slate-500 dark:text-slate-400 hidden md:table-cell">${row.avgSpend}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.avgChurn > 50 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : row.avgChurn > 30
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {row.avgChurn}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
