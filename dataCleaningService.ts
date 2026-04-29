// Data Cleaning and Validation Service
// Automatic detection and handling of missing/invalid data

import { DataQualityReport } from '@/types/database';
import { SampleCustomer } from '@/utils/sampleData';
import { z } from 'zod';

// Zod schema for customer data validation
export const CustomerSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  company: z.string().min(1, 'Company is required'),
  category: z.string().min(1, 'Category is required'),
  age: z.number().min(0, 'Age must be positive').max(120, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Other']),
  tenure: z.number().min(0, 'Tenure must be positive'),
  monthlySpend: z.number().min(0, 'Monthly spend must be positive'),
  totalSpend: z.number().min(0, 'Total spend must be positive'),
  lastPurchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  supportCalls: z.number().min(0, 'Support calls must be positive')
});

export type ValidatedCustomer = z.infer<typeof CustomerSchema>;

export interface CleaningResult {
  cleanedData: SampleCustomer[];
  report: DataQualityReport;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  rowIndex: number;
  field: string;
  value: unknown;
  message: string;
}

export interface ValidationWarning {
  rowIndex: number;
  field: string;
  value: unknown;
  message: string;
  autoFixed: boolean;
  newValue?: unknown;
}

// Outlier detection thresholds
const OUTLIER_THRESHOLDS = {
  age: { min: 13, max: 100 },
  monthlySpend: { min: 0, max: 50000 },
  totalSpend: { min: 0, max: 1000000 },
  tenure: { min: 0, max: 240 }, // 20 years max
  supportCalls: { min: 0, max: 100 }
};

// Clean and validate customer data
export function cleanCustomerData(rawData: Partial<SampleCustomer>[]): CleaningResult {
  const cleanedData: SampleCustomer[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFieldsCount: Record<string, number> = {};
  const outlierFieldsCount: Record<string, number> = {};
  let duplicateCount = 0;
  const seenIds = new Set<string>();

  rawData.forEach((row, index) => {
    // Check for duplicates
    if (row.id && seenIds.has(row.id)) {
      duplicateCount++;
      warnings.push({
        rowIndex: index,
        field: 'id',
        value: row.id,
        message: 'Duplicate ID detected',
        autoFixed: true,
        newValue: `${row.id}-dup-${index}`
      });
      row.id = `${row.id}-dup-${index}`;
    }
    if (row.id) seenIds.add(row.id);

    // Clean and validate each field
    const cleanedRow = cleanRow(row, index, errors, warnings, missingFieldsCount, outlierFieldsCount);
    
    if (cleanedRow) {
      cleanedData.push(cleanedRow);
    }
  });

  // Calculate quality scores
  const totalRecords = rawData.length;
  const validRecords = cleanedData.length;
  const invalidRecords = totalRecords - validRecords;
  
  const completenessScore = calculateCompletenessScore(rawData);
  const accuracyScore = calculateAccuracyScore(errors.length, warnings.length, totalRecords);
  const overallScore = (completenessScore + accuracyScore) / 2;

  const report: DataQualityReport = {
    totalRecords,
    validRecords,
    invalidRecords,
    missingFields: Object.entries(missingFieldsCount).map(([field, count]) => ({ field, count })),
    duplicates: duplicateCount,
    outliers: Object.entries(outlierFieldsCount).map(([field, count]) => ({ field, count })),
    completenessScore,
    accuracyScore,
    overallScore
  };

  return { cleanedData, report, errors, warnings };
}

function cleanRow(
  row: Partial<SampleCustomer>,
  index: number,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  missingFields: Record<string, number>,
  outlierFields: Record<string, number>
): SampleCustomer | null {
  const cleaned: Partial<SampleCustomer> = { ...row };

  // ID - Generate if missing
  if (!cleaned.id || cleaned.id.trim() === '') {
    cleaned.id = `auto-${Date.now()}-${index}`;
    missingFields['id'] = (missingFields['id'] || 0) + 1;
    warnings.push({
      rowIndex: index,
      field: 'id',
      value: row.id,
      message: 'Missing ID - auto-generated',
      autoFixed: true,
      newValue: cleaned.id
    });
  }

  // Name - Required
  if (!cleaned.name || cleaned.name.trim() === '') {
    errors.push({
      rowIndex: index,
      field: 'name',
      value: row.name,
      message: 'Name is required and cannot be empty'
    });
    missingFields['name'] = (missingFields['name'] || 0) + 1;
    cleaned.name = 'Unknown Customer';
  }

  // Company - Default if missing
  if (!cleaned.company || cleaned.company.trim() === '') {
    cleaned.company = 'Unknown';
    missingFields['company'] = (missingFields['company'] || 0) + 1;
    warnings.push({
      rowIndex: index,
      field: 'company',
      value: row.company,
      message: 'Missing company - defaulted to "Unknown"',
      autoFixed: true,
      newValue: 'Unknown'
    });
  }

  // Category - Default if missing
  if (!cleaned.category || cleaned.category.trim() === '') {
    cleaned.category = 'General';
    missingFields['category'] = (missingFields['category'] || 0) + 1;
    warnings.push({
      rowIndex: index,
      field: 'category',
      value: row.category,
      message: 'Missing category - defaulted to "General"',
      autoFixed: true,
      newValue: 'General'
    });
  }

  // Age - Validate and fix outliers
  if (cleaned.age === undefined || cleaned.age === null || isNaN(cleaned.age)) {
    cleaned.age = 35; // Default median age
    missingFields['age'] = (missingFields['age'] || 0) + 1;
    warnings.push({
      rowIndex: index,
      field: 'age',
      value: row.age,
      message: 'Missing age - defaulted to 35',
      autoFixed: true,
      newValue: 35
    });
  } else if (cleaned.age < OUTLIER_THRESHOLDS.age.min || cleaned.age > OUTLIER_THRESHOLDS.age.max) {
    outlierFields['age'] = (outlierFields['age'] || 0) + 1;
    const newAge = Math.max(OUTLIER_THRESHOLDS.age.min, Math.min(OUTLIER_THRESHOLDS.age.max, cleaned.age));
    warnings.push({
      rowIndex: index,
      field: 'age',
      value: row.age,
      message: `Age outlier detected (${row.age}) - clamped to ${newAge}`,
      autoFixed: true,
      newValue: newAge
    });
    cleaned.age = newAge;
  }

  // Gender - Normalize
  if (!cleaned.gender) {
    cleaned.gender = 'Other';
    missingFields['gender'] = (missingFields['gender'] || 0) + 1;
  } else {
    const normalizedGender = normalizeGender(cleaned.gender);
    if (normalizedGender !== cleaned.gender) {
      warnings.push({
        rowIndex: index,
        field: 'gender',
        value: row.gender,
        message: `Gender normalized from "${row.gender}" to "${normalizedGender}"`,
        autoFixed: true,
        newValue: normalizedGender
      });
    }
    cleaned.gender = normalizedGender;
  }

  // Tenure - Validate
  if (cleaned.tenure === undefined || cleaned.tenure === null || isNaN(cleaned.tenure)) {
    cleaned.tenure = 1;
    missingFields['tenure'] = (missingFields['tenure'] || 0) + 1;
  } else if (cleaned.tenure < 0) {
    cleaned.tenure = 1;
    outlierFields['tenure'] = (outlierFields['tenure'] || 0) + 1;
  } else if (cleaned.tenure > OUTLIER_THRESHOLDS.tenure.max) {
    outlierFields['tenure'] = (outlierFields['tenure'] || 0) + 1;
    cleaned.tenure = OUTLIER_THRESHOLDS.tenure.max;
  }

  // Monthly Spend - Validate
  if (cleaned.monthlySpend === undefined || cleaned.monthlySpend === null || isNaN(cleaned.monthlySpend)) {
    cleaned.monthlySpend = 0;
    missingFields['monthlySpend'] = (missingFields['monthlySpend'] || 0) + 1;
  } else if (cleaned.monthlySpend < 0) {
    cleaned.monthlySpend = 0;
    outlierFields['monthlySpend'] = (outlierFields['monthlySpend'] || 0) + 1;
  } else if (cleaned.monthlySpend > OUTLIER_THRESHOLDS.monthlySpend.max) {
    outlierFields['monthlySpend'] = (outlierFields['monthlySpend'] || 0) + 1;
    cleaned.monthlySpend = OUTLIER_THRESHOLDS.monthlySpend.max;
  }

  // Total Spend - Validate and recalculate if needed
  if (cleaned.totalSpend === undefined || cleaned.totalSpend === null || isNaN(cleaned.totalSpend)) {
    cleaned.totalSpend = (cleaned.monthlySpend || 0) * (cleaned.tenure || 1);
    missingFields['totalSpend'] = (missingFields['totalSpend'] || 0) + 1;
  } else if (cleaned.totalSpend < 0) {
    cleaned.totalSpend = 0;
    outlierFields['totalSpend'] = (outlierFields['totalSpend'] || 0) + 1;
  }

  // Last Purchase Date - Validate
  if (!cleaned.lastPurchaseDate || !isValidDate(cleaned.lastPurchaseDate)) {
    cleaned.lastPurchaseDate = new Date().toISOString().split('T')[0];
    missingFields['lastPurchaseDate'] = (missingFields['lastPurchaseDate'] || 0) + 1;
    warnings.push({
      rowIndex: index,
      field: 'lastPurchaseDate',
      value: row.lastPurchaseDate,
      message: 'Invalid date - defaulted to today',
      autoFixed: true,
      newValue: cleaned.lastPurchaseDate
    });
  }

  // Support Calls - Validate
  if (cleaned.supportCalls === undefined || cleaned.supportCalls === null || isNaN(cleaned.supportCalls)) {
    cleaned.supportCalls = 0;
    missingFields['supportCalls'] = (missingFields['supportCalls'] || 0) + 1;
  } else if (cleaned.supportCalls < 0) {
    cleaned.supportCalls = 0;
    outlierFields['supportCalls'] = (outlierFields['supportCalls'] || 0) + 1;
  }

  return cleaned as SampleCustomer;
}

function normalizeGender(gender: string): string {
  const normalized = gender.toLowerCase().trim();
  if (['male', 'm', 'man', 'boy'].includes(normalized)) return 'Male';
  if (['female', 'f', 'woman', 'girl'].includes(normalized)) return 'Female';
  return 'Other';
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function calculateCompletenessScore(data: Partial<SampleCustomer>[]): number {
  if (data.length === 0) return 0;
  
  const requiredFields = ['id', 'name', 'company', 'category', 'age', 'gender', 'tenure', 'monthlySpend', 'totalSpend', 'lastPurchaseDate', 'supportCalls'];
  let totalFields = data.length * requiredFields.length;
  let presentFields = 0;
  
  data.forEach(row => {
    requiredFields.forEach(field => {
      const value = row[field as keyof SampleCustomer];
      if (value !== undefined && value !== null && value !== '') {
        presentFields++;
      }
    });
  });
  
  return Math.round((presentFields / totalFields) * 100);
}

function calculateAccuracyScore(errorCount: number, warningCount: number, totalRecords: number): number {
  if (totalRecords === 0) return 0;
  
  const issueWeight = errorCount * 2 + warningCount * 0.5;
  const maxIssues = totalRecords * 11; // 11 fields per record
  const score = Math.max(0, 100 - (issueWeight / maxIssues) * 100);
  
  return Math.round(score);
}

// Parse CSV string into data
export function parseCSV(csvContent: string): Partial<SampleCustomer>[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: Partial<SampleCustomer>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: Partial<SampleCustomer> = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      const key = mapHeaderToField(header);
      
      if (key) {
        if (['age', 'tenure', 'monthlySpend', 'totalSpend', 'supportCalls'].includes(key)) {
          (row as Record<string, unknown>)[key] = parseFloat(value) || 0;
        } else {
          (row as Record<string, unknown>)[key] = value;
        }
      }
    });
    
    data.push(row);
  }
  
  return data;
}

function mapHeaderToField(header: string): keyof SampleCustomer | null {
  const mapping: Record<string, keyof SampleCustomer> = {
    'id': 'id',
    'customer_id': 'id',
    'customerid': 'id',
    'name': 'name',
    'customer_name': 'name',
    'customername': 'name',
    'company': 'company',
    'category': 'category',
    'product_category': 'category',
    'age': 'age',
    'customer_age': 'age',
    'gender': 'gender',
    'sex': 'gender',
    'tenure': 'tenure',
    'months': 'tenure',
    'customer_tenure': 'tenure',
    'monthlyspend': 'monthlySpend',
    'monthly_spend': 'monthlySpend',
    'spend': 'monthlySpend',
    'totalspend': 'totalSpend',
    'total_spend': 'totalSpend',
    'lifetime_spend': 'totalSpend',
    'lastpurchasedate': 'lastPurchaseDate',
    'last_purchase_date': 'lastPurchaseDate',
    'last_purchase': 'lastPurchaseDate',
    'supportcalls': 'supportCalls',
    'support_calls': 'supportCalls',
    'tickets': 'supportCalls'
  };
  
  return mapping[header.toLowerCase()] || null;
}
