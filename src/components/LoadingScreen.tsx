import { Shield } from 'lucide-react';
import { useStore } from '../store/useStore';

export function LoadingScreen({ message }: { message: string }) {
  const dark = useStore((s) => s.theme === 'dark');

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${dark ? 'bg-[#040d1a]' : 'bg-[#e8eef6]'}`}>
      <div className="text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto">
          <div className={`absolute inset-0 rounded-full border-2 ${dark ? 'border-cyan-500/20' : 'border-blue-500/20'}`} />
          <div className={`absolute inset-2 rounded-full border ${dark ? 'border-cyan-500/15' : 'border-blue-500/15'}`} />
          <div className={`absolute inset-4 rounded-full border ${dark ? 'border-cyan-500/10' : 'border-blue-500/10'}`} />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: dark
                ? 'conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.3) 60deg, transparent 60deg)'
                : 'conic-gradient(from 0deg, transparent 0deg, rgba(37, 99, 235, 0.3) 60deg, transparent 60deg)',
              animation: 'spin 2s linear infinite',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className={`w-8 h-8 ${dark ? 'text-cyan-400' : 'text-blue-600'}`} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-[#09090b]'}`}>Toronto Asset Safety Radar</h2>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dark ? 'bg-cyan-500' : 'bg-blue-500'}`} />
            <p className={`text-sm ${dark ? 'text-blue-300/50' : 'text-[#5a7a9a]'}`}>{message}</p>
          </div>
        </div>

        <div className={`w-48 mx-auto h-1 rounded-full overflow-hidden ${dark ? 'bg-[#112a4a]' : 'bg-[#d0daea]'}`}>
          <div
            className={`h-full rounded-full ${dark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
            style={{ animation: 'loading 2s ease-in-out infinite' }}
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
