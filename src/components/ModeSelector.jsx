import { Monitor, MonitorOff, Camera } from 'lucide-react';

const MODES = [
  {
    id: 'screen-audio',
    label: 'Screen + Audio',
    icon: Monitor,
    desc: 'Capture display & system audio',
  },
  {
    id: 'screen-only',
    label: 'Screen Only',
    icon: MonitorOff,
    desc: 'No audio captured',
  },
  {
    id: 'camera',
    label: 'Camera Only',
    icon: Camera,
    desc: 'Webcam with microphone',
  },
];

export default function ModeSelector({ mode, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Recording Mode</span>
      <div className="flex gap-2 flex-wrap">
        {MODES.map(({ id, label, icon: Icon, desc }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              disabled={disabled}
              title={desc}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                border transition-all duration-200 outline-none
                disabled:opacity-40 disabled:cursor-not-allowed
                ${active
                  ? 'bg-violet-600/20 border-violet-500/50 text-violet-300 shadow-lg shadow-violet-500/10'
                  : 'bg-gray-900/60 border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              {active && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-gray-950" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
