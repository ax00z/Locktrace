import { Shield } from 'lucide-react';

export function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        {/* Animated radar */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
          <div className="absolute inset-2 rounded-full border border-red-500/15" />
          <div className="absolute inset-4 rounded-full border border-red-500/10" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(239, 68, 68, 0.3) 60deg, transparent 60deg)',
              animation: 'spin 2s linear infinite',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Toronto Asset Safety Radar</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 mx-auto h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
            style={{
              animation: 'loading 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
