// Industry Benchmarking Service
// Compare your metrics against industry standards

import { IndustryBenchmark } from '@/types/database';
import { PredictionRow } from '@/context/PredictionContext';

// Industry benchmark data (simulated database)
export const industryBenchmarks: IndustryBenchmark[] = [
  {
    industry: 'E-commerce',
    avgClv: 285,
    avgChurnRate: 22.5,
    avgRetentionRate: 77.5,
    avgCustomerTenure: 18,
    avgMonthlySpend: 125,
    topPerformerClv: 850,
    updatedAt: new Date('2024-01-15')
  },
  {
    industry: 'Retail',
    avgClv: 320,
    avgChurnRate: 28.0,
    avgRetentionRate: 72.0,
    avgCustomerTenure: 24,
    avgMonthlySpend: 95,
    topPerformerClv: 720,
    updatedAt: new Date('2024-01-15')
  },
  {
    industry: 'Automotive',
    avgClv: 12500,
    avgChurnRate: 15.0,
    avgRetentionRate: 85.0,
    avgCustomerTenure: 60,
    avgMonthlySpend: 450,
    topPerformerClv: 35000,
    updatedAt: new Date('2024-01-15')
  },
  {
    industry: 'Luxury Goods',
    avgClv: 8500,
    avgChurnRate: 12.0,
    avgRetentionRate: 88.0,
    avgCustomerTenure: 48,
    avgMonthlySpend: 650,
    topPerformerClv: 25000,
    updatedAt: new Date('2024-01-15')
  },
  {
    industry: 'SaaS',
    avgClv: 4200,
    avgChurnRate: 5.5,
    avgRetentionRate: 94.5,
    avgCustomerTenure: 36,
    avgMonthlySpend: 250,
    topPerformerClv: 15000,
    updatedAt: new Date('2024-01-15')
  },
  {
    industry: 'Electric Vehicles',
    avgClv: 45000,
    avgChurnRate: 8.0,
    avgRetentionRate: 92.0,
    avgCustomerTenure: 84,
    avgMonthlySpend: 1200,
    topPerformerClv: 95000,
    updatedAt: new Date('2024-01-15')
  },
  {
    industry: 'Consumer Electronics',
    avgClv: 520,
    avgChurnRate: 35.0,
    avgRetentionRate: 65.0,
    avgCustomerTenure: 12,
    avgMonthlySpend: 180,
    topPerformerClv: 1500,
    updatedAt: new Date('2024-01-15')
  },
  {
    industry: 'Fashion',
    avgClv: 380,
    avgChurnRate: 32.0,
    avgRetentionRate: 68.0,
    avgCustomerTenure: 14,
    avgMonthlySpend: 110,
    topPerformerClv: 950,
    updatedAt: new Date('2024-01-15')
  }
];

// Map company/category to industry
export function mapToIndustry(company: string): string {
  const companyMap: Record<string, string> = {
    'Amazon': 'E-commerce',
    'Flipkart': 'E-commerce',
    'Tata': 'Automotive',
    'BMW': 'Luxury Goods',
    'Tesla': 'Electric Vehicles'
  };
  
  return companyMap[company] || 'E-commerce';
}

export interface BenchmarkComparison {
  metric: string;
  yourValue: number;
  industryAvg: number;
  topPerformer: number;
  percentile: number;
  status: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  improvement: string;
}

export interface BenchmarkReport {
  industry: string;
  comparisons: BenchmarkComparison[];
  overallScore: number;
  overallRating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  insights: BenchmarkInsight[];
  recommendations: string[];
}

export interface BenchmarkInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// Generate benchmark comparison report
export function generateBenchmarkReport(
  predictionData: PredictionRow[],
  company: string
): BenchmarkReport {
  const industry = mapToIndustry(company);
  const benchmark = industryBenchmarks.find(b => b.industry === industry) || industryBenchmarks[0];
  
  // Calculate your metrics
  const yourMetrics = calculateMetrics(predictionData);
  
  // Generate comparisons
  const comparisons: BenchmarkComparison[] = [
    compareMetric('Average CLV', yourMetrics.avgClv, benchmark.avgClv, benchmark.topPerformerClv, true),
    compareMetric('Churn Rate', yourMetrics.avgChurn, benchmark.avgChurnRate, benchmark.avgChurnRate * 0.4, false),
    compareMetric('Retention Rate', 100 - yourMetrics.avgChurn, benchmark.avgRetentionRate, 98, true),
    compareMetric('Avg Monthly Spend', yourMetrics.avgMonthlySpend, benchmark.avgMonthlySpend, benchmark.avgMonthlySpend * 1.8, true),
    compareMetric('Customer Tenure', yourMetrics.avgTenure, benchmark.avgCustomerTenure, benchmark.avgCustomerTenure * 1.5, true)
  ];
  
  // Calculate overall score
  const overallScore = Math.round(comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length);
  const overallRating = getOverallRating(overallScore);
  
  // Generate insights
  const insights = generateInsights(comparisons, yourMetrics, benchmark);
  
  // Generate recommendations
  const recommendations = generateRecommendations(comparisons, insights);
  
  return {
    industry,
    comparisons,
    overallScore,
    overallRating,
    insights,
    recommendations
  };
}

function calculateMetrics(data: PredictionRow[]): {
  avgClv: number;
  avgChurn: number;
  avgMonthlySpend: number;
  avgTenure: number;
} {
  if (data.length === 0) {
    return { avgClv: 0, avgChurn: 0, avgMonthlySpend: 0, avgTenure: 0 };
  }
  
  return {
    avgClv: data.reduce((sum, r) => sum + r.prediction.clv, 0) / data.length,
    avgChurn: data.reduce((sum, r) => sum + r.prediction.churnProbability, 0) / data.length,
    avgMonthlySpend: data.reduce((sum, r) => sum + r.monthlySpend, 0) / data.length,
    avgTenure: data.reduce((sum, r) => sum + r.tenure, 0) / data.length
  };
}

function compareMetric(
  name: string,
  yourValue: number,
  industryAvg: number,
  topPerformer: number,
  higherIsBetter: boolean
): BenchmarkComparison {
  let percentile: number;
  
  if (higherIsBetter) {
    if (yourValue >= topPerformer) {
      percentile = 95 + (5 * (yourValue - topPerformer) / topPerformer);
    } else if (yourValue >= industryAvg) {
      percentile = 50 + (45 * (yourValue - industryAvg) / (topPerformer - industryAvg));
    } else {
      percentile = Math.max(5, 50 * (yourValue / industryAvg));
    }
  } else {
    // For metrics where lower is better (like churn rate)
    if (yourValue <= topPerformer) {
      percentile = 95 + Math.min(5, (topPerformer - yourValue) * 2);
    } else if (yourValue <= industryAvg) {
      percentile = 50 + (45 * (industryAvg - yourValue) / (industryAvg - topPerformer));
    } else {
      percentile = Math.max(5, 50 * (industryAvg / yourValue));
    }
  }
  
  percentile = Math.min(100, Math.max(0, percentile));
  const status = getStatus(percentile);
  
  const improvement = calculateImprovement(yourValue, industryAvg, topPerformer, higherIsBetter);
  
  return {
    metric: name,
    yourValue: Math.round(yourValue * 100) / 100,
    industryAvg: Math.round(industryAvg * 100) / 100,
    topPerformer: Math.round(topPerformer * 100) / 100,
    percentile: Math.round(percentile),
    status,
    improvement
  };
}

function getStatus(percentile: number): BenchmarkComparison['status'] {
  if (percentile >= 80) return 'excellent';
  if (percentile >= 60) return 'good';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'poor';
}

function getOverallRating(score: number): BenchmarkReport['overallRating'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  if (score >= 20) return 'below_average';
  return 'poor';
}

function calculateImprovement(
  yourValue: number,
  industryAvg: number,
  topPerformer: number,
  higherIsBetter: boolean
): string {
  if (higherIsBetter) {
    if (yourValue >= topPerformer) {
      return `You're ${((yourValue - topPerformer) / topPerformer * 100).toFixed(0)}% above top performers!`;
    } else if (yourValue >= industryAvg) {
      const gap = ((topPerformer - yourValue) / yourValue * 100).toFixed(0);
      return `Increase by ${gap}% to reach top performer level`;
    } else {
      const gap = ((industryAvg - yourValue) / yourValue * 100).toFixed(0);
      return `Increase by ${gap}% to reach industry average`;
    }
  } else {
    if (yourValue <= topPerformer) {
      return `You're ${((topPerformer - yourValue) / topPerformer * 100).toFixed(0)}% better than top performers!`;
    } else if (yourValue <= industryAvg) {
      const gap = ((yourValue - topPerformer) / topPerformer * 100).toFixed(0);
      return `Reduce by ${gap}% to reach top performer level`;
    } else {
      const gap = ((yourValue - industryAvg) / industryAvg * 100).toFixed(0);
      return `Reduce by ${gap}% to reach industry average`;
    }
  }
}

function generateInsights(
  comparisons: BenchmarkComparison[],
  _yourMetrics: { avgClv: number; avgChurn: number; avgMonthlySpend: number; avgTenure: number },
  _benchmark: IndustryBenchmark
): BenchmarkInsight[] {
  const insights: BenchmarkInsight[] = [];
  
  // Strengths
  comparisons.filter(c => c.status === 'excellent' || c.status === 'good').forEach(c => {
    insights.push({
      type: 'strength',
      title: `Strong ${c.metric}`,
      description: `Your ${c.metric.toLowerCase()} of ${c.yourValue.toLocaleString()} is in the ${c.percentile}th percentile for your industry.`,
      impact: c.percentile >= 80 ? 'high' : 'medium'
    });
  });
  
  // Weaknesses
  comparisons.filter(c => c.status === 'below_average' || c.status === 'poor').forEach(c => {
    insights.push({
      type: 'weakness',
      title: `${c.metric} Needs Improvement`,
      description: `Your ${c.metric.toLowerCase()} is ${c.percentile}th percentile. ${c.improvement}`,
      impact: c.percentile <= 20 ? 'high' : 'medium'
    });
  });
  
  // Opportunities
  const clvComparison = comparisons.find(c => c.metric === 'Average CLV');
  const churnComparison = comparisons.find(c => c.metric === 'Churn Rate');
  
  if (clvComparison && churnComparison && clvComparison.percentile < 60 && churnComparison.percentile > 40) {
    insights.push({
      type: 'opportunity',
      title: 'Revenue Growth Potential',
      description: 'With good retention rates, focusing on increasing customer spend could significantly boost CLV.',
      impact: 'high'
    });
  }
  
  // Threats
  if (churnComparison && churnComparison.status === 'poor') {
    insights.push({
      type: 'threat',
      title: 'High Customer Attrition',
      description: 'Elevated churn rates threaten long-term revenue stability. Immediate retention strategies recommended.',
      impact: 'high'
    });
  }
  
  return insights.slice(0, 6);
}

function generateRecommendations(
  comparisons: BenchmarkComparison[],
  insights: BenchmarkInsight[]
): string[] {
  const recommendations: string[] = [];
  
  const churnComp = comparisons.find(c => c.metric === 'Churn Rate');
  const clvComp = comparisons.find(c => c.metric === 'Average CLV');
  const spendComp = comparisons.find(c => c.metric === 'Avg Monthly Spend');
  
  if (churnComp && churnComp.percentile < 50) {
    recommendations.push('Implement a customer loyalty program to improve retention rates');
    recommendations.push('Set up automated re-engagement campaigns for at-risk customers');
  }
  
  if (clvComp && clvComp.percentile < 60) {
    recommendations.push('Focus on cross-selling and upselling to existing customers');
    recommendations.push('Develop VIP tiers with exclusive benefits for high-value customers');
  }
  
  if (spendComp && spendComp.percentile < 50) {
    recommendations.push('Review pricing strategy and value proposition');
    recommendations.push('Introduce bundled offerings to increase average order value');
  }
  
  if (insights.some(i => i.type === 'threat')) {
    recommendations.push('Conduct customer satisfaction surveys to identify pain points');
    recommendations.push('Implement proactive customer success outreach program');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Maintain current strategies while exploring new growth opportunities');
    recommendations.push('Consider expanding into new customer segments or markets');
  }
  
  return recommendations.slice(0, 5);
}

// Get all available industries
export function getAvailableIndustries(): string[] {
  return industryBenchmarks.map(b => b.industry);
}

// Get benchmark for specific industry
export function getIndustryBenchmark(industry: string): IndustryBenchmark | undefined {
  return industryBenchmarks.find(b => b.industry === industry);
}
