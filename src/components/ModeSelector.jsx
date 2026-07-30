import { Monitor, MonitorOff, Camera } from 'lucide-react';

const MODES = [
  { id: 'screen-audio', label: 'Screen + Audio', icon: Monitor },
  { id: 'screen-only',  label: 'Screen Only',    icon: MonitorOff },
  { id: 'camera',       label: 'Camera',          icon: Camera },
];

export default function ModeSelector({ mode, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        style={{ color: '#94a3b8', fontSize: '10px', letterSpacing: '0.1em' }}
        className="font-semibold uppercase"
      >
        Source
      </span>

      {/* Segmented track */}
      <div
        style={{
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '3px',
          display: 'flex',
          gap: '2px',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              onClick={() => !disabled && onChange(id)}
              disabled={disabled}
              title={label}
              style={{
                background: active ? '#ffffff' : 'transparent',
                border: active
                  ? '1px solid #cbd5e1'
                  : '1px solid transparent',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                color: active ? '#0f172a' : '#64748b',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: active ? 600 : 500,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s ease',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
