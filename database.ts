// Database Types - Simulating PostgreSQL/MongoDB schemas

export interface CustomerRecord {
  id: string;
  externalId?: string;
  name: string;
  email?: string;
  company: string;
  category: string;
  age: number;
  gender: string;
  tenure: number;
  monthlySpend: number;
  totalSpend: number;
  lastPurchaseDate: string;
  supportCalls: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PredictionRecord {
  id: string;
  customerId: string;
  clv: number;
  churnProbability: number;
  segment: string;
  factors: string[];
  recommendations: string[];
  aiInsights?: AIInsight[];
  modelVersion: string;
  createdAt: Date;
  createdBy: string;
}

export interface AIInsight {
  type: 'recommendation' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface DatasetRecord {
  id: string;
  name: string;
  source: string;
  recordCount: number;
  createdAt: Date;
  createdBy: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dataQuality: DataQualityReport;
}

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  missingFields: { field: string; count: number }[];
  duplicates: number;
  outliers: { field: string; count: number }[];
  completenessScore: number;
  accuracyScore: number;
  overallScore: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface RateLimitEntry {
  userId: string;
  endpoint: string;
  count: number;
  windowStart: Date;
  windowEnd: Date;
}

export interface IndustryBenchmark {
  industry: string;
  avgClv: number;
  avgChurnRate: number;
  avgRetentionRate: number;
  avgCustomerTenure: number;
  avgMonthlySpend: number;
  topPerformerClv: number;
  updatedAt: Date;
}
