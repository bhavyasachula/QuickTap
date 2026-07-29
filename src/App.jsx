import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ModeSelector from './components/ModeSelector';
import VideoPreview from './components/VideoPreview';
import ControlBar from './components/ControlBar';
import Telemetry from './components/Telemetry';
import AudioVisualizer from './components/AudioVisualizer';
import PostRecording from './components/PostRecording';

const RECORDING_STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  STOPPED: 'stopped',
};

export default function App() {
  const [recordingState, setRecordingState] = useState(RECORDING_STATES.IDLE);
  const [recordingMode, setRecordingMode] = useState('screen-audio');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const previewRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, [clearTimer]);

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    micStreamRef.current = null;
  }, []);

  const setupAudioAnalyser = useCallback((stream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch (e) {
      console.warn('Audio analyser setup failed', e);
    }
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);

    try {
      let stream;
      let micStream;

      if (recordingMode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
          audio: true,
        });
      } else {
        const displayConstraints = {
          video: { frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: recordingMode === 'screen-audio',
        };
        stream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);

        if (recordingMode === 'screen-audio') {
          try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            micStreamRef.current = micStream;
          } catch {
            // Mic optional
          }
        }
      }

      streamRef.current = stream;

      // Combine display + mic audio tracks if both exist
      let finalStream = stream;
      if (micStream) {
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();
        const dispAudio = stream.getAudioTracks();
        const micAudio = micStream.getAudioTracks();

        if (dispAudio.length > 0) {
          ctx.createMediaStreamSource(new MediaStream(dispAudio)).connect(dest);
        }
        if (micAudio.length > 0) {
          ctx.createMediaStreamSource(new MediaStream(micAudio)).connect(dest);
          setupAudioAnalyser(new MediaStream(micAudio));
        }

        finalStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...dest.stream.getAudioTracks(),
        ]);
      } else {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          setupAudioAnalyser(new MediaStream(audioTracks));
        }
      }

      // Live preview
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;
      }

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const recorder = new MediaRecorder(finalStream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setRecordingState(RECORDING_STATES.STOPPED);
        if (previewRef.current) previewRef.current.srcObject = null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      };

      // Handle native "Stop Sharing"
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          clearTimer();
          mediaRecorderRef.current.stop();
          stopAllTracks();
        }
      });

      recorder.start(100);
      setRecordingState(RECORDING_STATES.RECORDING);
      startTimer();
    } catch (err) {
      console.error(err);
      setError(err.name === 'NotAllowedError' ? 'Permission denied. Please allow screen/camera access.' : err.message);
    }
  }, [recordingMode, setupAudioAnalyser, startTimer, clearTimer, stopAllTracks]);

  const handlePause = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearTimer();
      setRecordingState(RECORDING_STATES.PAUSED);
    }
  }, [clearTimer]);

  const handleResume = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState(RECORDING_STATES.RECORDING);
    }
  }, [startTimer]);

  const handleStop = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopAllTracks();
  }, [clearTimer, stopAllTracks]);

  const handleMute = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
    }
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
    }
    setIsMuted((m) => !m);
  }, [isMuted]);

  const handleDiscard = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingState(RECORDING_STATES.IDLE);
    setDuration(0);
  }, [recordedUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopAllTracks();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [clearTimer, stopAllTracks, recordedUrl]);

  const isIdle = recordingState === RECORDING_STATES.IDLE;
  const isRecording = recordingState === RECORDING_STATES.RECORDING;
  const isPaused = recordingState === RECORDING_STATES.PAUSED;
  const isStopped = recordingState === RECORDING_STATES.STOPPED;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-6xl mx-auto w-full">
        {/* Top row: Mode selector + Telemetry */}
        <div className="w-full flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

        {/* Error banner */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9h2v4h-2V9zm0-2h2v2h-2V7z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Main content area */}
        {!isStopped ? (
          <div className="w-full flex flex-col gap-4">
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
          </div>
        ) : (
          <PostRecording
            recordedUrl={recordedUrl}
            recordedBlob={recordedBlob}
            duration={duration}
            onDiscard={handleDiscard}
          />
        )}

        {/* Control Bar */}
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
      </main>
    </div>
  );
}
