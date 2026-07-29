/**
 * AudioVisualizer — minimal 32-bar canvas meter.
 * Tight, dense, no glow. Colors: blue peaks, gray flat, white clip.
 */
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

const BAR_COUNT = 32;

export default function AudioVisualizer({ analyserRef, isRecording, isMuted }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const analyser = analyserRef.current;
      const active   = analyser && isRecording && !isMuted;

      const barW   = (W / BAR_COUNT) * 0.55;
      const gapW   = (W / BAR_COUNT) * 0.45;
      const slot   = W / BAR_COUNT;

      if (!active) {
        // Flat idle bars
        for (let i = 0; i < BAR_COUNT; i++) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          const x = i * slot + gapW / 2;
          ctx.beginPath();
          ctx.roundRect(x, H / 2 - 1.5, barW, 3, 1);
          ctx.fill();
        }
        setLevel(0);
        return;
      }

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const slice = Math.floor(data.length / BAR_COUNT);
      let sum = 0;

      for (let i = 0; i < BAR_COUNT; i++) {
        let s = 0;
        for (let j = 0; j < slice; j++) s += data[i * slice + j];
        const avg  = s / slice;
        sum += avg;
        const pct  = avg / 255;
        const barH = Math.max(3, pct * H * 0.9);
        const x    = i * slot + gapW / 2;
        const y    = (H - barH) / 2;

        // Color by level: blue → gray → white
        let color;
        if (pct < 0.5)       color = `rgba(37,99,235,${0.4 + pct * 0.9})`;
        else if (pct < 0.85) color = `rgba(148,163,184,${0.6 + pct * 0.4})`;
        else                 color = `rgba(241,245,249,${0.85 + pct * 0.15})`;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 1.5);
        ctx.fill();
      }

      setLevel(Math.round((sum / BAR_COUNT / 255) * 100));
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [analyserRef, isRecording, isMuted]);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '6px',
        padding: '8px 12px',
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0 }}>
        {isMuted
          ? <MicOff size={13} strokeWidth={1.75} style={{ color: '#f87171' }} />
          : <Mic size={13} strokeWidth={1.75} style={{ color: 'var(--color-text-secondary)' }} />
        }
      </div>

      {/* Bars */}
      <div style={{ flex: 1, position: 'relative', height: '32px' }}>
        <canvas ref={canvasRef} width={560} height={32} style={{ width: '100%', height: '32px', display: 'block' }} />
        {isMuted && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              fontSize: '11px', color: 'var(--color-text-tertiary)',
            }}
          >
            Microphone muted
          </div>
        )}
      </div>

      {/* Level readout */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            color: level > 75 ? '#f87171' : level > 45 ? '#fbbf24' : 'var(--color-text-secondary)',
            minWidth: '28px',
          }}
        >
          {level}%
        </div>
      </div>
    </div>
  );
}
