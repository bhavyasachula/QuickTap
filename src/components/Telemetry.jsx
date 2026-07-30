import { Clock } from 'lucide-react';

function fmt(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function Telemetry({ duration, isRecording, isPaused }) {
  const active = isRecording || isPaused;

  return (
    <div className="flex items-center gap-2.5">
      {active ? (
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isRecording ? 'bg-red-500 rec-dot' : 'bg-amber-500'
          }`}
        />
      ) : (
        <Clock
          size={16}
          strokeWidth={1.75}
          style={{ color: '#94a3b8' }}
        />
      )}
      <span
        className="tabular-nums"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: isRecording
            ? '#ef4444'
            : isPaused
            ? '#d97706'
            : '#94a3b8',
        }}
      >
        {fmt(duration)}
      </span>
    </div>
  );
}
