import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Car, Bike, AlertTriangle, TrendingUp, Clock, MapPin } from 'lucide-react';

export function StatsCards() {
  const records = useStore((s) => s.records);
  const filteredRecords = useStore((s) => s.filteredRecords());
  const dark = useStore((s) => s.theme === 'dark');

  const stats = useMemo(() => {
    const autoCount = records.filter((r) => r.type === 'auto').length;
    const bikeCount = records.filter((r) => r.type === 'bike').length;

    const hourCounts = new Map<number, number>();
    filteredRecords.forEach((r) => hourCounts.set(r.hour, (hourCounts.get(r.hour) || 0) + 1));
    let peakHour = 0, peakCount = 0;
    hourCounts.forEach((c, h) => { if (c > peakCount) { peakCount = c; peakHour = h; } });

    const nhCounts = new Map<string, number>();
    filteredRecords.forEach((r) => nhCounts.set(r.neighbourhood, (nhCounts.get(r.neighbourhood) || 0) + 1));
    let hotspot = 'N/A', hotspotCount = 0;
    nhCounts.forEach((c, n) => { if (c > hotspotCount) { hotspotCount = c; hotspot = n; } });

    const days = new Set<string>();
    filteredRecords.forEach((r) => days.add(r.date));
    const dailyAvg = days.size > 0 ? (filteredRecords.length / days.size).toFixed(1) : '0';

    return { autoCount, bikeCount, peakHour, peakCount, hotspot, hotspotCount, dailyAvg, total: records.length };
  }, [records, filteredRecords]);

  const cards = [
    { label: 'Total', value: stats.total.toLocaleString(), icon: AlertTriangle, accent: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Auto', value: stats.autoCount.toLocaleString(), icon: Car, accent: 'text-[#ff6450]', bg: 'bg-[#ff6450]/10' },
    { label: 'Bike', value: stats.bikeCount.toLocaleString(), icon: Bike, accent: 'text-[#3cb4f0]', bg: 'bg-[#3cb4f0]/10' },
    { label: 'Peak Hour', value: `${String(stats.peakHour).padStart(2, '0')}:00`, icon: Clock, accent: 'text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Daily Avg', value: stats.dailyAvg, icon: TrendingUp, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Hotspot', value: stats.hotspot.length > 15 ? stats.hotspot.slice(0, 13) + '…' : stats.hotspot, icon: MapPin, accent: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`backdrop-blur border rounded-xl p-3 transition-all group ${
            dark
              ? 'bg-[#0a1628]/60 border-[#112a4a] hover:border-[#1e508c]/50'
              : 'bg-white/80 border-[#d0daea] hover:border-[#8aa8c8]'
          }`}
        >
          <div className="mb-2">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-4 h-4 ${card.accent}`} />
            </div>
          </div>
          <div className={`text-lg font-bold leading-tight ${dark ? 'text-white' : 'text-[#0a1628]'}`}>{card.value}</div>
          <div className={`text-[10px] mt-0.5 ${dark ? 'text-blue-300/50' : 'text-[#5a7a9a]'}`}>{card.label}</div>
        </div>
      ))}
    </div>
  );
}
