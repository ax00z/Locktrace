import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { useStore } from '../store/useStore';
import { Clock, MapPin, Building2, TrendingUp } from 'lucide-react';

const AUTO_COLOR = '#ff6450';
const BIKE_COLOR = '#3cb4f0';
const PIE_COLORS = ['#ff6450', '#3cb4f0', '#2dd4a0', '#f0c040', '#a78bfa', '#f472b6'];

function getLast3Months(): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${names[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
    });
  }
  return result;
}

export function Charts() {
  const filteredRecords = useStore((s) => s.filteredRecords());
  const dark = useStore((s) => s.theme === 'dark');

  const hourlyData = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`, auto: 0, bike: 0,
    }));
    filteredRecords.forEach((r) => { if (r.hour >= 0 && r.hour < 24) counts[r.hour][r.type]++; });
    return counts;
  }, [filteredRecords]);

  const monthlyData = useMemo(() => {
    const months = getLast3Months();
    const map = new Map<string, { auto: number; bike: number }>();
    months.forEach((m) => map.set(m.key, { auto: 0, bike: 0 }));
    filteredRecords.forEach((r) => {
      const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
      const entry = map.get(key);
      if (entry) entry[r.type]++;
    });
    return months.map((m) => ({ month: m.label, auto: map.get(m.key)?.auto || 0, bike: map.get(m.key)?.bike || 0 }));
  }, [filteredRecords]);

  const topNeighbourhoods = useMemo(() => {
    const map = new Map<string, { auto: number; bike: number }>();
    filteredRecords.forEach((r) => {
      const e = map.get(r.neighbourhood) || { auto: 0, bike: 0 };
      e[r.type]++;
      map.set(r.neighbourhood, e);
    });
    return Array.from(map.entries())
      .sort((a, b) => (b[1].auto + b[1].bike) - (a[1].auto + a[1].bike))
      .slice(0, 8)
      .map(([name, c]) => ({
        name: name.length > 20 ? name.slice(0, 18) + '…' : name,
        auto: c.auto, bike: c.bike,
      }));
  }, [filteredRecords]);

  const premiseData = useMemo(() => {
    const map = new Map<string, number>();
    filteredRecords.forEach((r) => map.set(r.premiseType, (map.get(r.premiseType) || 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={`backdrop-blur border rounded-lg px-3 py-2 shadow-xl ${dark ? 'bg-[#0a1628]/95 border-[#1e508c]' : 'bg-white/95 border-[#d0daea]'}`}>
        <p className={`text-xs font-medium mb-1 ${dark ? 'text-blue-200/80' : 'text-[#0a1628]'}`}>{label}</p>
        {payload.map((p: { name: string; value: number; color: string }, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className={dark ? 'text-blue-300/50' : 'text-[#5a7a9a]'}>{p.name}:</span>
            <span className={`font-medium ${dark ? 'text-white' : 'text-[#0a1628]'}`}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const cardClass = `backdrop-blur border rounded-xl p-4 ${dark ? 'bg-[#0a1628]/60 border-[#112a4a]' : 'bg-white/80 border-[#d0daea]'}`;
  const tickFill = dark ? '#4a80b0' : '#6a8ab0';
  const titleColor = dark ? 'text-white' : 'text-[#0a1628]';
  const axisStyle = { fontSize: 9, fill: tickFill };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-teal-400" />
            <h3 className={`text-sm font-semibold ${titleColor}`}>Hourly</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barGap={0} barCategoryGap="15%">
              <XAxis dataKey="hour" tick={axisStyle} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="auto" name="Auto" stackId="a" fill={AUTO_COLOR} />
              <Bar dataKey="bike" name="Bike" stackId="a" fill={BIKE_COLOR} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Legend dark={dark} />
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className={`text-sm font-semibold ${titleColor}`}>Monthly</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData}>
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="auto" name="Auto" stackId="1" stroke={AUTO_COLOR} fill={AUTO_COLOR} fillOpacity={0.25} />
              <Area type="monotone" dataKey="bike" name="Bike" stackId="1" stroke={BIKE_COLOR} fill={BIKE_COLOR} fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
          <Legend dark={dark} />
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[#ff6450]" />
            <h3 className={`text-sm font-semibold ${titleColor}`}>Neighbourhoods</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topNeighbourhoods} layout="vertical">
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 8, fill: tickFill }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="auto" name="Auto" stackId="a" fill={AUTO_COLOR} />
              <Bar dataKey="bike" name="Bike" stackId="a" fill={BIKE_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-violet-400" />
            <h3 className={`text-sm font-semibold ${titleColor}`}>Premise</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={premiseData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {premiseData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-1 justify-center">
            {premiseData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className={`text-[9px] ${dark ? 'text-blue-300/50' : 'text-[#5a7a9a]'}`}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ dark }: { dark: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-[#ff6450]" />
        <span className={`text-[10px] ${dark ? 'text-blue-300/50' : 'text-[#5a7a9a]'}`}>Auto</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-[#3cb4f0]" />
        <span className={`text-[10px] ${dark ? 'text-blue-300/50' : 'text-[#5a7a9a]'}`}>Bike</span>
      </div>
    </div>
  );
}
