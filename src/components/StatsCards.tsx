import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Car, Bike, Activity, Clock, Crosshair, Database } from 'lucide-react';

export function StatsCards() {
  const records = useStore((s) => s.records);
  const filter = useStore((s) => s.filter);
  const dark = useStore((s) => s.theme === 'dark');
  const filteredRecords = useMemo(
    () => (filter === 'all' ? records : records.filter((r) => r.type === filter)),
    [records, filter]
  );

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

  const mainAccent = dark ? 'text-[#e2e4e9]' : 'text-[#09090b]';
  const mutedText = dark ? 'text-[#8a919e]' : 'text-[#52525b]';

  const cards = [
    { label: 'TOTAL INGEST', value: stats.total.toLocaleString(), icon: Database, accent: mainAccent },
    { label: 'AUTO (TARGET)', value: stats.autoCount.toLocaleString(), icon: Car, accent: 'text-[#eab308]' },
    { label: 'BIKE (TARGET)', value: stats.bikeCount.toLocaleString(), icon: Bike, accent: 'text-[#3b82f6]' },
    { label: 'PEAK ACTIVITY', value: `${String(stats.peakHour).padStart(2, '0')}:00`, icon: Clock, accent: mainAccent },
    { label: 'RATE / DAY', value: stats.dailyAvg, icon: Activity, accent: mainAccent },
    { label: 'PRIORITY SECTOR', value: stats.hotspot.length > 15 ? stats.hotspot.slice(0, 13) + '…' : stats.hotspot, icon: Crosshair, accent: 'text-[#ef4444]' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono uppercase">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`border p-3 flex flex-col justify-between transition-none ${
            dark
              ? 'bg-[#090a0c] border-[#22262f] hover:bg-[#111318]'
              : 'bg-white border-[#e4e4e7] hover:bg-[#f4f4f5]'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <span className={`text-[10px] tracking-widest ${mutedText} max-w-[70%]`}>{card.label}</span>
            <card.icon className={`w-3.5 h-3.5 ${card.accent}`} />
          </div>
          <div className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#09090b]'}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}