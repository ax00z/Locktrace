import { Shield, MapPin, BarChart3, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { TheftFilter, ViewMode } from '../types';

export function Header() {
  const { filter, setFilter, viewMode, setViewMode, records, loading, theme, toggleTheme } = useStore();

  const filters: { value: TheftFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'auto', label: 'Auto' },
    { value: 'bike', label: 'Bike' },
  ];

  const views: { value: ViewMode; label: string; Icon: typeof MapPin }[] = [
    { value: 'scatter', label: 'Points', Icon: MapPin },
    { value: 'heatmap', label: 'Heatmap', Icon: BarChart3 },
  ];

  const dark = theme === 'dark';

  return (
    <header className={`border-b shadow-lg ${dark ? 'bg-[#060e1e] border-[#112a4a]' : 'bg-white border-[#d0daea]'}`}>
      <div className="max-w-[1800px] mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-md">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className={`text-base font-bold tracking-tight ${dark ? 'text-white' : 'text-[#0a1628]'}`}>
                Toronto Asset Safety Radar
              </h1>
              {!loading && (
                <span className={`text-[10px] ${dark ? 'text-blue-400/40' : 'text-[#5a7a9a]'}`}>
                  {records.length.toLocaleString()} records · Last 3 months
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex rounded-lg p-0.5 border ${dark ? 'bg-[#0a1628]/80 border-[#112a4a]' : 'bg-[#e8eef6] border-[#d0daea]'}`}>
              {filters.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === opt.value
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : dark ? 'text-blue-300/50 hover:text-white hover:bg-[#112a4a]/60' : 'text-[#5a7a9a] hover:text-[#0a1628] hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className={`flex rounded-lg p-0.5 border ${dark ? 'bg-[#0a1628]/80 border-[#112a4a]' : 'bg-[#e8eef6] border-[#d0daea]'}`}>
              {views.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setViewMode(opt.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === opt.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : dark ? 'text-blue-300/50 hover:text-white hover:bg-[#112a4a]/60' : 'text-[#5a7a9a] hover:text-[#0a1628] hover:bg-white'
                  }`}
                >
                  <opt.Icon className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                dark
                  ? 'bg-[#0a1628]/80 border-[#112a4a] text-blue-300/50 hover:text-amber-300 hover:bg-[#112a4a]'
                  : 'bg-[#e8eef6] border-[#d0daea] text-[#5a7a9a] hover:text-amber-500 hover:bg-white'
              }`}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
