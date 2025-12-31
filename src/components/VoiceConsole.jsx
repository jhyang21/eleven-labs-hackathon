export default function VoiceConsole({
  voiceState,
  transcript,
  isVoiceSupported,
  onRetry,
  onStopSession,
  onToggleMute,
  isMuted,
}) {
  const isConnected =
    voiceState === 'listening' ||
    voiceState === 'speaking' ||
    voiceState === 'thinking';

  return (
    <div className="voice-console">
      {transcript && <p className="voice-transcript">{transcript}</p>}
      <div className={`voice-orb ${voiceState}`}>
        {!isConnected && <span className="mic-icon">🎙️</span>}
      </div>

      {isConnected && (
        <div className="voice-controls">
          <button type="button" className="voice-control-btn" onClick={onToggleMute}>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            className="voice-control-btn stop-btn"
            onClick={onStopSession}
          >
            Stop
          </button>
        </div>
      )}

      {!isConnected && (
        <div className="voice-error">
          <button type="button" onClick={onRetry}>
            {isVoiceSupported ? 'Start Voice Session' : 'Retry Voice Support'}
          </button>
        </div>
      )}
    </div>
  );
}
