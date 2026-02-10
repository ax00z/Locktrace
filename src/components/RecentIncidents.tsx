import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';

const PER_PAGE = 10;

export function RecentIncidents() {
  const filteredRecords = useStore((s) => s.filteredRecords());
  const setSelectedRecord = useStore((s) => s.setSelectedRecord);
  const dark = useStore((s) => s.theme === 'dark');
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () => [...filteredRecords].sort((a, b) =>
      new Date(b.year, b.month - 1, b.day, b.hour).getTime()
      - new Date(a.year, a.month - 1, a.day, a.hour).getTime()
    ),
    [filteredRecords]
  );

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const rows = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const borderColor = dark ? 'border-[#112a4a]' : 'border-[#d0daea]';
  const headerBg = dark ? 'bg-[#0a1628]/80' : 'bg-[#e8eef6]/80';
  const muted = dark ? 'text-blue-400/40' : 'text-[#8aa8c8]';
  const secondary = dark ? 'text-blue-300/50' : 'text-[#5a7a9a]';
  const primary = dark ? 'text-blue-200/70' : 'text-[#2a4a6a]';

  return (
    <div className={`backdrop-blur border rounded-xl overflow-hidden ${dark ? 'bg-[#0a1628]/60 border-[#112a4a]' : 'bg-white/80 border-[#d0daea]'}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-cyan-400" />
          <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#0a1628]'}`}>Recent</h3>
          <span className={`text-[10px] ${muted}`}>{sorted.length.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className={`w-6 h-6 rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${dark ? 'text-blue-300/50 hover:text-white hover:bg-[#112a4a]' : 'text-[#5a7a9a] hover:text-[#0a1628] hover:bg-[#e8eef6]'}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className={`text-[10px] font-mono ${muted}`}>
            {page + 1}/{Math.max(totalPages, 1)}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className={`w-6 h-6 rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${dark ? 'text-blue-300/50 hover:text-white hover:bg-[#112a4a]' : 'text-[#5a7a9a] hover:text-[#0a1628] hover:bg-[#e8eef6]'}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`text-left text-[10px] uppercase tracking-wider ${muted} ${headerBg}`}>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2 hidden sm:table-cell">Neighbourhood</th>
              <th className="px-4 py-2 hidden md:table-cell">Premise</th>
              <th className="px-4 py-2 hidden lg:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={`${r.id}-${page}-${idx}`}
                onClick={() => setSelectedRecord(r)}
                className={`border-t cursor-pointer transition-colors ${dark ? 'border-[#112a4a]/50 hover:bg-[#112a4a]/40' : 'border-[#e0e8f0] hover:bg-[#e8eef6]/60'}`}
              >
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    r.type === 'auto'
                      ? 'bg-[#ff6450]/10 text-[#ff6450] border border-[#ff6450]/20'
                      : 'bg-[#3cb4f0]/10 text-[#3cb4f0] border border-[#3cb4f0]/20'
                  }`}>
                    {r.type === 'auto' ? '🚗' : '🚲'} {r.type === 'auto' ? 'Auto' : 'Bike'}
                  </span>
                </td>
                <td className={`px-4 py-2 text-xs font-mono ${primary}`}>{r.date}</td>
                <td className={`px-4 py-2 text-xs font-mono ${secondary}`}>{String(r.hour).padStart(2, '0')}:00</td>
                <td className={`px-4 py-2 text-xs hidden sm:table-cell truncate max-w-[200px] ${secondary}`}>{r.neighbourhood}</td>
                <td className={`px-4 py-2 text-xs hidden md:table-cell ${muted}`}>{r.premiseType}</td>
                <td className="px-4 py-2 hidden lg:table-cell">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    r.status === 'CLEAR' || r.status === 'CLEARED'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-teal-500/10 text-teal-400'
                  }`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className={`px-4 py-8 text-center text-sm ${muted}`}>
                  No incidents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
