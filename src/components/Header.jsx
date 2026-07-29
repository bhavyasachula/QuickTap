/**
 * Header — compact top nav.
 * Logo left · minimal links center · one CTA right.
 * No gradients, no glow, no heavy shadows.
 */
export default function Header({ recordingState }) {
  const isRecording = recordingState === 'recording';
  const isPaused    = recordingState === 'paused';
  const isActive    = isRecording || isPaused;

  return (
    <header
      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      className="sticky top-0 z-50 w-full"
      // One unique surface: flat, no blur on header itself — glass reserved for controls
      // The background is the base surface color
      // bgcolor intentionally slightly different from page via inline style
    >
      <div
        style={{ background: 'var(--color-surface-base)' }}
        className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 select-none">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect width="18" height="18" rx="4" fill="#2563eb" />
            <circle cx="9" cy="9" r="3.5" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="1.2" fill="white" />
          </svg>
          <span
            style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
            className="text-sm font-semibold"
          >
            QuickTap
          </span>
        </div>

        {/* Center nav links */}
        <nav className="hidden sm:flex items-center gap-6">
          {['Docs', 'Changelog', 'GitHub'].map(l => (
            <a
              key={l}
              href="#"
              style={{ color: 'var(--color-text-secondary)' }}
              className="text-xs font-medium hover:text-white transition-colors duration-150"
            >
              {l}
            </a>
          ))}
        </nav>

        {/* Right: status indicator + CTA */}
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 rec-dot' : 'bg-amber-400'}`}
              />
              <span
                style={{ color: isRecording ? 'var(--color-rec)' : 'var(--color-pause)', fontSize: '11px' }}
                className="font-medium uppercase tracking-widest"
              >
                {isRecording ? 'Recording' : 'Paused'}
              </span>
            </div>
          )}
          {!isActive && (
            <span
              style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}
              className="font-medium uppercase tracking-widest"
            >
              Idle
            </span>
          )}
          <div style={{ width: '1px', height: '14px', background: 'var(--color-border-default)' }} />
          <a
            href="https://github.com"
            style={{
              background: 'var(--color-surface-float)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)',
            }}
            className="text-xs font-medium px-3 py-1.5 rounded hover:brightness-110 transition-all duration-150"
          >
            Star on GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
