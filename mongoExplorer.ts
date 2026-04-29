import { AuditLog, CustomerRecord, DatasetRecord, IndustryBenchmark, PredictionRecord, RateLimitEntry } from '@/types/database';

export interface MongoFieldSpec {
  name: string;
  type: string;
  required: boolean;
  notes?: string;
}

export interface MongoCollectionSpec<T> {
  key: string;
  title: string;
  description: string;
  purpose: string;
  collectionName: string;
  documentShape: string;
  fields: MongoFieldSpec[];
  sampleDocument: T;
  recommendedIndexes: string[];
}

export interface MongoExplorerCollection extends MongoCollectionSpec<unknown> {
  documentCount: number;
  previewDocuments: Record<string, unknown>[];
  storageMode: 'live' | 'sample';
}

export interface MongoExplorerSnapshot {
  connected: boolean;
  configured: boolean;
  databaseUriConfigured?: boolean;
  error?: string | null;
  databaseName: string;
  collections: MongoExplorerCollection[];
}

const now = new Date().toISOString();

export const mongoCollections: MongoCollectionSpec<unknown>[] = [
  {
    key: 'users',
    title: 'Users',
    description: 'A simple list of all users in the system.',
    purpose: 'Let admins and sub-admins review user accounts at a glance.',
    collectionName: 'users',
    documentShape: 'MongoUserRecord',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'role', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'is_verified', type: 'boolean', required: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true },
    ],
    sampleDocument: {
      id: 'user_1001',
      name: 'Super Admin',
      email: 'admin@clv.com',
      role: 'admin',
      status: 'active',
      is_verified: true,
      createdAt: now,
      updatedAt: now,
    },
    recommendedIndexes: ['{ email: 1 }', '{ role: 1 }', '{ status: 1 }'],
  },
  {
    key: 'customers',
    title: 'Customer Records',
    description: 'Stores the normalized customer profile after upload or data import.',
    purpose: 'Source of truth for customer attributes used in CLV and churn analysis.',
    collectionName: 'customer_records',
    documentShape: 'CustomerRecord',
    fields: [
      { name: 'id', type: 'string', required: true, notes: 'Internal document identifier.' },
      { name: 'externalId', type: 'string', required: false, notes: 'Optional source-system id.' },
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string', required: false },
      { name: 'company', type: 'string', required: true },
      { name: 'category', type: 'string', required: true },
      { name: 'age', type: 'number', required: true },
      { name: 'gender', type: 'string', required: true },
      { name: 'tenure', type: 'number', required: true },
      { name: 'monthlySpend', type: 'number', required: true },
      { name: 'totalSpend', type: 'number', required: true },
      { name: 'lastPurchaseDate', type: 'string (ISO date)', required: true },
      { name: 'supportCalls', type: 'number', required: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true },
      { name: 'createdBy', type: 'string', required: true },
    ],
    sampleDocument: {
      id: 'cust_1001',
      externalId: 'AMZ-88421',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      company: 'Amazon',
      category: 'Electronics',
      age: 34,
      gender: 'Male',
      tenure: 18,
      monthlySpend: 420.5,
      totalSpend: 7569,
      lastPurchaseDate: '2026-04-18',
      supportCalls: 2,
      createdAt: now,
      updatedAt: now,
      createdBy: 'admin@test.com',
    } as CustomerRecord,
    recommendedIndexes: ['{ company: 1, category: 1 }', '{ createdBy: 1, createdAt: -1 }', '{ externalId: 1 }'],
  },
  {
    key: 'predictions',
    title: 'Prediction Records',
    description: 'Stores every CLV/churn prediction generated for a customer or batch run.',
    purpose: 'Historical prediction audit trail and model performance analysis.',
    collectionName: 'prediction_records',
    documentShape: 'PredictionRecord',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'customerId', type: 'string', required: true },
      { name: 'clv', type: 'number', required: true },
      { name: 'churnProbability', type: 'number', required: true },
      { name: 'segment', type: 'string', required: true },
      { name: 'factors', type: 'string[]', required: true },
      { name: 'recommendations', type: 'string[]', required: true },
      { name: 'aiInsights', type: 'AIInsight[]', required: false, notes: 'Optional embedded insights.' },
      { name: 'modelVersion', type: 'string', required: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'createdBy', type: 'string', required: true },
    ],
    sampleDocument: {
      id: 'pred_5001',
      customerId: 'cust_1001',
      clv: 8420.55,
      churnProbability: 18.4,
      segment: 'High Value',
      factors: ['High tenure', 'Strong monthly spend', 'Low support calls'],
      recommendations: ['Offer loyalty reward', 'Upsell premium bundle'],
      aiInsights: [],
      modelVersion: 'xgboost-v1.2.0',
      createdAt: now,
      createdBy: 'system',
    } as PredictionRecord,
    recommendedIndexes: ['{ customerId: 1 }', '{ createdAt: -1 }', '{ segment: 1, createdAt: -1 }'],
  },
  {
    key: 'datasets',
    title: 'Dataset Records',
    description: 'Tracks uploaded datasets and generated sample datasets.',
    purpose: 'Dataset lifecycle, quality status, and ownership tracking.',
    collectionName: 'dataset_records',
    documentShape: 'DatasetRecord',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'source', type: 'string', required: true },
      { name: 'recordCount', type: 'number', required: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'createdBy', type: 'string', required: true },
      { name: 'status', type: 'pending | processing | completed | failed', required: true },
      { name: 'dataQuality', type: 'DataQualityReport', required: true },
    ],
    sampleDocument: {
      id: 'ds_20260429_01',
      name: 'Amazon Customer Upload',
      source: 'Amazon CSV upload',
      recordCount: 100,
      createdAt: now,
      createdBy: 'analyst@test.com',
      status: 'completed',
      dataQuality: {
        totalRecords: 100,
        validRecords: 97,
        invalidRecords: 3,
        missingFields: [{ field: 'email', count: 5 }],
        duplicates: 1,
        outliers: [{ field: 'monthlySpend', count: 2 }],
        completenessScore: 96,
        accuracyScore: 94,
        overallScore: 95,
      },
    } as DatasetRecord,
    recommendedIndexes: ['{ status: 1, createdAt: -1 }', '{ createdBy: 1 }', '{ source: 1 }'],
  },
  {
    key: 'audit',
    title: 'Audit Logs',
    description: 'Captures user actions across uploads, predictions, and admin events.',
    purpose: 'Traceability, security reviews, and operational debugging.',
    collectionName: 'audit_logs',
    documentShape: 'AuditLog',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'userId', type: 'string', required: true },
      { name: 'action', type: 'string', required: true },
      { name: 'resource', type: 'string', required: true },
      { name: 'resourceId', type: 'string', required: false },
      { name: 'details', type: 'object', required: false },
      { name: 'ipAddress', type: 'string', required: false },
      { name: 'userAgent', type: 'string', required: false },
      { name: 'timestamp', type: 'date', required: true },
    ],
    sampleDocument: {
      id: 'audit_9001',
      userId: 'user_12',
      action: 'run_prediction',
      resource: 'prediction_batch',
      resourceId: 'pred_5001',
      details: { rows: 100, engine: 'ml' },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      timestamp: now,
    } as AuditLog,
    recommendedIndexes: ['{ userId: 1, timestamp: -1 }', '{ resource: 1, timestamp: -1 }', '{ timestamp: -1 }'],
  },
  {
    key: 'benchmarks',
    title: 'Industry Benchmarks',
    description: 'Stores benchmark values for different industries and time periods.',
    purpose: 'Compare predicted performance against industry standards.',
    collectionName: 'industry_benchmarks',
    documentShape: 'IndustryBenchmark',
    fields: [
      { name: 'industry', type: 'string', required: true },
      { name: 'avgClv', type: 'number', required: true },
      { name: 'avgChurnRate', type: 'number', required: true },
      { name: 'avgRetentionRate', type: 'number', required: true },
      { name: 'avgCustomerTenure', type: 'number', required: true },
      { name: 'avgMonthlySpend', type: 'number', required: true },
      { name: 'topPerformerClv', type: 'number', required: true },
      { name: 'updatedAt', type: 'date', required: true },
    ],
    sampleDocument: {
      industry: 'E-commerce',
      avgClv: 6400,
      avgChurnRate: 24,
      avgRetentionRate: 76,
      avgCustomerTenure: 22,
      avgMonthlySpend: 310,
      topPerformerClv: 18200,
      updatedAt: now,
    } as IndustryBenchmark,
    recommendedIndexes: ['{ industry: 1, updatedAt: -1 }'],
  },
  {
    key: 'rateLimits',
    title: 'Rate Limit Counters',
    description: 'Tracks API usage per user and endpoint to protect model requests.',
    purpose: 'Throttle expensive prediction requests and enforce fairness.',
    collectionName: 'rate_limit_entries',
    documentShape: 'RateLimitEntry',
    fields: [
      { name: 'userId', type: 'string', required: true },
      { name: 'endpoint', type: 'string', required: true },
      { name: 'count', type: 'number', required: true },
      { name: 'windowStart', type: 'date', required: true },
      { name: 'windowEnd', type: 'date', required: true },
    ],
    sampleDocument: {
      userId: 'user_12',
      endpoint: '/ml/predict',
      count: 4,
      windowStart: now,
      windowEnd: now,
    } as RateLimitEntry,
    recommendedIndexes: ['{ userId: 1, endpoint: 1 }', '{ windowEnd: 1 }'],
  },
];
