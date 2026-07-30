import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Trash2, Play, Pause, CheckCircle2, RotateCcw } from 'lucide-react';

const SPEEDS = [0.5, 1, 1.5, 2];

function fmtMM(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function fmtFull(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function PostRecording({ recordedUrl, recordedBlob, duration, onDiscard }) {
  const videoRef   = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(1);
  const [current, setCurrent]   = useState(0);
  const [vidDur, setVidDur]     = useState(0);
  const [filename, setFilename] = useState(`quicktap-${new Date().toISOString().slice(0,10)}`);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !recordedUrl) return;
    el.src = recordedUrl;
    el.load();
    el.addEventListener('loadedmetadata', () => setVidDur(el.duration || 0));
    el.addEventListener('timeupdate', () => setCurrent(el.currentTime));
    el.addEventListener('play',  () => setPlaying(true));
    el.addEventListener('pause', () => setPlaying(false));
    el.addEventListener('ended', () => setPlaying(false));
  }, [recordedUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    playing ? el.pause() : el.play();
  };

  const seek = (e) => {
    const el = videoRef.current;
    if (!el || !vidDur) return;
    const r   = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    el.currentTime = pct * vidDur;
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `${filename || 'quicktap'}.webm`;
    a.click();
  };

  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(recordedUrl); }
    catch { /* swallow */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const progress = vidDur > 0 ? (current / vidDur) * 100 : 0;
  const sizeMB   = recordedBlob ? (recordedBlob.size / 1048576).toFixed(2) : '—';

  return (
    <div className="fade-up w-full flex flex-col gap-4">

      {/* ── Metadata strip ───────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} strokeWidth={2} style={{ color: '#16a34a', flexShrink: 0 }} />
          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
            Recording ready
          </span>
        </div>
        <div style={{ display: 'flex', gap: '18px' }}>
          {[
            ['Duration', fmtFull(duration)],
            ['Size', `${sizeMB} MB`],
            ['Format', 'VP9 WebM'],
          ].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.04em', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#334155', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Video Player ─────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          background: '#0f172a',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'contain', display: 'block', cursor: 'pointer' }}
          onClick={toggle}
        />

        {/* Overlay Play button */}
        <div
          onClick={toggle}
          style={{
            position: 'absolute', inset: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: playing ? 0 : 1, transition: 'opacity 0.15s',
          }}
        >
          <div
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)', border: '1px solid #cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {playing ? (
              <Pause size={20} style={{ color: '#0f172a' }} />
            ) : (
              <Play size={20} style={{ color: '#0f172a', marginLeft: '2px' }} />
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            padding: '24px 14px 12px',
          }}
        >
          {/* Progress bar */}
          <div
            onClick={seek}
            style={{
              height: '4px', background: 'rgba(255,255,255,0.2)',
              borderRadius: '2px', cursor: 'pointer', marginBottom: '10px',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%', width: `${progress}%`,
                background: '#2563eb', borderRadius: '2px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute', right: '-4px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#fff', display: 'flex' }}>
              {playing ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '1px' }} />}
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              {fmtMM(current)} / {fmtMM(vidDur)}
            </span>
            {/* Speed selector */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    background: speed === s ? '#ffffff' : 'rgba(255,255,255,0.15)',
                    border: '1px solid ' + (speed === s ? '#ffffff' : 'transparent'),
                    color: speed === s ? '#0f172a' : 'rgba(255,255,255,0.7)',
                    borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    padding: '2px 7px', cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions Row ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filename input */}
        <div
          style={{
            flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px', padding: '7px 12px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>File:</span>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '13px', color: '#0f172a', fontFamily: 'var(--font-mono)', fontWeight: 500,
            }}
            placeholder="filename"
          />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>.webm</span>
        </div>

        {/* Download Button */}
        <button
          onClick={download}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#0f172a', border: '1px solid #0f172a',
            color: '#ffffff', borderRadius: '6px',
            fontSize: '13px', fontWeight: 600, padding: '8px 16px',
            cursor: 'pointer', transition: 'all 0.12s ease',
            boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
        >
          <Download size={15} strokeWidth={2} />
          Download .webm
        </button>

        {/* Copy URL */}
        <button
          onClick={copyUrl}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#ffffff',
            border: `1px solid ${copied ? '#16a34a' : '#cbd5e1'}`,
            color: copied ? '#16a34a' : '#334155',
            borderRadius: '6px', fontSize: '13px', fontWeight: 600, padding: '8px 14px',
            cursor: 'pointer', transition: 'all 0.12s ease',
            flexShrink: 0,
          }}
        >
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} strokeWidth={2} />}
          {copied ? 'Copied' : 'Copy URL'}
        </button>

        {/* Discard */}
        <button
          onClick={onDiscard}
          title="Discard and start over"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#64748b',
            borderRadius: '6px', fontSize: '13px', fontWeight: 500, padding: '8px 12px',
            cursor: 'pointer', transition: 'all 0.12s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          <RotateCcw size={15} strokeWidth={2} />
          New recording
        </button>
      </div>
    </div>
  );
}
