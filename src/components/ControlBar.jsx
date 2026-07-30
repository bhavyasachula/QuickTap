import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Pause, RotateCcw, Mic, MicOff } from 'lucide-react';

const btn = {
  base: {
    display: 'flex', alignItems: 'center', gap: '6px',
    borderRadius: '6px', fontSize: '13px', fontWeight: 600,
    padding: '8px 14px', cursor: 'pointer',
    transition: 'all 0.12s ease',
    userSelect: 'none', border: '1px solid transparent',
  },
  primary: {
    background: '#0f172a',
    border: '1px solid #0f172a',
    color: '#ffffff',
    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.12)',
  },
  ghost: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#334155',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  danger: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
  },
  muted: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
  },
};

const fadeSwap = {
  initial: { opacity: 0, y: 4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } },
};

export default function ControlBar({
  recordingState, onStart, onPause, onResume, onStop,
  onMute, isMuted, recordingMode,
}) {
  const isIdle      = recordingState === 'idle';
  const isRecording = recordingState === 'recording';
  const isPaused    = recordingState === 'paused';

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>

        {/* ── IDLE ──────────────────────────────────────── */}
        {isIdle && (
          <motion.div key="idle" {...fadeSwap} className="flex items-center gap-3 w-full">
            <button
              id="btn-start"
              onClick={onStart}
              style={{ ...btn.base, ...btn.primary }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              Start Capture
            </button>
            <kbd>Space</kbd>
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              to begin recording
            </span>
          </motion.div>
        )}

        {/* ── RECORDING / PAUSED ────────────────────────── */}
        {(isRecording || isPaused) && (
          <motion.div key="active" {...fadeSwap} className="flex items-center gap-2.5 w-full flex-wrap">

            {/* Pause / Resume */}
            <button
              id={isPaused ? 'btn-resume' : 'btn-pause'}
              onClick={isPaused ? onResume : onPause}
              style={{
                ...btn.base,
                ...(isPaused ? btn.primary : btn.ghost),
              }}
            >
              {isPaused
                ? <><RotateCcw size={14} strokeWidth={2} /> Resume</>
                : <><Pause size={14} strokeWidth={2} /> Pause</>
              }
            </button>
            <kbd>{isPaused ? 'R' : 'P'}</kbd>

            <div style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 4px' }} />

            {/* Stop */}
            <button
              id="btn-stop"
              onClick={onStop}
              style={{ ...btn.base, ...btn.danger }}
            >
              <Square size={13} fill="currentColor" strokeWidth={0} />
              Stop Recording
            </button>
            <kbd>S</kbd>

            {/* Mute */}
            {recordingMode !== 'screen-only' && (
              <>
                <div style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 4px' }} />
                <button
                  id="btn-mute"
                  onClick={onMute}
                  style={{
                    ...btn.base,
                    ...(isMuted ? btn.muted : btn.ghost),
                  }}
                >
                  {isMuted
                    ? <><MicOff size={14} strokeWidth={2} /> Unmute</>
                    : <><Mic size={14} strokeWidth={2} /> Mic</>
                  }
                </button>
                <kbd>M</kbd>
              </>
            )}

            {/* REC indicator */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isRecording && (
                <span className="rec-dot w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              )}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  color: isRecording ? '#ef4444' : '#d97706',
                  fontWeight: 700,
                }}
              >
                {isRecording ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
