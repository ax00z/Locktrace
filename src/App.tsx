import { useEffect, useCallback, useState } from 'react';
import { useStore } from './store/useStore';
import { fetchAllData } from './services/dataService';
import { getDemoData } from './services/demoData';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { TheftMap } from './components/TheftMap';
import { Charts } from './components/Charts';
import { RecentIncidents } from './components/RecentIncidents';
import { DetailPanel } from './components/DetailPanel';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';

export function App() {
  const {
    loading, error,
    setRecords, setLoading, setError,
    setDataSource, setLastUpdated,
  } = useStore();

  const [loadingMsg, setLoadingMsg] = useState('Initializing radar systems...');
  const [usedDemo, setUsedDemo] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg('Connecting to data sources...');

    try {
      setLoadingMsg('Fetching static data files...');
      const { records, source } = await fetchAllData();
      setRecords(records);
      setDataSource(source);
      setLastUpdated(new Date().toISOString());
      setLoadingMsg('Rendering visualization...');
      // small delay for UI to update
      await new Promise((r) => setTimeout(r, 300));
      setLoading(false);
    } catch {
      // Use demo data as ultimate fallback
      setLoadingMsg('API unavailable, loading demo data...');
      await new Promise((r) => setTimeout(r, 500));
      const demoRecords = getDemoData();
      setRecords(demoRecords);
      setDataSource('live');
      setLastUpdated(new Date().toISOString());
      setUsedDemo(true);
      setLoading(false);
    }
  }, [setRecords, setLoading, setError, setDataSource, setLastUpdated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingScreen message={loadingMsg} />;
  if (error) return <ErrorScreen error={error} onRetry={loadData} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      {/* Demo mode banner */}
      {usedDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="max-w-[1800px] mx-auto flex items-center justify-center gap-2">
            <span className="text-amber-400 text-xs">⚠️</span>
            <p className="text-xs text-amber-300">
              <span className="font-semibold">Demo Mode:</span> Showing simulated data. Live API may be blocked by CORS policy in browsers. Deploy with the Python scraper for real data.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-[1800px] mx-auto px-4 py-4 space-y-4">
        {/* Stats Cards */}
        <StatsCards />

        {/* Map + Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Map - takes 2/3 */}
          <div className="xl:col-span-2 h-[500px] lg:h-[600px]">
            <TheftMap />
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                System Status
              </h3>
              <div className="space-y-2">
                <StatusRow label="Data Pipeline" status="operational" />
                <StatusRow label="Map Renderer" status="operational" />
                <StatusRow label="Analytics Engine" status="operational" />
                <StatusRow
                  label="Live API"
                  status={usedDemo ? 'fallback' : 'operational'}
                />
              </div>
            </div>

            {/* Quick insights */}
            <QuickInsights />
          </div>
        </div>

        {/* Charts */}
        <Charts />

        {/* Recent Incidents Table */}
        <RecentIncidents />

        {/* Footer */}
        <footer className="text-center py-6 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Toronto Asset Safety Radar v2 • Data from Toronto Police Service Open Data
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Built with React + Canvas • Decoupled Analytics Architecture
          </p>
        </footer>
      </main>

      {/* Detail modal */}
      <DetailPanel />
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: 'operational' | 'fallback' | 'error' }) {
  const colors = {
    operational: 'bg-green-400',
    fallback: 'bg-amber-400',
    error: 'bg-red-400',
  };
  const labels = {
    operational: 'Operational',
    fallback: 'Demo Fallback',
    error: 'Error',
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${colors[status]}`} />
        <span className={`text-[10px] ${status === 'operational' ? 'text-green-400' : status === 'fallback' ? 'text-amber-400' : 'text-red-400'}`}>
          {labels[status]}
        </span>
      </div>
    </div>
  );
}

function QuickInsights() {
  const filteredRecords = useStore((s) => s.filteredRecords());

  // Time-of-day breakdown
  const timeBreakdown = {
    morning: filteredRecords.filter((r) => r.hour >= 6 && r.hour < 12).length,
    afternoon: filteredRecords.filter((r) => r.hour >= 12 && r.hour < 18).length,
    evening: filteredRecords.filter((r) => r.hour >= 18 && r.hour < 24).length,
    night: filteredRecords.filter((r) => r.hour >= 0 && r.hour < 6).length,
  };
  const total = Math.max(filteredRecords.length, 1);

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">⏰ Time Distribution</h3>
      <div className="space-y-2.5">
        <TimeBar label="🌅 Morning (6-12)" count={timeBreakdown.morning} total={total} color="bg-amber-500" />
        <TimeBar label="☀️ Afternoon (12-18)" count={timeBreakdown.afternoon} total={total} color="bg-orange-500" />
        <TimeBar label="🌆 Evening (18-24)" count={timeBreakdown.evening} total={total} color="bg-red-500" />
        <TimeBar label="🌙 Night (0-6)" count={timeBreakdown.night} total={total} color="bg-indigo-500" />
      </div>
    </div>
  );
}

function TimeBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = (count / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-500 font-mono">{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
