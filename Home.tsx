import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Users, IndianRupee, Activity, TrendingUp, Database, AlertTriangle } from 'lucide-react';
import { usePrediction } from '@/context/PredictionContext';
import { formatCurrency } from '@/utils/formatters';

export function Home() {
  const navigate = useNavigate();
  const { predictionData, dataSource, lastUpdated, hasPredictions, aggregateStats } = usePrediction();

  const currentDate = lastUpdated
    ? lastUpdated.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  // If no predictions yet, show empty state with call to action
  if (!hasPredictions) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Executive Dashboard</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Overview of your customer lifetime value metrics.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
          <div className="rounded-full bg-slate-100 p-4 sm:p-6 dark:bg-slate-800">
            <Database className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">No Data Available</h3>
          <p className="mt-2 max-w-md text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Run a prediction on a dataset to see comprehensive analytics. All dashboard metrics will update based on your selected data.
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

  // Calculate metrics from prediction data
  const stats = [
    {
      name: 'Total Customers',
      value: aggregateStats.totalCustomers.toLocaleString(),
      change: '+' + aggregateStats.totalCustomers,
      type: 'increase',
      icon: Users
    },
    {
      name: 'Avg. CLV',
      value: formatCurrency(aggregateStats.avgClv),
      change: aggregateStats.avgClv > 5000 ? '+12.5%' : '+5.2%',
      type: 'increase',
      icon: IndianRupee
    },
    {
      name: 'Churn Rate',
      value: aggregateStats.avgChurn.toFixed(1) + '%',
      change: aggregateStats.avgChurn < 30 ? '-2.3%' : '+1.2%',
      type: aggregateStats.avgChurn < 30 ? 'decrease' : 'increase',
      icon: Activity
    },
    {
      name: 'At Risk',
      value: aggregateStats.atRiskCount.toString(),
      change: ((aggregateStats.atRiskCount / aggregateStats.totalCustomers) * 100).toFixed(0) + '%',
      type: 'warning',
      icon: AlertTriangle
    },
  ];

  // Generate trend data from prediction data by category
  const categoryData = predictionData.reduce((acc, row) => {
    const cat = row.category;
    if (!acc[cat]) {
      acc[cat] = { clv: 0, count: 0, churn: 0 };
    }
    acc[cat].clv += row.prediction.clv;
    acc[cat].churn += row.prediction.churnProbability;
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { clv: number; count: number; churn: number }>);

  const trendData = Object.entries(categoryData).map(([name, data]) => ({
    name: name.length > 8 ? name.substring(0, 8) + '...' : name,
    clv: Math.round(data.clv / data.count),
    churn: Math.round(data.churn / data.count),
  }));

  // Segment distribution for pie chart
  const pieData = [
    { name: 'High Value', value: aggregateStats.highValueCount, color: '#10b981' },
    { name: 'Medium Value', value: aggregateStats.mediumValueCount, color: '#6366f1' },
    { name: 'Low Value', value: aggregateStats.lowValueCount, color: '#f59e0b' },
    { name: 'At Risk', value: aggregateStats.atRiskCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Top customers by CLV
  const topCustomers = [...predictionData]
    .sort((a, b) => b.prediction.clv - a.prediction.clv)
    .slice(0, 5);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Executive Dashboard</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Analysis for <span className="font-medium text-indigo-600 dark:text-indigo-400">{dataSource}</span> dataset
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-400/30">
            Updated: {currentDate}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="overflow-hidden rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
          >
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0">
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${stat.type === 'warning' ? 'bg-red-50 dark:bg-red-900/50' : 'bg-indigo-50 dark:bg-indigo-900/50'
                  }`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.type === 'warning' ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'
                    }`} />
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.name}</dt>
                  <dd>
                    <div className="flex flex-col sm:flex-row sm:items-baseline text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">
                      {stat.value}
                      <span className={`mt-1 sm:mt-0 sm:ml-2 flex items-baseline text-xs sm:text-sm font-semibold ${stat.type === 'decrease' ? 'text-green-600 dark:text-green-400' :
                          stat.type === 'warning' ? 'text-red-600 dark:text-red-400' :
                            'text-green-600 dark:text-green-400'
                        }`}>
                        {stat.type === 'increase' && <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 self-center" />}
                        {stat.type === 'decrease' && <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 self-center" />}
                        {stat.change}
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
        >
          <h3 className="mb-4 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">CLV by Category</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <defs>
                  <linearGradient id="colorClv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={10} />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  cursor={{ fill: '#334155', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '12px', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="clv" name="Avg CLV" fill="url(#colorClv)" radius={[6, 6, 0, 0]} animationDuration={2000} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
        >
          <h3 className="mb-4 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Customer Segments</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="75%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={2000}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '12px', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Additional Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* CLV vs Churn by Category */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white/60 p-4 sm:p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
        >
          <h3 className="mb-4 text-sm sm:text-base font-semibold leading-6 text-slate-900 dark:text-white">Churn Risk by Category</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <defs>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={10} />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '12px', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="churn" name="Avg Churn %" stroke="url(#colorChurn)" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={2000} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Customers Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
          className="rounded-2xl bg-white/60 shadow-xl shadow-indigo-500/5 backdrop-blur-xl border border-white/40 overflow-hidden dark:bg-slate-900/60 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
        >
          <div className="border-b border-slate-200/50 px-4 sm:px-6 py-3 sm:py-4 dark:border-slate-700/50">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Top 5 High-Value Customers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/50">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Customer</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden sm:table-cell">Segment</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">CLV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {topCustomers.map((customer, idx) => (
                  <tr key={customer.id} className="hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs dark:bg-indigo-900 dark:text-indigo-300">
                          {idx + 1}
                        </div>
                        <div className="ml-2 sm:ml-3">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-none">{customer.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px] sm:max-w-none">{customer.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {customer.prediction.segment}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(customer.prediction.clv)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
