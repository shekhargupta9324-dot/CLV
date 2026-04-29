
// Simulation of AI Service
// In a real app, this would call the Google Gemini API

export interface CustomerData {
  id?: string;
  name: string;
  age: number;
  gender: string;
  tenure: number; // months
  monthlySpend: number;
  totalSpend: number;
  lastPurchaseDate: string;
  category: string;
  supportCalls: number;
}

export interface PredictionResult {
  clv: number;
  churnProbability: number;
  segment: 'High Value' | 'Medium Value' | 'Low Value' | 'At Risk';
  factors: string[];
  recommendations: string[];
}

export const predictCLV = async (data: CustomerData): Promise<PredictionResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simple rule-based logic to mock AI predictions
  const baseCLV = data.monthlySpend * data.tenure;
  const churnRisk = Math.min(0.9, (data.supportCalls * 0.1) + (data.monthlySpend < 50 ? 0.2 : 0));
  
  let clv = baseCLV * (1 - churnRisk) * 12; // Simple 12-month projection
  
  // Adjust based on "AI" logic
  if (data.age > 25 && data.age < 45) clv *= 1.2;
  if (data.totalSpend > 5000) clv *= 1.1;

  const churnProbability = parseFloat((churnRisk * 100).toFixed(1));
  
  let segment: PredictionResult['segment'] = 'Medium Value';
  if (clv > 10000) segment = 'High Value';
  if (clv < 2000) segment = 'Low Value';
  if (churnProbability > 50) segment = 'At Risk';

  const factors = [];
  if (data.supportCalls > 3) factors.push('High volume of support calls');
  if (data.monthlySpend > 200) factors.push('High monthly spending');
  if (data.tenure > 24) factors.push('Long-term loyal customer');

  const recommendations = [];
  if (churnProbability > 40) recommendations.push('Offer a retention discount immediately.');
  if (clv > 5000) recommendations.push('Invite to VIP loyalty program.');
  recommendations.push('Send personalized product recommendations based on purchase history.');

  return {
    clv: parseFloat(clv.toFixed(2)),
    churnProbability,
    segment,
    factors,
    recommendations
  };
};
