import { Clock } from 'lucide-react';

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function Telemetry({ duration, isRecording, isPaused }) {
  const isActive = isRecording || isPaused;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300
      ${isRecording
        ? 'bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/5'
        : isPaused
        ? 'bg-yellow-500/10 border-yellow-500/20'
        : 'bg-gray-900/50 border-white/5'
      }`}
    >
      <Clock className={`w-4 h-4 ${isRecording ? 'text-red-400' : isPaused ? 'text-yellow-400' : 'text-gray-600'}`} />
      <span
        className={`font-mono text-xl font-bold tabular-nums tracking-widest
          ${isRecording ? 'text-white' : isPaused ? 'text-yellow-300' : 'text-gray-600'}`}
      >
        {formatTime(duration)}
      </span>
      {isActive && (
        <div className="flex items-center gap-1 ml-1">
          {isRecording ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-400 tracking-widest">LIVE</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="text-xs font-semibold text-yellow-400 tracking-widest">PAUSED</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
