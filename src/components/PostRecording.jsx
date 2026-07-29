import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Trash2, Play, Pause, CheckCircle } from 'lucide-react';

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function PostRecording({ recordedUrl, recordedBlob, duration, onDiscard }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [vidDuration, setVidDuration] = useState(0);
  const [filename, setFilename] = useState(`quicktap-${new Date().toISOString().slice(0, 10)}`);
  const [copied, setCopied] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !recordedUrl) return;
    el.src = recordedUrl;
    el.load();
    const onLoaded = () => setVidDuration(el.duration || 0);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', () => setCurrentTime(el.currentTime));
    el.addEventListener('play', () => setIsPlaying(true));
    el.addEventListener('pause', () => setIsPlaying(false));
    el.addEventListener('ended', () => setIsPlaying(false));
    return () => el.removeEventListener('loadedmetadata', onLoaded);
  }, [recordedUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    isPlaying ? el.pause() : el.play();
  };

  const handleSeek = (e) => {
    const el = videoRef.current;
    if (!el || !vidDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * vidDuration;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `${filename || 'quicktap-recording'}.webm`;
    a.click();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(recordedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = recordedUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const progress = vidDuration > 0 ? (currentTime / vidDuration) * 100 : 0;
  const sizeMB = recordedBlob ? (recordedBlob.size / (1024 * 1024)).toFixed(2) : '—';

  return (
    <div className="w-full flex flex-col gap-5 animate-fadeIn">
      {/* Success banner */}
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">Recording complete!</p>
          <p className="text-xs text-emerald-500">Duration: {formatDuration(duration)} · Size: {sizeMB} MB</p>
        </div>
      </div>

      {/* Video player */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/5 shadow-2xl shadow-black/50 group">
        <video
          ref={videoRef}
          className="w-full aspect-video object-contain bg-black"
          onClick={togglePlay}
        />

        {/* Play/pause overlay */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            {isPlaying
              ? <Pause className="w-6 h-6 text-white" />
              : <Play className="w-6 h-6 text-white ml-1" />
            }
          </div>
        </div>

        {/* Bottom controls bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          {/* Progress bar */}
          <div
            className="w-full h-1.5 bg-white/15 rounded-full cursor-pointer mb-3 relative group/seek"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-violet-500 rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-violet-300 shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-violet-300 transition-colors">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <span className="text-xs text-gray-400 tabular-nums">
              {formatTime(currentTime)} / {formatTime(vidDuration)}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors
                    ${speed === s ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Download controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filename input */}
        <div className="flex-1 flex items-center gap-2 bg-gray-900/60 border border-white/8 rounded-xl px-4 py-2.5">
          <span className="text-gray-600 text-sm whitespace-nowrap">Filename:</span>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
            placeholder="recording-name"
          />
          <span className="text-gray-600 text-xs">.webm</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/25"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button
            onClick={handleCopyUrl}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 hover:scale-105 active:scale-95
              ${copied
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-gray-800/60 border-white/5 text-gray-300 hover:border-white/10'
              }`}
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy URL'}
          </button>

          <button
            onClick={onDiscard}
            title="Discard recording"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/60 border border-white/5 text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 text-sm font-medium transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
