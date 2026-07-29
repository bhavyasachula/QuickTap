import { Play, Square, Pause, RotateCcw, Mic, MicOff, Video } from 'lucide-react';

const STATES = { IDLE: 'idle', RECORDING: 'recording', PAUSED: 'paused', STOPPED: 'stopped' };

export default function ControlBar({
  recordingState,
  onStart,
  onPause,
  onResume,
  onStop,
  onMute,
  isMuted,
  recordingMode,
}) {
  const isIdle = recordingState === STATES.IDLE;
  const isRecording = recordingState === STATES.RECORDING;
  const isPaused = recordingState === STATES.PAUSED;

  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex items-center gap-3 bg-gray-900/70 backdrop-blur-xl border border-white/8 rounded-2xl px-6 py-4 shadow-2xl shadow-black/50">

        {/* START button */}
        {isIdle && (
          <button
            onClick={onStart}
            className="group flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white/90 group-hover:animate-pulse" />
            Start Recording
          </button>
        )}

        {/* PAUSE / RESUME */}
        {(isRecording || isPaused) && (
          <>
            <button
              onClick={isPaused ? onResume : onPause}
              title={isPaused ? 'Resume' : 'Pause'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-700/80 hover:bg-gray-600/80 text-white text-sm font-medium border border-white/5 transition-all duration-150 hover:scale-105 active:scale-95"
            >
              {isPaused
                ? <><Play className="w-4 h-4 text-emerald-400" /> Resume</>
                : <><Pause className="w-4 h-4 text-yellow-400" /> Pause</>
              }
            </button>

            {/* STOP */}
            <button
              onClick={onStop}
              title="Stop Recording"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-sm font-semibold border border-red-500/40 transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10" />

            {/* MUTE toggle */}
            {recordingMode !== 'screen-only' && (
              <button
                onClick={onMute}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 hover:scale-105 active:scale-95
                  ${isMuted
                    ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                    : 'bg-gray-700/60 border-white/5 text-gray-300 hover:bg-gray-600/60'
                  }`}
              >
                {isMuted
                  ? <><MicOff className="w-4 h-4" /> Unmute</>
                  : <><Mic className="w-4 h-4 text-emerald-400" /> Mute</>
                }
              </button>
            )}

            {/* Recording pulse badge */}
            {isRecording && (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-xs font-bold text-red-400 tracking-widest">REC</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
