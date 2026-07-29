/**
 * VideoPreview — clean video frame.
 * No rounded-everything. Intentional 6px radius.
 * Recording state: 1px red border only, no glow explosion.
 */
import { useEffect, useState } from 'react';
import { Monitor, Camera } from 'lucide-react';

export default function VideoPreview({ previewRef, recordingMode, isRecording, isPaused, isIdle }) {
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const on = () => setHasVideo(true);
    el.addEventListener('loadedmetadata', on);
    return () => el.removeEventListener('loadedmetadata', on);
  }, [previewRef]);

  useEffect(() => {
    if (isIdle) setHasVideo(false);
  }, [isIdle]);

  const active = isRecording || isPaused;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        background: 'var(--color-surface-raised)',
        border: `1px solid ${
          isRecording ? 'rgba(239,68,68,0.45)'
          : isPaused ? 'rgba(245,158,11,0.3)'
          : 'var(--color-border-default)'
        }`,
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Live video */}
      <video
        ref={previewRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          background: '#000',
          display: hasVideo || active ? 'block' : 'none',
        }}
      />

      {/* Idle placeholder */}
      {!hasVideo && !active && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '48px', height: '48px',
              background: 'var(--color-surface-float)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {recordingMode === 'camera'
              ? <Camera size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-tertiary)' }} />
              : <Monitor size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-tertiary)' }} />
            }
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: 0 }}>
              No preview
            </p>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', margin: '4px 0 0' }}>
              Select a source and press Start Capture
            </p>
          </div>
        </div>
      )}

      {/* Live badge — flat, not a chip */}
      {active && (
        <div
          style={{
            position: 'absolute', top: '10px', left: '10px',
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'rgba(13,15,20,0.75)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '4px',
            padding: '3px 8px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 rec-dot' : 'bg-amber-400'}`}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: isRecording ? '#f87171' : '#fbbf24',
              fontWeight: 600,
            }}
          >
            {isRecording ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
      )}

      {/* Bottom vignette — subtle only when active */}
      {active && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
