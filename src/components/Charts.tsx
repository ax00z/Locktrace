import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { useStore } from '../store/useStore';
import { Clock, Crosshair, Building2, Activity } from 'lucide-react';

const AUTO_COLOR = '#eab308'; // Tactical Yellow
const BIKE_COLOR = '#3b82f6'; // Tactical Blue
const PIE_COLORS = ['#3b82f6', '#eab308', '#ef4444', '#10b981', '#8b5cf6', '#64748b'];

function getLast3Months(): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  const names = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
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
        name: name.length > 20 ? name.slice(0, 18).toUpperCase() + '…' : name.toUpperCase(),
        auto: c.auto, bike: c.bike,
      }));
  }, [filteredRecords]);

  const premiseData = useMemo(() => {
    const map = new Map<string, number>();
    filteredRecords.forEach((r) => map.set(r.premiseType.toUpperCase(), (map.get(r.premiseType.toUpperCase()) || 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={`border px-3 py-2 font-mono uppercase ${dark ? 'bg-[#090a0c] border-[#4b5263]' : 'bg-white border-[#09090b]'}`}>
        <p className={`text-[10px] font-bold tracking-widest mb-2 border-b pb-1 ${dark ? 'text-white border-[#22262f]' : 'text-black border-[#e4e4e7]'}`}>{label}</p>
        {payload.map((p: { name: string; value: number; color: string }, i: number) => (
          <div key={i} className="flex items-center gap-2 text-[10px] tracking-widest mt-1">
            <div className="w-1.5 h-1.5" style={{ backgroundColor: p.color }} />
            <span className={dark ? 'text-[#8a919e]' : 'text-[#52525b]'}>{p.name}:</span>
            <span className={`font-bold ${dark ? 'text-[#e2e4e9]' : 'text-[#09090b]'}`}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const cardClass = `border p-4 font-mono uppercase ${dark ? 'bg-[#090a0c] border-[#22262f]' : 'bg-white border-[#e4e4e7]'}`;
  const tickFill = dark ? '#8a919e' : '#52525b';
  const titleColor = dark ? 'text-[#e2e4e9]' : 'text-[#09090b]';
  const axisStyle = { fontSize: 9, fill: tickFill, fontFamily: 'monospace' };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4 border-b pb-2 border-current" style={{ borderColor: dark ? '#22262f' : '#e4e4e7' }}>
            <Clock className={`w-3.5 h-3.5 ${titleColor}`} />
            <h3 className={`text-[11px] font-bold tracking-widest ${titleColor}`}>TEMPORAL DISTRIBUTION</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barGap={0} barCategoryGap="20%">
              <XAxis dataKey="hour" tick={axisStyle} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: dark ? '#111318' : '#f4f4f5' }} />
              <Bar dataKey="auto" name="AUTO" stackId="a" fill={AUTO_COLOR} />
              <Bar dataKey="bike" name="BIKE" stackId="a" fill={BIKE_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4 border-b pb-2 border-current" style={{ borderColor: dark ? '#22262f' : '#e4e4e7' }}>
            <Activity className={`w-3.5 h-3.5 ${titleColor}`} />
            <h3 className={`text-[11px] font-bold tracking-widest ${titleColor}`}>INCIDENT VELOCITY</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData}>
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              {/* Using type="step" for a tactical, rigid aesthetic instead of smooth curves */}
              <Area type="step" dataKey="auto" name="AUTO" stackId="1" stroke={AUTO_COLOR} strokeWidth={2} fill={AUTO_COLOR} fillOpacity={0.15} />
              <Area type="step" dataKey="bike" name="BIKE" stackId="1" stroke={BIKE_COLOR} strokeWidth={2} fill={BIKE_COLOR} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4 border-b pb-2 border-current" style={{ borderColor: dark ? '#22262f' : '#e4e4e7' }}>
            <Crosshair className={`w-3.5 h-3.5 ${titleColor}`} />
            <h3 className={`text-[11px] font-bold tracking-widest ${titleColor}`}>SECTOR FREQUENCY</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topNeighbourhoods} layout="vertical">
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: tickFill, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: dark ? '#111318' : '#f4f4f5' }} />
              <Bar dataKey="auto" name="AUTO" stackId="a" fill={AUTO_COLOR} />
              <Bar dataKey="bike" name="BIKE" stackId="a" fill={BIKE_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4 border-b pb-2 border-current" style={{ borderColor: dark ? '#22262f' : '#e4e4e7' }}>
            <Building2 className={`w-3.5 h-3.5 ${titleColor}`} />
            <h3 className={`text-[11px] font-bold tracking-widest ${titleColor}`}>ENVIRONMENT TYPOLOGY</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={premiseData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none" dataKey="value">
                {premiseData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
            {premiseData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className={`text-[9px] tracking-widest ${dark ? 'text-[#8a919e]' : 'text-[#52525b]'}`}>{d.name} [{d.value}]</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}