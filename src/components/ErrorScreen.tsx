import { AlertOctagon, RefreshCw } from 'lucide-react';

export function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
          <AlertOctagon className="w-8 h-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Connection Error</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <p className="text-xs text-slate-500">
            The Toronto Police ArcGIS API may be temporarily unavailable. This can happen due to CORS restrictions when running in a browser, rate limits, or maintenance windows.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    </div>
  );
}
