/**
 * ModeSelector — flat segmented control.
 * No pill-bubble styling, no neon. Feels like a native toolbar segment.
 */
import { Monitor, MonitorOff, Camera } from 'lucide-react';

const MODES = [
  { id: 'screen-audio', label: 'Screen + Audio', icon: Monitor },
  { id: 'screen-only',  label: 'Screen Only',    icon: MonitorOff },
  { id: 'camera',       label: 'Camera',          icon: Camera },
];

export default function ModeSelector({ mode, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', letterSpacing: '0.1em' }}
        className="font-semibold uppercase"
      >
        Source
      </span>

      {/* Segmented track */}
      <div
        style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border-default)',
          borderRadius: '6px',
          padding: '2px',
          display: 'flex',
          gap: '1px',
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
                background: active ? 'var(--color-surface-float)' : 'transparent',
                border: active
                  ? '1px solid var(--color-border-strong)'
                  : '1px solid transparent',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: active ? 500 : 400,
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s ease',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={13} strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
