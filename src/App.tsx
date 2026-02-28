import { useEffect, useCallback, useState, useMemo } from 'react';
import { useStore } from './store/useStore';
import { fetchAllData, fetchLiveDataOnly } from './services/dataService';
import { getDemoData } from './services/demoData';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { TheftMap } from './components/TheftMap';
import { Charts } from './components/Charts';
import { RecentIncidents } from './components/RecentIncidents';
import { DetailPanel } from './components/DetailPanel';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { RefreshCw, Wifi, CheckCircle2, XCircle } from 'lucide-react';

export function App() {
  const { loading, error, records, setRecords, setLoading, setError, setDataSource, setLastUpdated, theme } = useStore();

  const [loadingMsg, setLoadingMsg] = useState('Loading...');
  const [isDemo, setIsDemo] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    document.body.style.backgroundColor = theme === 'dark' ? '#040d1a' : '#e8eef6';
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const store = useStore.getState();
      if ((e.matches && store.theme !== 'dark') || (!e.matches && store.theme !== 'light')) {
        store.toggleTheme();
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const dark = theme === 'dark';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg('Fetching data...');

    try {
      const { records: fetched, source } = await fetchAllData();
      if (fetched.length === 0) throw new Error('No records returned');
      setRecords(fetched);
      setDataSource(source);
      setLastUpdated(new Date().toISOString());
      setIsDemo(false);
      setLoading(false);
    } catch {
      setLoadingMsg('Loading demo data...');
      await new Promise((r) => setTimeout(r, 300));
      setRecords(getDemoData());
      setDataSource('live');
      setLastUpdated(new Date().toISOString());
      setIsDemo(true);
      setLoading(false);
    }
  }, [setRecords, setLoading, setError, setDataSource, setLastUpdated]);

  const testLive = useCallback(async () => {
    setTestStatus('testing');
    setTestMsg('');
    try {
      const { records: live } = await fetchLiveDataOnly();
      if (live.length === 0) {
        setTestStatus('error');
        setTestMsg('0 records returned.');
      } else {
        setTestStatus('success');
        setTestMsg(`${live.length.toLocaleString()} records loaded.`);
        setRecords(live);
        setDataSource('live');
        setLastUpdated(new Date().toISOString());
        setIsDemo(false);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [setRecords, setDataSource, setLastUpdated]);

  useEffect(() => { loadData(); }, [loadData]);

  const autoCount = useMemo(() => records.filter(r => r.type === 'auto').length, [records]);
  const bikeCount = useMemo(() => records.filter(r => r.type === 'bike').length, [records]);

  if (loading) return <LoadingScreen message={loadingMsg} />;
  if (error) return <ErrorScreen error={error} onRetry={loadData} />;

  return (
    <div className={`min-h-screen ${dark ? 'theme-dark bg-gradient-to-br from-[#040d1a] via-[#0a1628] to-[#040d1a]' : 'theme-light bg-gradient-to-br from-[#e8eef6] via-[#f0f4fa] to-[#e8eef6]'}`}>
      <Header />

      <main className="max-w-[1800px] mx-auto px-4 py-4 space-y-4">
        <StatsCards />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 h-[500px] lg:h-[600px]">
            <TheftMap />
          </div>

          <div className="space-y-4">
            <StatusPanel dark={dark} isDemo={isDemo} autoCount={autoCount} bikeCount={bikeCount} />
            <LiveTestPanel dark={dark} status={testStatus} message={testMsg} onTest={testLive} />
            <TimeDistribution dark={dark} />
          </div>
        </div>

        <Charts />
        <RecentIncidents />

        <footer className={`text-center py-6 border-t ${dark ? 'border-[#112a4a]' : 'border-[#d0daea]'}`}>
          <p className={`text-xs ${dark ? 'text-blue-400/30' : 'text-[#8aa8c8]'}`}>
            Toronto Asset Safety Radar v2
          </p>
        </footer>
      </main>

      <DetailPanel />
    </div>
  );
}

function StatusPanel({ dark, isDemo, autoCount, bikeCount }: { dark: boolean; isDemo: boolean; autoCount: number; bikeCount: number }) {
  const card = dark ? 'bg-[#0a1628]/60 border-[#112a4a]' : 'bg-white/80 border-[#d0daea]';
  const muted = dark ? 'text-blue-400/30' : 'text-[#8aa8c8]';
  const secondary = dark ? 'text-blue-300/50' : 'text-[#5a7a9a]';

  return (
    <div className={`backdrop-blur border rounded-xl p-4 ${card}`}>
      <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-[#0a1628]'}`}>
        <span className={`w-2 h-2 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
        {isDemo ? 'Demo' : 'Live'}
      </h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] ${muted}`}>Auto</span>
          <span className="text-[10px] text-[#ff6450] font-mono">{autoCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] ${muted}`}>Bike</span>
          <span className="text-[10px] text-[#3cb4f0] font-mono">{bikeCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] ${muted}`}>Window</span>
          <span className={`text-[10px] font-mono ${secondary}`}>6 months</span>
        </div>
      </div>
    </div>
  );
}

function LiveTestPanel({ dark, status, message, onTest }: { dark: boolean; status: string; message: string; onTest: () => void }) {
  const card = dark ? 'bg-[#0a1628]/60 border-[#112a4a]' : 'bg-white/80 border-[#d0daea]';

  return (
    <div className={`backdrop-blur border rounded-xl p-4 ${card}`}>
      <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-[#0a1628]'}`}>
        <Wifi className="w-4 h-4 text-cyan-400" />
        API Test
      </h3>
      <button
        onClick={onTest}
        disabled={status === 'testing'}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'testing'
          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          : <Wifi className="w-3.5 h-3.5" />
        }
        {status === 'testing' ? 'Testing...' : 'Fetch Live'}
      </button>

      {status !== 'idle' && status !== 'testing' && (
        <div className={`mt-3 p-2 rounded-lg border text-[10px] ${
          status === 'success'
            ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
            : 'bg-[#ff6450]/5 border-[#ff6450]/15 text-[#ff6450]'
        }`}>
          <div className="flex items-center gap-2">
            {status === 'success'
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-[#ff6450] shrink-0" />
            }
            <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeDistribution({ dark }: { dark: boolean }) {
  const records = useStore((s) => s.records);
  const filter = useStore((s) => s.filter);
  const filteredRecords = useMemo(
    () => (filter === 'all' ? records : records.filter((r) => r.type === filter)),
    [records, filter]
  );
  const total = Math.max(filteredRecords.length, 1);

  const card = dark ? 'bg-[#0a1628]/60 border-[#112a4a]' : 'bg-white/80 border-[#d0daea]';
  const muted = dark ? 'text-blue-400/30' : 'text-[#8aa8c8]';
  const secondary = dark ? 'text-blue-300/50' : 'text-[#5a7a9a]';
  const barBg = dark ? 'bg-[#112a4a]' : 'bg-[#d0daea]';

  const buckets = {
    'Morning': filteredRecords.filter((r) => r.hour >= 6 && r.hour < 12).length,
    'Afternoon': filteredRecords.filter((r) => r.hour >= 12 && r.hour < 18).length,
    'Evening': filteredRecords.filter((r) => r.hour >= 18 && r.hour < 24).length,
    'Night': filteredRecords.filter((r) => r.hour >= 0 && r.hour < 6).length,
  };

  const colors = ['bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500'];

  return (
    <div className={`backdrop-blur border rounded-xl p-4 ${card}`}>
      <h3 className={`text-sm font-semibold mb-3 ${dark ? 'text-white' : 'text-[#0a1628]'}`}>Time of Day</h3>
      <div className="space-y-2.5">
        {Object.entries(buckets).map(([label, count], i) => {
          const pct = (count / total) * 100;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] ${secondary}`}>{label}</span>
                <span className={`text-[10px] font-mono ${muted}`}>{count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${barBg}`}>
                <div className={`h-full ${colors[i]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
