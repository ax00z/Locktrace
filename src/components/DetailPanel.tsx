import { useStore } from '../store/useStore';
import { X, Car, Bike, MapPin, Clock, Building2, Shield } from 'lucide-react';

export function DetailPanel() {
  const { selectedRecord, setSelectedRecord, theme } = useStore();
  if (!selectedRecord) return null;

  const dark = theme === 'dark';
  const isAuto = selectedRecord.type === 'auto';
  const accent = isAuto ? '#ff6450' : '#3cb4f0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
      <div className={`border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden ${dark ? 'bg-[#0a1628] border-[#1e508c]' : 'bg-white border-[#d0daea]'}`} onClick={(e) => e.stopPropagation()}>
        <div className={`px-5 py-4 border-b ${dark ? 'border-[#112a4a]' : 'border-[#d0daea]'}`} style={{ background: `linear-gradient(135deg, ${accent}10, ${accent}05)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                {isAuto ? <Car className="w-5 h-5" style={{ color: accent }} /> : <Bike className="w-5 h-5" style={{ color: accent }} />}
              </div>
              <div>
                <h3 className={`font-semibold capitalize ${dark ? 'text-white' : 'text-[#0a1628]'}`}>{selectedRecord.type} Theft</h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${dark ? 'bg-[#112a4a] text-blue-300/50 hover:text-white hover:bg-[#1e508c]' : 'bg-[#e8eef6] text-[#5a7a9a] hover:text-[#0a1628] hover:bg-[#d0daea]'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <Row icon={<MapPin className="w-4 h-4 text-[#ff6450]" />} label="Neighbourhood" value={selectedRecord.neighbourhood} dark={dark} />
          <Row icon={<Building2 className="w-4 h-4 text-violet-400" />} label="Premise" value={selectedRecord.premiseType} dark={dark} />
          <Row icon={<Clock className="w-4 h-4 text-teal-400" />} label="Date & Time" value={`${selectedRecord.date} at ${String(selectedRecord.hour).padStart(2, '0')}:00`} dark={dark} />
          <Row icon={<Shield className="w-4 h-4 text-emerald-400" />} label="Status" value={selectedRecord.status} dark={dark} />
          <Row icon={<MapPin className="w-4 h-4 text-cyan-400" />} label="Coordinates" value={`${selectedRecord.lat.toFixed(5)}, ${selectedRecord.lng.toFixed(5)}`} dark={dark} />
        </div>

        <div className={`px-5 py-3 border-t ${dark ? 'border-[#112a4a]' : 'border-[#d0daea]'}`}>
          <p className={`text-[10px] text-center ${dark ? 'text-blue-400/30' : 'text-[#8aa8c8]'}`}>
            {selectedRecord.id}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value, dark }: { icon: React.ReactNode; label: string; value: string; dark: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${dark ? 'bg-[#112a4a]' : 'bg-[#e8eef6]'}`}>{icon}</div>
      <div className="min-w-0">
        <div className={`text-[10px] uppercase tracking-wider ${dark ? 'text-blue-400/40' : 'text-[#8aa8c8]'}`}>{label}</div>
        <div className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-[#0a1628]'}`}>{value}</div>
      </div>
    </div>
  );
}
