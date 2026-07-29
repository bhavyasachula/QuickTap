/**
 * Telemetry — clean timer with dot indicator.
 * Monospace, no badge chips, no heavy backgrounds.
 */
import { Clock } from 'lucide-react';

function fmt(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

export default function Telemetry({ duration, isRecording, isPaused }) {
  const active = isRecording || isPaused;

  return (
    <div className="flex items-center gap-2.5">
      {active && (
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isRecording ? 'bg-red-500 rec-dot' : 'bg-amber-400'
          }`}
        />
      )}
      {!active && (
        <Clock
          size={14}
          strokeWidth={1.5}
          style={{ color: 'var(--color-text-tertiary)' }}
        />
      )}
      <span
        className="tabular-nums"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '22px',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: isRecording
            ? 'var(--color-text-primary)'
            : isPaused
            ? '#f59e0b'
            : 'var(--color-text-tertiary)',
        }}
      >
        {fmt(duration)}
      </span>
    </div>
  );
}
