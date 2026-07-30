export default function Header({ recordingState }) {
  const isRecording = recordingState === 'recording';
  const isPaused    = recordingState === 'paused';
  const isActive    = isRecording || isPaused;

  return (
    <header
      style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 select-none">
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect width="18" height="18" rx="5" fill="#0f172a" />
            <circle cx="9" cy="9" r="3.5" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="1.2" fill="white" />
          </svg>
          <span
            style={{ color: '#0f172a', letterSpacing: '-0.02em' }}
            className="text-base font-bold"
          >
            QuickTap
          </span>
        </div>

        {/* Center nav links */}
        <nav className="hidden sm:flex items-center gap-6">
          {['Docs', 'Changelog', 'GitHub'].map((l) => (
            <a
              key={l}
              href="#"
              style={{ color: '#64748b' }}
              className="text-xs font-medium hover:text-slate-900 transition-colors duration-150"
            >
              {l}
            </a>
          ))}
        </nav>

        {/* Right: status indicator + CTA */}
        <div className="flex items-center gap-3">
          {isActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 rec-dot' : 'bg-amber-400'}`}
              />
              <span
                style={{ color: isRecording ? '#ef4444' : '#d97706', fontSize: '11px' }}
                className="font-semibold uppercase tracking-widest"
              >
                {isRecording ? 'Recording' : 'Paused'}
              </span>
            </div>
          ) : (
            <span
              style={{ color: '#94a3b8', fontSize: '11px' }}
              className="font-medium uppercase tracking-widest"
            >
              Ready
            </span>
          )}
          <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />
          <a
            href="https://github.com"
            style={{
              background: '#0f172a',
              color: '#ffffff',
            }}
            className="text-xs font-medium px-3.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all duration-150 shadow-sm"
          >
            Star on GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
