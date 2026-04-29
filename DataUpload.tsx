import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, CheckCircle, TrendingUp, FileSpreadsheet, AlertTriangle, RefreshCw, Cpu, Sparkles, ChevronDown } from 'lucide-react';
import { generateDataset, downloadCSV, SampleCustomer } from '@/utils/sampleData';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { usePrediction } from '@/context/PredictionContext';
import { ML_MODELS, MLModelId } from '@/services/mlService';

const companies = ['Amazon', 'Flipkart', 'Tata', 'BMW', 'Tesla'] as const;

// Field mapping for various column name formats
const fieldMappings: Record<string, string> = {
  // ID mappings
  'id': 'id',
  'customer_id': 'id',
  'customerid': 'id',
  'customer id': 'id',
  'cust_id': 'id',
  'custid': 'id',
  
  // Name mappings
  'name': 'name',
  'customer_name': 'name',
  'customername': 'name',
  'customer name': 'name',
  'full_name': 'name',
  'fullname': 'name',
  
  // Age mappings
  'age': 'age',
  'customer_age': 'age',
  'customerage': 'age',
  
  // Gender mappings
  'gender': 'gender',
  'sex': 'gender',
  
  // Company mappings
  'company': 'company',
  'brand': 'company',
  'source': 'company',
  
  // Category mappings
  'category': 'category',
  'product_category': 'category',
  'productcategory': 'category',
  'segment': 'category',
  'customer_segment': 'category',
  
  // Tenure mappings
  'tenure': 'tenure',
  'account_age': 'tenure',
  'accountage': 'tenure',
  'months_active': 'tenure',
  'monthsactive': 'tenure',
  'customer_tenure': 'tenure',
  
  // Monthly spend mappings
  'monthlyspend': 'monthlySpend',
  'monthly_spend': 'monthlySpend',
  'monthly spend': 'monthlySpend',
  'avg_monthly_spend': 'monthlySpend',
  'avgmonthlyspend': 'monthlySpend',
  'monthly_revenue': 'monthlySpend',
  
  // Total spend mappings
  'totalspend': 'totalSpend',
  'total_spend': 'totalSpend',
  'total spend': 'totalSpend',
  'revenue': 'totalSpend',
  'total_revenue': 'totalSpend',
  'lifetime_spend': 'totalSpend',
  'lifetimespend': 'totalSpend',
  'total_purchases': 'totalSpend',
  
  // Last purchase date mappings
  'lastpurchasedate': 'lastPurchaseDate',
  'last_purchase_date': 'lastPurchaseDate',
  'last purchase date': 'lastPurchaseDate',
  'lastpurchase': 'lastPurchaseDate',
  'last_purchase': 'lastPurchaseDate',
  'last purchase': 'lastPurchaseDate',
  'days_since_purchase': 'lastPurchaseDate',
  'dayssincepurchase': 'lastPurchaseDate',
  'recency': 'lastPurchaseDate',
  
  // Support calls mappings
  'supportcalls': 'supportCalls',
  'support_calls': 'supportCalls',
  'support calls': 'supportCalls',
  'tickets': 'supportCalls',
  'support_tickets': 'supportCalls',
  'supporttickets': 'supportCalls',
  'complaints': 'supportCalls',
};

interface ParsedRow {
  [key: string]: string | number;
}

interface UploadWarning {
  row: number;
  field: string;
  message: string;
}

export function DataUpload() {
  const navigate = useNavigate();
  const { predictionEngine, setPredictionEngine, selectedMLModel, setSelectedMLModel } = usePrediction();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewData, setPreviewData] = useState<SampleCustomer[]>([]);
  const [fullDataset, setFullDataset] = useState<SampleCustomer[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [uploadWarnings, setUploadWarnings] = useState<UploadWarning[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const normalizeFieldName = (field: string): string => {
    const normalized = field.toLowerCase().trim();
    return fieldMappings[normalized] || normalized;
  };

  const parseNumeric = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    // Remove currency symbols, commas, and spaces
    const cleaned = value.toString().replace(/[$€£,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const normalizeGender = (value: string | undefined | null): string => {
    if (!value) return 'Male';
    const normalized = value.toString().toLowerCase().trim();
    if (['f', 'female', 'woman', 'w'].includes(normalized)) return 'Female';
    if (['o', 'other', 'non-binary', 'nonbinary'].includes(normalized)) return 'Other';
    return 'Male';
  };

  const generateId = (index: number, existingId?: string | number): string => {
    if (existingId && existingId.toString().trim()) {
      return existingId.toString();
    }
    return `CUST-${String(index + 1).padStart(4, '0')}`;
  };

  const generateName = (index: number, existingName?: string): string => {
    if (existingName && existingName.trim()) {
      return existingName;
    }
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Emma'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor'];
    return `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
  };

  const generateLastPurchaseDate = (value?: string | number): string => {
    if (value && typeof value === 'string' && value.includes('-')) {
      return value; // Already a date string
    }
    // If it's a number (days since purchase), convert to date
    if (value && typeof value === 'number') {
      const date = new Date(Date.now() - value * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
    // Generate random date within last 30 days
    const randomDays = Math.floor(Math.random() * 30);
    const date = new Date(Date.now() - randomDays * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  const processFile = useCallback((file: File) => {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!['csv', 'txt'].includes(fileExtension || '')) {
      toast.error('Please upload a CSV file (.csv)');
      return;
    }

    setUploadStatus('uploading');
    setUploadWarnings([]);
    setUploadedFileName(fileName);
    const loadingToast = toast.loading('Parsing file...');

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        toast.dismiss(loadingToast);
        
        if (results.errors.length > 0) {
          console.error('Parse errors:', results.errors);
          toast.error(`Parse error: ${results.errors[0].message}`);
          setUploadStatus('error');
          return;
        }

        const rawData = results.data;
        
        if (rawData.length === 0) {
          toast.error('No data found in file');
          setUploadStatus('error');
          return;
        }

        // Get headers and map them
        const originalHeaders = Object.keys(rawData[0]);
        const headerMap: Record<string, string> = {};
        originalHeaders.forEach(header => {
          headerMap[header] = normalizeFieldName(header);
        });

        console.log('Original headers:', originalHeaders);
        console.log('Header mapping:', headerMap);
        console.log('Sample raw row:', rawData[0]);

        const warnings: UploadWarning[] = [];
        const processedData: SampleCustomer[] = [];

        rawData.forEach((row, index) => {
          // Create normalized row
          const normalizedRow: Record<string, string | number> = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = headerMap[key];
            normalizedRow[normalizedKey] = row[key];
          });

          try {
            // Extract and validate each field with intelligent defaults
            const age = parseNumeric(normalizedRow.age);
            const tenure = parseNumeric(normalizedRow.tenure) || Math.floor(Math.random() * 48) + 1;
            const monthlySpend = parseNumeric(normalizedRow.monthlySpend) || Math.floor(Math.random() * 500) + 50;
            const totalSpend = parseNumeric(normalizedRow.totalSpend) || monthlySpend * tenure;
            const supportCalls = parseNumeric(normalizedRow.supportCalls) || Math.floor(Math.random() * 5);

            // Validate and warn about suspicious data
            if (age <= 0 || age > 120) {
              warnings.push({ row: index + 2, field: 'age', message: `Invalid age (${age}), using random value` });
            }

            if (monthlySpend <= 0) {
              warnings.push({ row: index + 2, field: 'monthlySpend', message: `Invalid monthly spend, using random value` });
            }

            const customer: SampleCustomer = {
              id: generateId(index, normalizedRow.id as string),
              name: generateName(index, normalizedRow.name as string),
              age: age > 0 && age <= 120 ? age : Math.floor(Math.random() * 50) + 20,
              gender: normalizeGender(normalizedRow.gender as string),
              company: (normalizedRow.company as string) || fileName.replace(/\.[^/.]+$/, ''),
              category: (normalizedRow.category as string) || 'General',
              tenure: tenure > 0 ? tenure : Math.floor(Math.random() * 48) + 1,
              monthlySpend: monthlySpend > 0 ? monthlySpend : Math.floor(Math.random() * 500) + 50,
              totalSpend: totalSpend > 0 ? totalSpend : monthlySpend * tenure,
              lastPurchaseDate: generateLastPurchaseDate(normalizedRow.lastPurchaseDate as string | number),
              supportCalls: supportCalls >= 0 ? supportCalls : 0,
            };

            processedData.push(customer);
          } catch (err) {
            console.error(`Error processing row ${index + 2}:`, err);
            warnings.push({ row: index + 2, field: 'general', message: `Failed to process row` });
          }
        });

        setUploadWarnings(warnings);

        if (processedData.length === 0) {
          toast.error('No valid data could be processed from file');
          setUploadStatus('error');
          return;
        }

        setFullDataset(processedData);
        setPreviewData(processedData.slice(0, 5));
        setSelectedCompany(fileName.replace(/\.[^/.]+$/, ''));
        setUploadStatus('success');

        if (warnings.length > 0) {
          toast.success(`Processed ${processedData.length} records with ${warnings.length} auto-corrections`);
        } else {
          toast.success(`Successfully processed ${processedData.length} records!`);
        }

        console.log('Processed data sample:', processedData[0]);
      },
      error: (error: Error) => {
        toast.dismiss(loadingToast);
        toast.error(`Failed to parse file: ${error.message}`);
        setUploadStatus('error');
      }
    });
  }, []);

  const resetUpload = () => {
    setUploadStatus('idle');
    setPreviewData([]);
    setFullDataset([]);
    setSelectedCompany('');
    setUploadWarnings([]);
    setUploadedFileName('');
  };

  const handleGenerateAndDownload = (company: typeof companies[number]) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          const data = generateDataset(company);
          downloadCSV(data, `${company}_Customer_Data.csv`);
          setFullDataset(data);
          setPreviewData(data.slice(0, 5));
          setSelectedCompany(company);
          setUploadStatus('success');
          resolve(true);
        }, 800);
      }),
      {
        loading: `Generating ${company} dataset...`,
        success: `${company} dataset generated & downloaded!`,
        error: 'Error generating dataset',
      }
    );
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Data Upload & Management</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Upload your customer data or generate sample datasets for testing.</p>
      </div>

      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Upload Section */}
        <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Upload Your Dataset</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Upload a CSV file with customer data for CLV prediction
          </p>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-4 sm:mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 sm:px-6 py-8 sm:py-10 transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : uploadStatus === 'error'
                ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                : 'border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/50'
            }`}
          >
            {uploadStatus === 'success' && fullDataset.length > 0 ? (
              <div className="text-center">
                <CheckCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
                <p className="mt-3 sm:mt-4 text-sm font-medium text-slate-900 dark:text-white">
                  {uploadedFileName || 'File'} uploaded successfully!
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {fullDataset.length} records ready for prediction
                </p>
                <button 
                  onClick={resetUpload}
                  className="mt-3 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Upload another file
                </button>
              </div>
            ) : uploadStatus === 'uploading' ? (
              <div className="text-center">
                <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                <p className="mt-3 sm:mt-4 text-sm text-indigo-600 dark:text-indigo-400">
                  Processing file...
                </p>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="text-center">
                <AlertTriangle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
                <p className="mt-3 sm:mt-4 text-sm text-red-600 dark:text-red-400">
                  Failed to process file
                </p>
                <button 
                  onClick={resetUpload}
                  className="mt-3 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Try again
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
                <div className="mt-3 sm:mt-4 flex flex-wrap justify-center text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500 dark:bg-transparent dark:text-indigo-400"
                  >
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept=".csv,.txt"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-500 mt-1">CSV files up to 10MB</p>
              </div>
            )}
          </div>

          {/* CSV Format Helper */}
          <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Expected CSV columns:</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              id, name, age, gender, company, category, tenure, monthlySpend, totalSpend, lastPurchaseDate, supportCalls
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Column names are flexible - we auto-detect variations like "customer_id", "total_spend", etc.
            </p>
          </div>
        </div>

        {/* Sample Datasets Section */}
        <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Sample Datasets</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generate and download synthetic data for testing the AI model.
          </p>

          <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {companies.map((company) => (
              <button
                key={company}
                onClick={() => handleGenerateAndDownload(company)}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 sm:p-4 text-left hover:bg-slate-50 hover:border-indigo-300 transition-all dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <div className="flex items-center">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="ml-2 sm:ml-3 text-sm sm:text-base font-medium text-slate-900 dark:text-white">{company}</span>
                </div>
                <Download className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center">
            Each dataset contains 100 synthetic customer records
          </p>
        </div>
      </div>

      {/* Upload Warnings */}
      {uploadWarnings.length > 0 && (
        <div className="rounded-xl bg-yellow-50 p-4 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:ring-yellow-800">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {uploadWarnings.length} auto-corrections applied
              </h3>
              <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 max-h-32 overflow-y-auto space-y-1">
                {uploadWarnings.slice(0, 10).map((warning, index) => (
                  <p key={index}>Row {warning.row}: {warning.message}</p>
                ))}
                {uploadWarnings.length > 10 && (
                  <p className="font-medium">...and {uploadWarnings.length - 10} more</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Engine Selector ─────────────────────────────────────────── */}
      {previewData.length > 0 && (
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1">Choose Prediction Engine</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Select how you'd like to analyse your customer data.</p>

          {/* Engine toggle cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Gemini AI */}
            <button
              id="engine-gemini"
              onClick={() => setPredictionEngine('gemini')}
              className={`relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                predictionEngine === 'gemini'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                  : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700'
              }`}
            >
              {predictionEngine === 'gemini' && (
                <span className="absolute top-2 right-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">Selected</span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold text-slate-900 dark:text-white">Gemini AI</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">LLM-powered predictions with contextual reasoning and natural language insights.</p>
            </button>

            {/* Traditional ML */}
            <button
              id="engine-ml"
              onClick={() => setPredictionEngine('ml')}
              className={`relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                predictionEngine === 'ml'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                  : 'border-slate-200 hover:border-violet-300 dark:border-slate-700'
              }`}
            >
              {predictionEngine === 'ml' && (
                <span className="absolute top-2 right-2 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">Selected</span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-5 w-5 text-violet-500" />
                <span className="font-semibold text-slate-900 dark:text-white">Traditional ML</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Classical algorithms — XGBoost, Random Forest, Neural Network. Trained on your data.</p>
            </button>
          </div>

          {/* Model selector — only shown when ML is chosen */}
          {predictionEngine === 'ml' && (
            <div className="mt-2 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Algorithm</label>
              <div className="relative">
                <select
                  id="ml-model-select"
                  value={selectedMLModel}
                  onChange={e => setSelectedMLModel(e.target.value as MLModelId)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {ML_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.icon} {m.name} — {m.badge}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>

              {/* Model info card */}
              {(() => {
                const meta = ML_MODELS.find(m => m.id === selectedMLModel)!;
                return (
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-900/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="font-medium text-sm text-violet-900 dark:text-violet-300">{meta.name}</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: meta.badgeColor + '22', color: meta.badgeColor }}>{meta.badge}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{meta.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {meta.pros.map(p => (
                        <span key={p} className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-slate-600 dark:text-slate-300">✓ {p}</span>
                      ))}
                      <span className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-400">⏱ {meta.speed}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Data Preview */}
      {previewData.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden dark:bg-slate-800 dark:ring-slate-700">
          <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 dark:border-slate-700">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Preview: {selectedCompany} Dataset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fullDataset.length} total records loaded
              </p>
            </div>
            <button
              onClick={() => navigate('/prediction', { state: { dataset: fullDataset, source: selectedCompany, engine: predictionEngine, mlModel: selectedMLModel } })}
              className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 w-full sm:w-auto"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Run Prediction on {fullDataset.length} Records
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">ID</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Name</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden sm:table-cell">Age</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden md:table-cell">Category</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Total Spend</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400 hidden lg:table-cell">Tenure</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-800 dark:divide-slate-700">
                {previewData.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-300">{row.id}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900 dark:text-white">{row.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{row.age}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">{row.category}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-white">${row.totalSpend.toLocaleString()}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{row.tenure} mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:bg-slate-900/50 dark:border-slate-700">
            <p className="text-xs text-slate-500">Showing first 5 rows of {fullDataset.length} records. Click "Run Prediction" to analyze all data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
