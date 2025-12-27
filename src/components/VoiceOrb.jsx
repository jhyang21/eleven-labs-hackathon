export default function VoiceOrb({ state, transcript, onStart, onStop, isListening }) {
  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick();
    }
  };

  return (
    <div className="voice-orb-wrapper">
      {transcript ? <p className="live-transcript">{transcript}</p> : null}
      <div
        className={`voice-orb ${state}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <span className="orb-core" />
      </div>
    </div>
  );
}
