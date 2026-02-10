import { AlertOctagon, RefreshCw } from 'lucide-react';

export function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#040d1a] flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-4">
        <div className="w-16 h-16 rounded-2xl bg-[#ff6450]/10 flex items-center justify-center mx-auto border border-[#ff6450]/20">
          <AlertOctagon className="w-8 h-8 text-[#ff6450]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Connection Error</h2>
          <p className="text-sm text-blue-300/50">{error}</p>
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
