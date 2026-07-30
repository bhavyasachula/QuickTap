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
        background: '#f8fafc',
        border: `1.5px solid ${
          isRecording
            ? '#fca5a5'
            : isPaused
            ? '#fde68a'
            : '#e2e8f0'
        }`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
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
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: '#09090b',
          display: hasVideo || active ? 'block' : 'none',
        }}
      />

      {/* Idle placeholder */}
      {!hasVideo && !active && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            {recordingMode === 'camera' ? (
              <Camera size={24} strokeWidth={1.5} style={{ color: '#64748b' }} />
            ) : (
              <Monitor size={24} strokeWidth={1.5} style={{ color: '#64748b' }} />
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#334155', fontSize: '14px', fontWeight: 600, margin: 0 }}>
              No preview active
            </p>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0' }}>
              Select a source mode above and click Start Capture
            </p>
          </div>
        </div>
      )}

      {/* Live badge */}
      {active && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '4px 10px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          <span
            className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 rec-dot' : 'bg-amber-500'}`}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: isRecording ? '#dc2626' : '#d97706',
              fontWeight: 700,
            }}
          >
            {isRecording ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
      )}
    </div>
  );
}
