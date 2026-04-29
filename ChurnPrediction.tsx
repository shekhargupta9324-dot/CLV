import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import { usePrediction } from '@/context/PredictionContext';
import { Database, TrendingUp, AlertTriangle, Users, Shield, UserX } from 'lucide-react';

const RISK_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

export function ChurnPrediction() {
  const navigate = useNavigate();
  const { predictionData, dataSource, hasPredictions, aggregateStats } = usePrediction();

  if (!hasPredictions) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Churn Analysis</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Analyze churn probability and factors contributing to customer retention or loss.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
          <div className="rounded-full bg-slate-100 p-4 sm:p-6 dark:bg-slate-800">
            <Database className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">No Prediction Data</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Run a prediction on a dataset to see churn analysis. All metrics are calculated from your prediction results.
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

  // Calculate risk distribution
  const riskDistribution = [
    { name: 'Low (0-20%)', value: predictionData.filter(r => r.prediction.churnProbability <= 20).length },
    { name: 'Med (20-40%)', value: predictionData.filter(r => r.prediction.churnProbability > 20 && r.prediction.churnProbability <= 40).length },
    { name: 'High (40-60%)', value: predictionData.filter(r => r.prediction.churnProbability > 40 && r.prediction.churnProbability <= 60).length },
    { name: 'Critical (60%+)', value: predictionData.filter(r => r.prediction.churnProbability > 60).length },
  ];

  // Calculate churn factors based on data
  const highChurnCustomers = predictionData.filter(r => r.prediction.churnProbability > 40);
  const lowChurnCustomers = predictionData.filter(r => r.prediction.churnProbability <= 40);

  const avgSupportCallsHigh = highChurnCustomers.length > 0 
    ? highChurnCustomers.reduce((sum, r) => sum + r.supportCalls, 0) / highChurnCustomers.length 
    : 0;
  const avgSupportCallsLow = lowChurnCustomers.length > 0 
    ? lowChurnCustomers.reduce((sum, r) => sum + r.supportCalls, 0) / lowChurnCustomers.length 
    : 0;

  const avgSpendHigh = highChurnCustomers.length > 0 
    ? highChurnCustomers.reduce((sum, r) => sum + r.monthlySpend, 0) / highChurnCustomers.length 
    : 0;
  const avgSpendLow = lowChurnCustomers.length > 0 
    ? lowChurnCustomers.reduce((sum, r) => sum + r.monthlySpend, 0) / lowChurnCustomers.length 
    : 0;

  const avgTenureHigh = highChurnCustomers.length > 0 
    ? highChurnCustomers.reduce((sum, r) => sum + r.tenure, 0) / highChurnCustomers.length 
    : 0;
  const avgTenureLow = lowChurnCustomers.length > 0 
    ? lowChurnCustomers.reduce((sum, r) => sum + r.tenure, 0) / lowChurnCustomers.length 
    : 0;

  // Churn reasons based on the data patterns
  const churnFactors = [
    { 
      reason: 'High Support Call Volume', 
      impact: Math.min(100, Math.round((avgSupportCallsHigh / Math.max(avgSupportCallsLow, 1)) * 25)),
      description: `High-risk: ${avgSupportCallsHigh.toFixed(1)} calls vs ${avgSupportCallsLow.toFixed(1)}`
    },
    { 
      reason: 'Low Monthly Spending', 
      impact: Math.min(100, Math.round((avgSpendLow / Math.max(avgSpendHigh, 1)) * 20)),
      description: `Lower engagement correlates with higher churn`
    },
    { 
      reason: 'Short Tenure', 
      impact: Math.min(100, Math.round((avgTenureLow / Math.max(avgTenureHigh, 1)) * 15)),
      description: `Newer customers are more likely to churn`
    },
    { 
      reason: 'Product Category Mismatch', 
      impact: 15,
      description: `Some categories show higher churn rates`
    },
  ].sort((a, b) => b.impact - a.impact);

  // Churn by category
  const categoryChurn = predictionData.reduce((acc, row) => {
    const cat = row.category;
    if (!acc[cat]) {
      acc[cat] = { total: 0, churnSum: 0 };
    }
    acc[cat].total += 1;
    acc[cat].churnSum += row.prediction.churnProbability;
    return acc;
  }, {} as Record<string, { total: number; churnSum: number }>);

  const categoryChurnData = Object.entries(categoryChurn)
    .map(([name, data]) => ({
      name: name.length > 10 ? name.substring(0, 10) + '...' : name,
      avgChurn: Math.round(data.churnSum / data.total),
      count: data.total
    }))
    .sort((a, b) => b.avgChurn - a.avgChurn);

  // Scatter data for CLV vs Churn
  const scatterData = predictionData.map(r => ({
    x: r.prediction.clv,
    y: r.prediction.churnProbability,
    name: r.name,
    segment: r.prediction.segment
  }));

  // At-risk customers list
  const atRiskCustomers = [...predictionData]
    .filter(r => r.prediction.churnProbability > 40)
    .sort((a, b) => b.prediction.churnProbability - a.prediction.churnProbability)
    .slice(0, 10);

  // Stats cards data
  const churnStats = [
    { 
      name: 'At Risk Customers', 
      value: aggregateStats.atRiskCount, 
      percent: ((aggregateStats.atRiskCount / aggregateStats.totalCustomers) * 100).toFixed(1) + '%',
      icon: UserX,
      color: 'red'
    },
    { 
      name: 'Retention Rate', 
      value: (100 - aggregateStats.avgChurn).toFixed(1) + '%', 
      percent: 'of customers',
      icon: Shield,
      color: 'green'
    },
    { 
      name: 'High Risk (>60%)', 
      value: riskDistribution[3].value, 
      percent: 'need action',
      icon: AlertTriangle,
      color: 'orange'
    },
    { 
      name: 'Safe Customers', 
      value: riskDistribution[0].value, 
      percent: 'low risk',
      icon: Users,
      color: 'indigo'
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Churn Analysis</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Analysis for <span className="font-medium text-indigo-600 dark:text-indigo-400">{dataSource}</span> - {aggregateStats.totalCustomers} customers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {churnStats.map((stat) => (
          <div key={stat.name} className="overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="flex items-start sm:items-center">
              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg flex-shrink-0 ${
                stat.color === 'red' ? 'bg-red-50 dark:bg-red-900/50' :
                stat.color === 'green' ? 'bg-green-50 dark:bg-green-900/50' :
                stat.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/50' :
                'bg-indigo-50 dark:bg-indigo-900/50'
              }`}>
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  stat.color === 'red' ? 'text-red-600 dark:text-red-400' :
                  stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                  stat.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                  'text-indigo-600 dark:text-indigo-400'
                }`} />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{stat.name}</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{stat.percent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Customer Risk Distribution</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} 
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Top Churn Factors</h3>
          <div className="space-y-4 sm:space-y-5">
            {churnFactors.map((item) => (
              <div key={item.reason}>
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                  <span className="text-slate-700 dark:text-slate-300 truncate mr-2">{item.reason}</span>
                  <span className="text-slate-900 dark:text-white flex-shrink-0">{item.impact}%</span>
                </div>
                <div className="mt-1.5 sm:mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-full transition-all duration-500 ${
                      item.impact > 30 ? 'bg-red-500' : item.impact > 20 ? 'bg-orange-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${item.impact}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Churn by Category */}
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Avg Churn Rate by Category</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChurnData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(value) => [`${value}%`, 'Avg Churn']}
                />
                <Bar dataKey="avgChurn" radius={[0, 4, 4, 0]}>
                  {categoryChurnData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.avgChurn > 50 ? '#ef4444' : entry.avgChurn > 30 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CLV vs Churn Scatter */}
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">CLV vs Churn Risk</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" dataKey="x" name="CLV" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="number" dataKey="y" name="Churn %" stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                <ZAxis range={[30, 30]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
                <Scatter name="Customers" data={scatterData} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* At Risk Customers Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden dark:bg-slate-800 dark:ring-slate-700">
        <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 dark:border-slate-700">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Top At-Risk Customers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Customer</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden sm:table-cell">Category</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden md:table-cell">CLV at Risk</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Churn</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden lg:table-cell">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
              {atRiskCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs dark:bg-red-900/50 dark:text-red-300 flex-shrink-0">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-2 sm:ml-3 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-none">{customer.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">{customer.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{customer.category}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hidden md:table-cell">
                    ${customer.prediction.clv.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 sm:w-16 h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${customer.prediction.churnProbability}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                        {customer.prediction.churnProbability}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Send Offer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {atRiskCustomers.length === 0 && (
          <div className="p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No high-risk customers found. Great news!</p>
          </div>
        )}
      </div>
    </div>
  );
}
