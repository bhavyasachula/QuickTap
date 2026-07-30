import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ParticleField from './components/ParticleField';
import ModeSelector from './components/ModeSelector';
import VideoPreview from './components/VideoPreview';
import ControlBar from './components/ControlBar';
import Telemetry from './components/Telemetry';
import AudioVisualizer from './components/AudioVisualizer';
import PostRecording from './components/PostRecording';

const RS = { IDLE: 'idle', RECORDING: 'recording', PAUSED: 'paused', STOPPED: 'stopped' };

export default function App() {
  const [recordingState, setRecordingState] = useState(RS.IDLE);
  const [recordingMode, setRecordingMode] = useState('screen-audio');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const previewRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);

  // ── Timer helpers ────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, [clearTimer]);

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    micStreamRef.current = null;
  }, []);

  const setupAnalyser = useCallback(stream => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch (e) { console.warn('Analyser setup failed', e); }
  }, []);

  // ── Start ────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);

    try {
      let stream, micStream;

      if (recordingMode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: recordingMode === 'screen-audio',
        });
        if (recordingMode === 'screen-audio') {
          try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            micStreamRef.current = micStream;
          } catch { /* optional mic */ }
        }
      }

      streamRef.current = stream;

      let finalStream = stream;
      if (micStream) {
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();
        const da = stream.getAudioTracks();
        const ma = micStream.getAudioTracks();
        if (da.length) ctx.createMediaStreamSource(new MediaStream(da)).connect(dest);
        if (ma.length) {
          ctx.createMediaStreamSource(new MediaStream(ma)).connect(dest);
          setupAnalyser(new MediaStream(ma));
        }
        finalStream = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      } else {
        const at = stream.getAudioTracks();
        if (at.length) setupAnalyser(new MediaStream(at));
      }

      if (previewRef.current) { previewRef.current.srcObject = stream; previewRef.current.muted = true; }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';

      const recorder = new MediaRecorder(finalStream, mimeType ? { mimeType } : {});
      mediaRecRef.current = recorder;

      recorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setRecordingState(RS.STOPPED);
        if (previewRef.current) previewRef.current.srcObject = null;
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        analyserRef.current = null;
      };

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
          clearTimer(); mediaRecRef.current.stop(); stopAllTracks();
        }
      });

      recorder.start(100);
      setRecordingState(RS.RECORDING);
      startTimer();
    } catch (err) {
      console.error(err);
      setError(err.name === 'NotAllowedError'
        ? 'Permission denied — allow screen/camera access to proceed.'
        : err.message);
    }
  }, [recordingMode, setupAnalyser, startTimer, clearTimer, stopAllTracks]);

  const handlePause = useCallback(() => {
    if (mediaRecRef.current?.state === 'recording') {
      mediaRecRef.current.pause(); clearTimer(); setRecordingState(RS.PAUSED);
    }
  }, [clearTimer]);

  const handleResume = useCallback(() => {
    if (mediaRecRef.current?.state === 'paused') {
      mediaRecRef.current.resume(); startTimer(); setRecordingState(RS.RECORDING);
    }
  }, [startTimer]);

  const handleStop = useCallback(() => {
    clearTimer();
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') mediaRecRef.current.stop();
    stopAllTracks();
  }, [clearTimer, stopAllTracks]);

  const handleMute = useCallback(() => {
    const enable = isMuted;
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = enable; });
    micStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = enable; });
    setIsMuted(m => !m);
  }, [isMuted]);

  const handleDiscard = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null); setRecordedUrl(null);
    setRecordingState(RS.IDLE); setDuration(0);
  }, [recordedUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space' && recordingState === RS.IDLE) { e.preventDefault(); handleStart(); }
      if (e.key === 'p' || e.key === 'P') {
        if (recordingState === RS.RECORDING) handlePause();
        if (recordingState === RS.PAUSED) handleResume();
      }
      if ((e.key === 's' || e.key === 'S') && (recordingState === RS.RECORDING || recordingState === RS.PAUSED)) handleStop();
      if ((e.key === 'm' || e.key === 'M') && (recordingState === RS.RECORDING || recordingState === RS.PAUSED)) handleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [recordingState, handleStart, handlePause, handleResume, handleStop, handleMute]);

  useEffect(() => () => {
    clearTimer(); stopAllTracks();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
  }, [clearTimer, stopAllTracks, recordedUrl]);

  const isIdle = recordingState === RS.IDLE;
  const isRecording = recordingState === RS.RECORDING;
  const isPaused = recordingState === RS.PAUSED;
  const isStopped = recordingState === RS.STOPPED;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', color: '#0f172a' }}>

      <Header recordingState={recordingState} />

      {/* ── Main Hero Section: Three.js Antigravity Wave Canvas ── */}
      <section style={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
        <ParticleField />

        {/* Content on top (zIndex 10) */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              padding: '40px 24px 60px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {/* ── Antigravity Heading ── */}
            {isIdle && (
              <div style={{ marginBottom: '36px' }}>
                <h1
                  style={{
                    fontSize: 'clamp(32px, 4.5vw, 52px)',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: '#0f172a',
                    margin: '0 0 8px',
                    lineHeight: 1.1,
                  }}
                >
                  Record your screen.{' '}
                  <span style={{ color: '#64748b', fontWeight: 400 }}>
                    Pure WebRTC performance.
                  </span>
                </h1>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: 1.6,
                    maxWidth: '520px',
                  }}
                >
                  Capture display, active window, or webcam with crystal-clear VP9 encoding — completely on-device with zero server uploads.
                </p>
              </div>
            )}

            {/* ── Recorder Card Widget ─────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Row: Source selector + Telemetry timer */}
              {!isStopped && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <ModeSelector
                    mode={recordingMode}
                    onChange={setRecordingMode}
                    disabled={isRecording || isPaused}
                  />
                  <Telemetry
                    duration={duration}
                    isRecording={isRecording}
                    isPaused={isPaused}
                  />
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#dc2626',
                    fontWeight: 500,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9h2v4h-2V9zm0-2h2v2h-2V7z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Video Preview or Post-Recording Player */}
              {!isStopped ? (
                <>
                  <VideoPreview
                    previewRef={previewRef}
                    recordingMode={recordingMode}
                    isRecording={isRecording}
                    isPaused={isPaused}
                    isIdle={isIdle}
                  />
                  <AudioVisualizer
                    analyserRef={analyserRef}
                    isRecording={isRecording}
                    isMuted={isMuted}
                  />
                </>
              ) : (
                <PostRecording
                  recordedUrl={recordedUrl}
                  recordedBlob={recordedBlob}
                  duration={duration}
                  onDiscard={handleDiscard}
                />
              )}

              {/* Control Bar */}
              {!isStopped && (
                <ControlBar
                  recordingState={recordingState}
                  onStart={handleStart}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  onMute={handleMute}
                  isMuted={isMuted}
                  recordingMode={recordingMode}
                />
              )}

              {/* Shortcuts Footer */}
              {isIdle && (
                <div
                  style={{
                    marginTop: '4px',
                    display: 'flex', gap: '16px', flexWrap: 'wrap',
                    fontSize: '12px', color: '#94a3b8', fontWeight: 500,
                  }}
                >
                  <span>Keyboard shortcuts:</span>
                  {[['Space', 'Start'], ['P', 'Pause/Resume'], ['S', 'Stop'], ['M', 'Mute']].map(([k, l]) => (
                    <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <kbd>{k}</kbd> {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
