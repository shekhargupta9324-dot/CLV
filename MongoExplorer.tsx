import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Database, Layers3, Search, ShieldCheck, Braces, Clock3, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { mongoCollections, MongoExplorerCollection, MongoExplorerSnapshot } from '@/utils/mongoExplorer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function MongoExplorer() {
  const { isAuthenticated, isLoading, checkPermission } = useAuth();
  const [selectedKey, setSelectedKey] = useState(mongoCollections[0].key);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<MongoExplorerSnapshot | null>(null);

  useEffect(() => {
    void loadExplorer();
  }, []);

  const loadExplorer = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('clv_token');
      if (!token) {
        throw new Error('You need to sign in to view the MongoDB explorer.');
      }

      const response = await fetch(`${API_BASE}/mongo/explorer?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        throw new Error(`Failed to load Mongo explorer (${response.status})`);
      }

      const data = (await response.json()) as MongoExplorerSnapshot;
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Mongo explorer');
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  const seedSampleData = async () => {
    setSeedLoading(true);
    try {
      const token = localStorage.getItem('clv_token');
      if (!token) {
        throw new Error('You need to sign in to seed MongoDB.');
      }

      const response = await fetch(`${API_BASE}/mongo/seed-sample?token=${encodeURIComponent(token)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Seed failed (${response.status})`);
      }

      toast.success('MongoDB sample documents seeded');
      await loadExplorer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to seed sample data');
    } finally {
      setSeedLoading(false);
    }
  };

  const explorerCollections: MongoExplorerCollection[] = snapshot?.collections || mongoCollections.map((collection) => ({
    ...collection,
    documentCount: 0,
    previewDocuments: [collection.sampleDocument as Record<string, unknown>],
    storageMode: 'sample',
  }));

  const selectedCollection = explorerCollections.find(item => item.key === selectedKey) || explorerCollections[0];

  const filteredFields = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return selectedCollection.fields;
    return selectedCollection.fields.filter(field =>
      field.name.toLowerCase().includes(term) ||
      field.type.toLowerCase().includes(term) ||
      (field.notes || '').toLowerCase().includes(term)
    );
  }, [query, selectedCollection]);

  const copySchema = async () => {
    await navigator.clipboard.writeText(JSON.stringify(selectedCollection.previewDocuments[0] || selectedCollection.sampleDocument, null, 2));
    setCopied(true);
    toast.success('Sample document copied');
    window.setTimeout(() => setCopied(false), 1500);
  };

  // Block access immediately if user lacks permission
  if (!isLoading && (!isAuthenticated || !checkPermission('view_mongo_explorer'))) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <div className="font-semibold">Access denied</div>
        <div className="mt-2">You do not have permission to view this data page. Only admins and sub-admins can access it.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 lg:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-white/15">
              <Database className="h-3.5 w-3.5" />
              MongoDB Data Explorer
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Define what should live in MongoDB before you wire the database.
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-300">
              This explorer maps the required Mongo-style documents for customers, prediction history, datasets,
              audit logs, benchmarks, and rate limits. Use it as the storage blueprint for the CLV platform.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:min-w-[22rem]">
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-slate-300">Collections</p>
              <p className="mt-1 text-2xl font-bold">{explorerCollections.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-slate-300">Required docs</p>
              <p className="mt-1 text-2xl font-bold">6</p>
            </div>
          </div>
        </div>
      </div>

      {(loading || error || snapshot) && (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" /> : <Database className="h-4 w-4 text-indigo-600" />}
              <p className="font-medium text-slate-900 dark:text-white">
                {loading
                  ? 'Loading MongoDB explorer...'
                  : snapshot?.connected
                    ? `Connected to ${snapshot.databaseName}`
                    : snapshot?.configured
                      ? `MongoDB configured, but not reachable right now (${snapshot.databaseName})`
                      : 'MongoDB not configured yet - showing the explorer blueprint'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void loadExplorer()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Refresh
              </button>
              <button
                onClick={() => void seedSampleData()}
                disabled={seedLoading || !snapshot?.configured}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {seedLoading ? 'Seeding...' : 'Seed sample data'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {snapshot && (
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Database name: <span className="font-mono text-slate-700 dark:text-slate-200">{snapshot.databaseName}</span>
              {' '}| Connection: <span className="font-mono text-slate-700 dark:text-slate-200">{snapshot.connected ? 'live' : 'sample'}</span>
            </div>
          )}
          {snapshot?.error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <div className="font-semibold">MongoDB connection issue</div>
              <div className="mt-1">{snapshot.error}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/70 dark:ring-slate-700">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Layers3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Collections
          </div>
          <div className="mt-4 space-y-2">
            {mongoCollections.map((collection) => {
              const active = collection.key === selectedKey;
              return (
                <button
                  key={collection.key}
                  onClick={() => {
                    setSelectedKey(collection.key);
                    setQuery('');
                  }}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    active
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="text-sm font-semibold">{collection.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{collection.collectionName} · {collection.storageMode}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4 rounded-2xl bg-white/70 p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/70 dark:ring-slate-700">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {selectedCollection.documentShape}
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{selectedCollection.title}</h3>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{selectedCollection.description}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{selectedCollection.purpose}</p>
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                Stored documents: {selectedCollection.documentCount}
              </p>
                {selectedCollection.documentCount === 0 && snapshot?.configured && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    No live documents were returned from this collection yet. Seed sample data or check the configured database name.
                  </p>
                )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/60">
              <p className="font-semibold text-slate-900 dark:text-white">Collection name</p>
              <p className="mt-1 font-mono text-xs text-indigo-700 dark:text-indigo-300">{selectedCollection.collectionName}</p>
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">Recommended indexes</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {selectedCollection.recommendedIndexes.map((index) => (
                  <li key={index} className="font-mono">{index}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Braces className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Required fields
                </div>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter fields"
                    className="w-40 bg-transparent outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {filteredFields.map((field) => (
                  <div key={field.name} className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900 dark:text-white">{field.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${field.required ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {field.required ? 'required' : 'optional'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">{field.type}</p>
                    {field.notes && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{field.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Sample document</p>
                  <button
                    onClick={copySchema}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="mt-3 max-h-[32rem] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
{JSON.stringify(selectedCollection.previewDocuments[0] || selectedCollection.sampleDocument, null, 2)}
                </pre>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Clock3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  When to store
                </div>
                <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
                  <li>• On CSV upload, create a dataset document and normalized customer records.</li>
                  <li>• After prediction runs, append a prediction record per customer or per batch.</li>
                  <li>• On admin actions, write audit events for traceability.</li>
                  <li>• Keep benchmark and rate-limit collections small and index-heavy.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
