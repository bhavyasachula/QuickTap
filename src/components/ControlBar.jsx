/**
 * ControlBar — the signature glassmorphism element.
 * This is the ONE place we use the glass-panel class.
 * Framer Motion animates the state transition (idle → recording).
 * Keyboard hints are shown inline next to buttons.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Pause, RotateCcw, Mic, MicOff } from 'lucide-react';

const btn = {
  base: {
    display: 'flex', alignItems: 'center', gap: '6px',
    borderRadius: '5px', fontSize: '12px', fontWeight: 500,
    padding: '6px 12px', cursor: 'pointer',
    transition: 'background 0.12s ease, border-color 0.12s ease, transform 0.1s ease',
    userSelect: 'none', border: '1px solid transparent',
  },
  primary: {
    background: '#2563eb',
    border: '1px solid #1d4ed8',
    color: '#fff',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid var(--color-border-default)',
    color: 'var(--color-text-secondary)',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
  },
  muted: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171',
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
    /* ONE glass-panel usage */
    <div
      className="glass-panel"
      style={{
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
              onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span
                className="w-2 h-2 rounded-full bg-white/80 flex-shrink-0"
                style={{ boxShadow: '0 0 0 0 rgba(255,255,255,0.4)' }}
              />
              Start Capture
            </button>
            <kbd>Space</kbd>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
              to begin
            </span>
          </motion.div>
        )}

        {/* ── RECORDING / PAUSED ────────────────────────── */}
        {(isRecording || isPaused) && (
          <motion.div key="active" {...fadeSwap} className="flex items-center gap-2 w-full flex-wrap">

            {/* Pause / Resume */}
            <button
              id={isPaused ? 'btn-resume' : 'btn-pause'}
              onClick={isPaused ? onResume : onPause}
              style={{
                ...btn.base,
                ...(isPaused ? btn.primary : btn.ghost),
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isPaused ? '#1d4ed8' : 'var(--color-border-default)'; }}
            >
              {isPaused
                ? <><RotateCcw size={13} strokeWidth={2} /> Resume</>
                : <><Pause size={13} strokeWidth={2} /> Pause</>
              }
            </button>
            <kbd>{isPaused ? 'R' : 'P'}</kbd>

            <div style={{ width: '1px', height: '20px', background: 'var(--color-border-default)', margin: '0 4px' }} />

            {/* Stop */}
            <button
              id="btn-stop"
              onClick={onStop}
              style={{ ...btn.base, ...btn.danger }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Square size={12} fill="currentColor" strokeWidth={0} />
              Stop
            </button>
            <kbd>S</kbd>

            {/* Mute — only when audio mode */}
            {recordingMode !== 'screen-only' && (
              <>
                <div style={{ width: '1px', height: '20px', background: 'var(--color-border-default)', margin: '0 4px' }} />
                <button
                  id="btn-mute"
                  onClick={onMute}
                  style={{
                    ...btn.base,
                    ...(isMuted ? btn.muted : btn.ghost),
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isMuted ? 'rgba(239,68,68,0.25)' : 'var(--color-border-default)'; }}
                >
                  {isMuted
                    ? <><MicOff size={13} strokeWidth={2} /> Unmute</>
                    : <><Mic size={13} strokeWidth={2} /> Mic</>
                  }
                </button>
                <kbd>M</kbd>
              </>
            )}

            {/* Spacer + REC label */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isRecording && (
                <span className="rec-dot w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              )}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: isRecording ? 'var(--color-rec)' : '#f59e0b',
                  fontWeight: 600,
                }}
              >
                {isRecording ? 'REC' : 'PAUSED'}
              </span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
