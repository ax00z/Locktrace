import { useStore } from '../store/useStore';
import { X, Car, Bike, MapPin, Clock, Building2, Shield } from 'lucide-react';

export function DetailPanel() {
  const { selectedRecord, setSelectedRecord } = useStore();

  if (!selectedRecord) return null;

  const isAuto = selectedRecord.type === 'auto';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 bg-gradient-to-r ${isAuto ? 'from-red-500/20 to-orange-500/20' : 'from-blue-500/20 to-cyan-500/20'} border-b border-slate-700/30`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${isAuto ? 'bg-red-500/20' : 'bg-blue-500/20'} flex items-center justify-center`}>
                {isAuto ? <Car className="w-5 h-5 text-red-400" /> : <Bike className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <h3 className="text-white font-semibold capitalize">{selectedRecord.type} Theft</h3>
                <p className="text-xs text-slate-400">Incident Details</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <DetailRow icon={<MapPin className="w-4 h-4 text-red-400" />} label="Neighbourhood" value={selectedRecord.neighbourhood} />
          <DetailRow icon={<Building2 className="w-4 h-4 text-purple-400" />} label="Premise Type" value={selectedRecord.premiseType} />
          <DetailRow
            icon={<Clock className="w-4 h-4 text-amber-400" />}
            label="Date & Time"
            value={`${selectedRecord.year}-${String(selectedRecord.month).padStart(2, '0')}-${String(selectedRecord.day).padStart(2, '0')} at ${String(selectedRecord.hour).padStart(2, '0')}:00`}
          />
          <DetailRow icon={<Shield className="w-4 h-4 text-green-400" />} label="Status" value={selectedRecord.status} />
          <DetailRow
            icon={<MapPin className="w-4 h-4 text-cyan-400" />}
            label="Coordinates"
            value={`${selectedRecord.lat.toFixed(5)}, ${selectedRecord.lng.toFixed(5)}`}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700/30">
          <p className="text-[10px] text-slate-500 text-center">
            ID: {selectedRecord.id} • Data from Toronto Police Service
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-white font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
