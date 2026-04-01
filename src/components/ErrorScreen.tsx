import { AlertOctagon, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';

export function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  const dark = useStore((s) => s.theme === 'dark');

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${dark ? 'bg-[#040d1a]' : 'bg-[#e8eef6]'}`}>
      <div className="text-center space-y-6 max-w-md mx-4">
        <div className="w-16 h-16 rounded-2xl bg-[#ff6450]/10 flex items-center justify-center mx-auto border border-[#ff6450]/20">
          <AlertOctagon className="w-8 h-8 text-[#ff6450]" />
        </div>
        <div className="space-y-2">
          <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-[#09090b]'}`}>Connection Error</h2>
          <p className={`text-sm ${dark ? 'text-blue-300/50' : 'text-[#5a7a9a]'}`}>{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg transition-all text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
