import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

const BAR_COUNT = 32;

export default function AudioVisualizer({ analyserRef, isRecording, isMuted }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [avgLevel, setAvgLevel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      const analyser = analyserRef.current;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!analyser || !isRecording || isMuted) {
        // Draw flat idle bars
        const barW = (width / BAR_COUNT) * 0.6;
        const gap = (width / BAR_COUNT) * 0.4;
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = i * (width / BAR_COUNT) + gap / 2;
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.beginPath();
          ctx.roundRect(x, height / 2 - 2, barW, 4, 2);
          ctx.fill();
        }
        setAvgLevel(0);
        return;
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const slice = Math.floor(dataArray.length / BAR_COUNT);
      let total = 0;

      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < slice; j++) sum += dataArray[i * slice + j];
        const avg = sum / slice;
        total += avg;

        const normalizedH = (avg / 255) * height * 0.85;
        const barH = Math.max(4, normalizedH);
        const barW = (width / BAR_COUNT) * 0.6;
        const gap = (width / BAR_COUNT) * 0.4;
        const x = i * (width / BAR_COUNT) + gap / 2;
        const y = (height - barH) / 2;

        // Gradient color based on level
        const intensity = avg / 255;
        const r = Math.round(139 + intensity * 116);
        const g = Math.round(92 + intensity * (-92));
        const b = Math.round(246 - intensity * 100);

        ctx.fillStyle = `rgba(${r},${g},${b},${0.5 + intensity * 0.5})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 2);
        ctx.fill();
      }

      setAvgLevel(Math.round((total / BAR_COUNT / 255) * 100));
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyserRef, isRecording, isMuted]);

  return (
    <div className="w-full flex items-center gap-4 bg-gray-900/50 border border-white/5 rounded-xl px-4 py-3">
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
        ${isMuted ? 'bg-red-500/20' : 'bg-violet-500/20'}`}
      >
        {isMuted
          ? <MicOff className="w-3.5 h-3.5 text-red-400" />
          : <Mic className="w-3.5 h-3.5 text-violet-400" />
        }
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={48}
          className="w-full h-10 rounded-lg"
        />
        {isMuted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-red-400/70 font-medium">Microphone muted</span>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-xs text-gray-500 font-medium">Level</div>
        <div className={`text-sm font-bold tabular-nums ${avgLevel > 70 ? 'text-red-400' : avgLevel > 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>
          {avgLevel}%
        </div>
      </div>
    </div>
  );
}
