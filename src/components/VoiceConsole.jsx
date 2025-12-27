export default function VoiceConsole({ voiceState, transcript, isVoiceSupported, onRetry }) {
  return (
    <div className="voice-console">
      {transcript && <p className="voice-transcript">{transcript}</p>}
      <div className={`voice-orb ${voiceState}`}>
        {voiceState === 'disabled' && <span className="mic-icon">🎙️</span>}
      </div>
      {!isVoiceSupported && (
        <div className="voice-error">
          <p className="voice-error-title">We can’t hear you right now</p>
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
