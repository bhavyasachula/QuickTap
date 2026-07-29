import { Video } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-white/5 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-lg leading-none">QuickTap</span>
            <span className="text-xs text-gray-500 block leading-tight">Screen Recorder</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-800/60 border border-white/5 px-3 py-1 rounded-full">
            WebRTC • vp9
          </span>
        </div>
      </div>
    </header>
  );
}
