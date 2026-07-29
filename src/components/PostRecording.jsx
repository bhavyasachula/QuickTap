/**
 * PostRecording — minimal card for reviewing the recording.
 * Clean surface, no stacked shadows. One blue accent on the download button.
 * Speed selector: flat inline toggle. Filename: inline editable text.
 */
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
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
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

  const seek = e => {
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
          padding: '10px 14px',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#4ade80', flexShrink: 0 }} />
          <span style={{ color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 500 }}>
            Recording saved
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            ['Duration', fmtFull(duration)],
            ['Size', `${sizeMB} MB`],
            ['Codec', 'VP9/WebM'],
          ].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>{k}</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Player ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          background: '#000',
          border: '1px solid var(--color-border-default)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'contain', display: 'block', cursor: 'pointer' }}
          onClick={toggle}
        />

        {/* Play/pause overlay — appears on hover */}
        <div
          onClick={toggle}
          style={{
            position: 'absolute', inset: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: playing ? 0 : 1, transition: 'opacity 0.15s',
          }}
          className="group"
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = playing ? '0' : '1'}
        >
          <div
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {playing
              ? <Pause size={18} style={{ color: '#fff' }} />
              : <Play  size={18} style={{ color: '#fff', marginLeft: '2px' }} />
            }
          </div>
        </div>

        {/* Bottom control strip */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            padding: '24px 12px 10px',
          }}
        >
          {/* Progress bar */}
          <div
            onClick={seek}
            style={{
              height: '3px', background: 'rgba(255,255,255,0.15)',
              borderRadius: '2px', cursor: 'pointer', marginBottom: '8px',
              position: 'relative', overflow: 'visible',
            }}
          >
            <div
              style={{
                height: '100%', width: `${progress}%`,
                background: '#2563eb', borderRadius: '2px',
                transition: 'width 0.1s linear',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute', right: '-4px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#fff',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#fff', display: 'flex' }}>
              {playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '1px' }} />}
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              {fmtMM(current)} / {fmtMM(vidDur)}
            </span>
            {/* Speed */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    background: speed === s ? 'rgba(37,99,235,0.75)' : 'transparent',
                    border: '1px solid ' + (speed === s ? '#2563eb' : 'transparent'),
                    color: speed === s ? '#fff' : 'rgba(255,255,255,0.45)',
                    borderRadius: '3px', fontSize: '10px', fontWeight: 500,
                    padding: '2px 5px', cursor: 'pointer',
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

      {/* ── Actions row ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filename input */}
        <div
          style={{
            flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '5px', padding: '6px 10px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>File:</span>
          <input
            type="text"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '12px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)',
            }}
            placeholder="filename"
          />
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>.webm</span>
        </div>

        {/* Download */}
        <button
          onClick={download}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#2563eb', border: '1px solid #1d4ed8',
            color: '#fff', borderRadius: '5px',
            fontSize: '12px', fontWeight: 500, padding: '7px 14px',
            cursor: 'pointer', transition: 'background 0.12s ease, transform 0.1s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Download size={13} strokeWidth={2} />
          Download
        </button>

        {/* Copy URL */}
        <button
          onClick={copyUrl}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--color-surface-float)',
            border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'var(--color-border-default)'}`,
            color: copied ? '#4ade80' : 'var(--color-text-secondary)',
            borderRadius: '5px', fontSize: '12px', fontWeight: 500, padding: '7px 12px',
            cursor: 'pointer', transition: 'all 0.12s ease',
            flexShrink: 0,
          }}
        >
          {copied ? <CheckCircle2 size={13} /> : <Copy size={13} strokeWidth={1.75} />}
          {copied ? 'Copied' : 'Copy URL'}
        </button>

        {/* Discard */}
        <button
          onClick={onDiscard}
          title="Discard and start over"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-tertiary)',
            borderRadius: '5px', fontSize: '12px', fontWeight: 500, padding: '7px 10px',
            cursor: 'pointer', transition: 'all 0.12s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
        >
          <RotateCcw size={13} strokeWidth={1.75} />
          New recording
        </button>
      </div>
    </div>
  );
}
