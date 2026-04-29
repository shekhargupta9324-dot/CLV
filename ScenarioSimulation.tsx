import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  RefreshCw,
  Download,
  Sparkles,
  Target,
  Zap,
  Calendar,
  Percent,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  Line,
} from 'recharts';
import { usePrediction, PredictionRow } from '../context/PredictionContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SimulationParams {
  frequencyChange: number;
  orderValueChange: number;
  retentionChange: number;
  discountRate: number;
  timeHorizon: number;
  marketingSpendChange: number;
}

interface SimulatedCustomer extends PredictionRow {
  simulatedCLV: number;
  simulatedChurn: number;
  clvChange: number;
  clvChangePercent: number;
}

const ScenarioSimulation: React.FC = () => {
  const { predictionData, hasPredictions, dataSource, aggregateStats } = usePrediction();
  const navigate = useNavigate();

  // Simulation parameters
  const [params, setParams] = useState<SimulationParams>({
    frequencyChange: 0,
    orderValueChange: 0,
    retentionChange: 0,
    discountRate: 10,
    timeHorizon: 36,
    marketingSpendChange: 0,
  });

  // Saved scenarios
  const [savedScenarios, setSavedScenarios] = useState<Array<{ name: string; params: SimulationParams; impact: number }>>([]);

  // Calculate simulated metrics
  const simulatedMetrics = useMemo(() => {
    if (!hasPredictions || !predictionData.length) {
      return null;
    }

    const baseAvgCLV = aggregateStats.avgClv;
    const baseAvgChurn = aggregateStats.avgChurn;
    const totalCustomers = predictionData.length;

    // CLV calculation factors
    const frequencyMultiplier = 1 + (params.frequencyChange / 100);
    const orderValueMultiplier = 1 + (params.orderValueChange / 100);
    const retentionMultiplier = 1 + (params.retentionChange / 100);
    const marketingROI = params.marketingSpendChange > 0 ? 1 + (params.marketingSpendChange / 100) * 0.3 : 1;

    // Discount factor for NPV calculation
    const monthlyDiscountRate = params.discountRate / 100 / 12;
    const discountFactor = (1 - Math.pow(1 + monthlyDiscountRate, -params.timeHorizon)) / monthlyDiscountRate;
    const baseDiscountFactor = (1 - Math.pow(1 + 0.00833, -36)) / 0.00833; // Base: 10% annual, 36 months

    // Calculate new CLV
    const newAvgCLV = baseAvgCLV * 
      frequencyMultiplier * 
      orderValueMultiplier * 
      retentionMultiplier * 
      marketingROI *
      (discountFactor / baseDiscountFactor);

    // Calculate new churn rate
    const newChurnRate = Math.max(0, Math.min(100, baseAvgChurn * (1 - params.retentionChange / 100) * (1 - params.marketingSpendChange / 200)));

    // Calculate revenue impact
    const baseRevenue = baseAvgCLV * totalCustomers;
    const newRevenue = newAvgCLV * totalCustomers;
    const revenueImpact = newRevenue - baseRevenue;
    const revenueImpactPercent = ((newRevenue - baseRevenue) / baseRevenue) * 100;

    // Calculate customer segments after simulation
    const simulatedResults: SimulatedCustomer[] = predictionData.map((customer) => {
      const newCLV = customer.prediction.clv * 
        frequencyMultiplier * 
        orderValueMultiplier * 
        retentionMultiplier * 
        marketingROI *
        (discountFactor / baseDiscountFactor);
      
      const newChurn = Math.max(0, Math.min(100, customer.prediction.churnProbability * (1 - params.retentionChange / 100)));
      
      return {
        ...customer,
        simulatedCLV: newCLV,
        simulatedChurn: newChurn,
        clvChange: newCLV - customer.prediction.clv,
        clvChangePercent: ((newCLV - customer.prediction.clv) / customer.prediction.clv) * 100,
      };
    });

    // Segment distribution after simulation
    const segments = {
      premium: simulatedResults.filter((c) => c.simulatedCLV > 5000).length,
      high: simulatedResults.filter((c) => c.simulatedCLV >= 3000 && c.simulatedCLV <= 5000).length,
      medium: simulatedResults.filter((c) => c.simulatedCLV >= 1000 && c.simulatedCLV < 3000).length,
      low: simulatedResults.filter((c) => c.simulatedCLV < 1000).length,
    };

    // Projection over time
    const projection = Array.from({ length: Math.ceil(params.timeHorizon / 6) }, (_, i) => {
      const month = (i + 1) * 6;
      const timeFactor = month / params.timeHorizon;
      const baseValue = baseAvgCLV * timeFactor * totalCustomers;
      const simulatedValue = newAvgCLV * timeFactor * totalCustomers;
      return {
        month: `Month ${month}`,
        baseline: Math.round(baseValue),
        simulated: Math.round(simulatedValue),
        difference: Math.round(simulatedValue - baseValue),
      };
    });

    // Top impacted customers
    const topImpacted = [...simulatedResults]
      .sort((a, b) => b.clvChange - a.clvChange)
      .slice(0, 10);

    return {
      baseAvgCLV,
      newAvgCLV,
      baseChurn: baseAvgChurn,
      newChurn: newChurnRate,
      baseRevenue,
      newRevenue,
      revenueImpact,
      revenueImpactPercent,
      totalCustomers,
      segments,
      projection,
      topImpacted,
      simulatedResults,
    };
  }, [predictionData, hasPredictions, aggregateStats, params]);

  const handleReset = () => {
    setParams({
      frequencyChange: 0,
      orderValueChange: 0,
      retentionChange: 0,
      discountRate: 10,
      timeHorizon: 36,
      marketingSpendChange: 0,
    });
    toast.success('Simulation reset to baseline');
  };

  const handleSaveScenario = () => {
    if (!simulatedMetrics) return;
    const name = `Scenario ${savedScenarios.length + 1}`;
    setSavedScenarios(prev => [...prev, {
      name,
      params: { ...params },
      impact: simulatedMetrics.revenueImpactPercent,
    }]);
    toast.success(`${name} saved!`);
  };

  const handleLoadScenario = (scenario: { name: string; params: SimulationParams }) => {
    setParams(scenario.params);
    toast.success(`${scenario.name} loaded`);
  };

  const handleExportSimulation = () => {
    if (!simulatedMetrics) return;
    
    const csvContent = [
      ['Scenario Simulation Results'],
      [''],
      ['Parameters'],
      ['Frequency Change', `${params.frequencyChange}%`],
      ['Order Value Change', `${params.orderValueChange}%`],
      ['Retention Change', `${params.retentionChange}%`],
      ['Discount Rate', `${params.discountRate}%`],
      ['Time Horizon', `${params.timeHorizon} months`],
      ['Marketing Spend Change', `${params.marketingSpendChange}%`],
      [''],
      ['Results'],
      ['Baseline Avg CLV', `$${simulatedMetrics.baseAvgCLV.toFixed(2)}`],
      ['Simulated Avg CLV', `$${simulatedMetrics.newAvgCLV.toFixed(2)}`],
      ['Revenue Impact', `$${simulatedMetrics.revenueImpact.toFixed(2)}`],
      ['Revenue Impact %', `${simulatedMetrics.revenueImpactPercent.toFixed(2)}%`],
      [''],
      ['Customer Impact'],
      ['Customer ID', 'Name', 'Baseline CLV', 'Simulated CLV', 'Change', 'Change %'],
      ...simulatedMetrics.simulatedResults.map((c) => [
        c.id,
        c.name,
        c.prediction.clv.toFixed(2),
        c.simulatedCLV.toFixed(2),
        c.clvChange.toFixed(2),
        `${c.clvChangePercent.toFixed(2)}%`,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario_simulation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Simulation exported to CSV');
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  const SliderInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    icon: React.ReactNode;
    description?: string;
  }> = ({ label, value, onChange, min, max, step = 1, unit = '%', icon, description }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{label}</h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        <div className={`text-lg sm:text-2xl font-bold ${
          value > 0 ? 'text-green-600 dark:text-green-400' : 
          value < 0 ? 'text-red-600 dark:text-red-400' : 
          'text-gray-600 dark:text-gray-400'
        }`}>
          {value > 0 ? '+' : ''}{value}{unit}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  if (!hasPredictions) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <SlidersHorizontal className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Prediction Data Available</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Run a prediction first to enable What-If scenario simulation.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Upload Data & Predict
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SlidersHorizontal className="w-8 h-8" />
              <h1 className="text-2xl sm:text-3xl font-bold">What-If Analysis</h1>
            </div>
            <p className="text-purple-100 text-sm sm:text-base">
              Simulate different scenarios and see real-time CLV impact for {dataSource}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSaveScenario}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
            >
              <Target className="w-4 h-4" />
              Save Scenario
            </button>
            <button
              onClick={handleExportSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Impact Summary */}
      {simulatedMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Simulated Avg CLV</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ${simulatedMetrics.newAvgCLV.toFixed(0)}
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              simulatedMetrics.newAvgCLV >= simulatedMetrics.baseAvgCLV 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {simulatedMetrics.newAvgCLV >= simulatedMetrics.baseAvgCLV 
                ? <TrendingUp className="w-4 h-4" /> 
                : <TrendingDown className="w-4 h-4" />}
              {((simulatedMetrics.newAvgCLV - simulatedMetrics.baseAvgCLV) / simulatedMetrics.baseAvgCLV * 100).toFixed(1)}% vs baseline
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Impact</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${
              simulatedMetrics.revenueImpact >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {simulatedMetrics.revenueImpact >= 0 ? '+' : ''}${(simulatedMetrics.revenueImpact / 1000).toFixed(0)}K
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {simulatedMetrics.revenueImpactPercent >= 0 ? '+' : ''}{simulatedMetrics.revenueImpactPercent.toFixed(1)}% change
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Churn Rate</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {simulatedMetrics.newChurn.toFixed(1)}%
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              simulatedMetrics.newChurn <= simulatedMetrics.baseChurn 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {simulatedMetrics.newChurn <= simulatedMetrics.baseChurn 
                ? <CheckCircle2 className="w-4 h-4" /> 
                : <AlertCircle className="w-4 h-4" />}
              {(simulatedMetrics.baseChurn - simulatedMetrics.newChurn).toFixed(1)}% reduction
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ${(simulatedMetrics.newRevenue / 1000).toFixed(0)}K
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              From {simulatedMetrics.totalCustomers} customers
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Simulation Controls */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-purple-600" />
            Simulation Parameters
          </h2>

          <SliderInput
            label="Purchase Frequency"
            value={params.frequencyChange}
            onChange={(v) => setParams(prev => ({ ...prev, frequencyChange: v }))}
            min={-50}
            max={100}
            icon={<ShoppingCart className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            description="How often customers purchase"
          />

          <SliderInput
            label="Average Order Value"
            value={params.orderValueChange}
            onChange={(v) => setParams(prev => ({ ...prev, orderValueChange: v }))}
            min={-50}
            max={100}
            icon={<DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            description="Amount spent per order"
          />

          <SliderInput
            label="Customer Retention"
            value={params.retentionChange}
            onChange={(v) => setParams(prev => ({ ...prev, retentionChange: v }))}
            min={-30}
            max={50}
            icon={<Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            description="Customer loyalty improvement"
          />

          <SliderInput
            label="Marketing Spend"
            value={params.marketingSpendChange}
            onChange={(v) => setParams(prev => ({ ...prev, marketingSpendChange: v }))}
            min={-50}
            max={100}
            icon={<Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            description="Marketing investment change"
          />

          <SliderInput
            label="Discount Rate"
            value={params.discountRate}
            onChange={(v) => setParams(prev => ({ ...prev, discountRate: v }))}
            min={5}
            max={20}
            icon={<Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            description="Annual discount rate for NPV"
          />

          <SliderInput
            label="Time Horizon"
            value={params.timeHorizon}
            onChange={(v) => setParams(prev => ({ ...prev, timeHorizon: v }))}
            min={12}
            max={60}
            step={6}
            unit=" mo"
            icon={<Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            description="Prediction time period"
          />

          {/* Saved Scenarios */}
          {savedScenarios.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Saved Scenarios
              </h3>
              <div className="space-y-2">
                {savedScenarios.map((scenario, index) => (
                  <button
                    key={index}
                    onClick={() => handleLoadScenario(scenario)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{scenario.name}</span>
                    <span className={`text-sm font-bold ${
                      scenario.impact >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {scenario.impact >= 0 ? '+' : ''}{scenario.impact.toFixed(1)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* Revenue Projection Chart */}
          {simulatedMetrics && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Revenue Projection: Baseline vs Simulated
              </h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={simulatedMetrics.projection}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(value) => [`$${Number(value || 0).toLocaleString()}`, '']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="baseline"
                      fill="#e5e7eb"
                      stroke="#9ca3af"
                      fillOpacity={0.3}
                      name="Baseline"
                    />
                    <Area
                      type="monotone"
                      dataKey="simulated"
                      fill="#c4b5fd"
                      stroke="#8b5cf6"
                      fillOpacity={0.5}
                      name="Simulated"
                    />
                    <Line
                      type="monotone"
                      dataKey="difference"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                      name="Difference"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Segment Distribution */}
          {simulatedMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Customer Segments After Simulation
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Premium ($5K+)', value: simulatedMetrics.segments.premium },
                          { name: 'High ($3-5K)', value: simulatedMetrics.segments.high },
                          { name: 'Medium ($1-3K)', value: simulatedMetrics.segments.medium },
                          { name: 'Low (<$1K)', value: simulatedMetrics.segments.low },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { label: 'Premium', value: simulatedMetrics.segments.premium, color: '#8b5cf6' },
                    { label: 'High', value: simulatedMetrics.segments.high, color: '#3b82f6' },
                    { label: 'Medium', value: simulatedMetrics.segments.medium, color: '#10b981' },
                    { label: 'Low', value: simulatedMetrics.segments.low, color: '#f59e0b' },
                  ].map(seg => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{seg.label}: {seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Impacted Customers */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Top Impacted Customers
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {simulatedMetrics.topImpacted.map((customer, index) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{customer.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          +${customer.clvChange.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          +{customer.clvChangePercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scenario Impact Summary */}
          {simulatedMetrics && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Scenario Impact Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">If frequency increases by</div>
                  <div className="text-xl font-bold text-purple-600">{params.frequencyChange}%</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">And order value by</div>
                  <div className="text-xl font-bold text-blue-600">{params.orderValueChange}%</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">CLV will change by</div>
                  <div className={`text-xl font-bold ${
                    simulatedMetrics.revenueImpactPercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {simulatedMetrics.revenueImpactPercent >= 0 ? '+' : ''}{simulatedMetrics.revenueImpactPercent.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Additional Revenue</div>
                  <div className={`text-xl font-bold ${
                    simulatedMetrics.revenueImpact >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {simulatedMetrics.revenueImpact >= 0 ? '+' : ''}${(simulatedMetrics.revenueImpact / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">AI Recommendation</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {params.frequencyChange > 20 && params.orderValueChange > 20
                        ? "Great combination! Focus on loyalty programs and upselling to achieve these targets."
                        : params.frequencyChange > params.orderValueChange
                        ? "Consider subscription models or automated reordering to increase purchase frequency."
                        : params.orderValueChange > params.frequencyChange
                        ? "Bundle products or offer premium versions to increase average order value."
                        : params.retentionChange > 20
                        ? "Invest in customer success and personalized engagement to improve retention."
                        : "Adjust the sliders to explore different growth scenarios for your business."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulation;
