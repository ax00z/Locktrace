import { Shield, Crosshair, BarChart3, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { TheftFilter, ViewMode } from '../types';

export function Header() {
  const { filter, setFilter, viewMode, setViewMode, records, loading, theme, toggleTheme } = useStore();

  const filters: { value: TheftFilter; label: string }[] = [
    { value: 'all', label: 'ALL' },
    { value: 'auto', label: 'AUTO' },
    { value: 'bike', label: 'BIKE' },
  ];

  const views: { value: ViewMode; label: string; Icon: typeof Crosshair }[] = [
    { value: 'scatter', label: 'NODES', Icon: Crosshair },
    { value: 'heatmap', label: 'MATRIX', Icon: BarChart3 },
  ];

  const dark = theme === 'dark';

  const bg = dark ? 'bg-[#090a0c]' : 'bg-white';
  const border = dark ? 'border-[#22262f]' : 'border-[#e4e4e7]';
  const text = dark ? 'text-[#e2e4e9]' : 'text-[#09090b]';
  const textMuted = dark ? 'text-[#525866]' : 'text-[#a1a1aa]';
  const activeBg = dark ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'bg-[#0055ff] text-white border-[#0055ff]';
  const hoverBg = dark ? 'hover:bg-[#111318]' : 'hover:bg-[#f4f4f5]';

  return (
    <header className={`border-b ${bg} ${border} font-mono uppercase`}>
      <div className="max-w-[1800px] mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 flex items-center justify-center border ${border} ${dark ? 'bg-[#0f1115]' : 'bg-[#f4f4f5]'}`}>
              <Shield className={`w-5 h-5 ${dark ? 'text-[#3b82f6]' : 'text-[#0055ff]'}`} />
            </div>
            <div className="flex flex-col">
              <h1 className={`text-sm font-bold tracking-widest ${text}`}>
                LOCKTRACE
              </h1>
              {!loading && (
                <span className={`text-[10px] tracking-widest ${textMuted} mt-0.5`}>
                  {records.length.toLocaleString()} RECORDS · LAST 6 MONTHS
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex">
              {filters.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-4 py-1.5 text-[10px] font-bold tracking-widest transition-none border-y border-l last:border-r ${
                    filter === opt.value ? activeBg : `${border} ${textMuted} ${hoverBg}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex">
              {views.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setViewMode(opt.value)}
                  className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold tracking-widest transition-none border-y border-l last:border-r ${
                    viewMode === opt.value ? activeBg : `${border} ${textMuted} ${hoverBg}`
                  }`}
                >
                  <opt.Icon className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className={`w-8 h-8 flex items-center justify-center border transition-none ${border} ${textMuted} ${hoverBg}`}
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}