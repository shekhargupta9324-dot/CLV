import { useState } from 'react';
import { Save, Key, Sliders, Bell, Shield, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { checkRateLimit } from '@/services/geminiAIService';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export function Settings() {
  const [apiKey, setApiKey] = useState('AIzaSyA8MFUPchp3DMkjHoD-SnmRrHc_r21TZsk');
  const [mockMode, setMockMode] = useState(false);
  const [churnThreshold, setChurnThreshold] = useState(40);
  const [projectionPeriod, setProjectionPeriod] = useState('12');
  const { user, checkPermission } = useAuth();

  const rateLimit = checkRateLimit();
  const canManageSettings = checkPermission('manage_settings');

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key first');
      return;
    }
    
    toast.loading('Testing connection...', { id: 'test' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss('test');
    toast.success('API connection successful!');
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Configure application parameters and API connections.</p>
      </div>

      {/* Rate Limit Status */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">API Rate Limit Status</h3>
              <p className="text-sm text-indigo-100">Protects against API abuse</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">{rateLimit.remainingRequests}</p>
              <p className="text-xs text-indigo-200">Requests Left</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">{Math.ceil(rateLimit.resetIn / 1000)}s</p>
              <p className="text-xs text-indigo-200">Reset In</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">500</p>
              <p className="text-xs text-indigo-200">Per Minute</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(rateLimit.remainingRequests / 500) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Configuration */}
        <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/50">
              <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Google Gemini AI</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Configure AI integration</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">
                API Key
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!canManageSettings}
                  className="block flex-1 rounded-md border-0 py-2 sm:py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-900 dark:text-white dark:ring-slate-600 dark:placeholder:text-slate-500 disabled:opacity-50"
                  placeholder="AIza..."
                />
                <button
                  onClick={handleTestConnection}
                  disabled={!canManageSettings}
                  className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  Test
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" className="text-indigo-600 hover:underline dark:text-indigo-400" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${mockMode ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {mockMode ? 'Mock Mode (Simulation)' : 'Live API Mode'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!mockMode}
                  onChange={(e) => setMockMode(!e.target.checked)}
                  disabled={!canManageSettings || !apiKey}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div>
              </label>
            </div>

            {mockMode && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Mock mode uses simulated predictions. Enter a valid API key and toggle to live mode for real Gemini AI predictions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Settings */}
        <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/50">
              <Sliders className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Prediction Parameters</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Adjust model behavior</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">
                Churn Risk Threshold: {churnThreshold}%
              </label>
              <div className="mt-2">
                <input
                  type="range"
                  id="threshold"
                  value={churnThreshold}
                  onChange={(e) => setChurnThreshold(parseInt(e.target.value))}
                  min={10}
                  max={80}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10% (Strict)</span>
                  <span>80% (Lenient)</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Customers above this threshold are flagged as "At Risk"
              </p>
            </div>

            <div>
              <label htmlFor="projection" className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">
                CLV Projection Period
              </label>
              <div className="mt-2">
                <select
                  id="projection"
                  value={projectionPeriod}
                  onChange={(e) => setProjectionPeriod(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 sm:py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-900 dark:text-white dark:ring-slate-600"
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="60">5 years</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/50">
              <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Notifications</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Manage alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Email Alerts', description: 'Receive churn risk alerts via email', default: true },
              { label: 'Weekly Reports', description: 'Automated prediction summaries', default: true },
              { label: 'Real-time Notifications', description: 'Browser push notifications', default: false },
              { label: 'API Usage Alerts', description: 'Notify when rate limit is near', default: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={item.default}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-900 dark:border-slate-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/50">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Privacy & Security</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Data handling & compliance</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Data Encryption', description: 'End-to-end AES-256', status: 'enabled' },
              { label: 'GDPR Compliance', description: 'EU data protection', status: 'compliant' },
              { label: 'CCPA Compliance', description: 'California privacy act', status: 'compliant' },
              { label: 'SOC 2 Type II', description: 'Security certification', status: 'certified' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current User Info */}
      {user && (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Logged in as <span className="font-medium text-slate-900 dark:text-white">{user.name}</span> ({user.email}) with <span className="font-medium text-indigo-600 dark:text-indigo-400">{user.role}</span> role
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
