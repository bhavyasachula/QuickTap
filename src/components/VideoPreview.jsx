import { useEffect, useRef, useState } from 'react';
import { Monitor, Camera, Wifi } from 'lucide-react';

export default function VideoPreview({ previewRef, recordingMode, isRecording, isPaused, isIdle }) {
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const handleLoad = () => setHasVideo(true);
    const handleEmpty = () => setHasVideo(false);
    el.addEventListener('loadedmetadata', handleLoad);
    return () => el.removeEventListener('loadedmetadata', handleLoad);
  }, [previewRef]);

  // Reset hasVideo when idle
  useEffect(() => {
    if (isIdle) setHasVideo(false);
  }, [isIdle]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-white/5 shadow-2xl shadow-black/50">
      {/* Glassmorphism border glow when recording */}
      {isRecording && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-red-500/40 pointer-events-none z-10 animate-pulse-ring" />
      )}
      {isPaused && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-yellow-500/40 pointer-events-none z-10" />
      )}

      {/* Live preview video */}
      <video
        ref={previewRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain bg-black"
        style={{ display: hasVideo || isRecording || isPaused ? 'block' : 'none' }}
      />

      {/* Idle placeholder */}
      {!hasVideo && !isRecording && !isPaused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-800/80 border border-white/5 flex items-center justify-center">
            {recordingMode === 'camera'
              ? <Camera className="w-8 h-8 text-gray-600" />
              : <Monitor className="w-8 h-8 text-gray-600" />
            }
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium">No preview</p>
            <p className="text-gray-600 text-xs mt-1">Press Start to begin recording</p>
          </div>
        </div>
      )}

      {/* Recording overlay badge */}
      {(isRecording || isPaused) && (
        <div className={`absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border
          ${isRecording
            ? 'bg-red-500/20 border-red-500/30 text-red-300'
            : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`} />
          {isRecording ? 'LIVE' : 'PAUSED'}
        </div>
      )}

      {/* Corner signal icon */}
      {isRecording && (
        <div className="absolute top-3 right-3 z-20">
          <Wifi className="w-4 h-4 text-red-400 animate-pulse" />
        </div>
      )}

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
}
