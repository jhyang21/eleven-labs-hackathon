export default function VoiceConsole({ isListening, transcript, onStart, onStop }) {
  return (
    <div className="voice-console">
      <h3>Voice assistant</h3>
      <p className="muted">
        Speak naturally. The assistant listens for confirmations, next step, repeats, and timers.
      </p>
      <div className="voice-controls">
        <button type="button" onClick={onStart} disabled={isListening}>
          Start listening
        </button>
        <button type="button" onClick={onStop} disabled={!isListening}>
          Stop listening
        </button>
        <span className={isListening ? 'listening' : 'idle'}>
          {isListening ? 'Listening…' : 'Idle'}
        </span>
      </div>
      <div className="transcript">
        <p className="muted">Latest transcript</p>
        <p>{transcript || 'Say a command to see it here.'}</p>
      </div>
    </div>
  );
}
