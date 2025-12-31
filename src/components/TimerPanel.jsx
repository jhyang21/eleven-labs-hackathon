export default function TimerPanel({ timers, flashingTimerId }) {
  if (timers.length === 0) return null;

  const radius = 76;
  const circumference = 2 * Math.PI * radius;

  const formatTime = (seconds) => {
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="timer-panel">
      {timers.map((timer) => {
        const remainingSeconds = Math.max(0, Math.ceil(timer.remainingMs / 1000));
        const progress = timer.durationSeconds
          ? Math.max(0, Math.min(1, remainingSeconds / timer.durationSeconds))
          : 0;
        const offset = circumference * (1 - progress);
        const isFlashing = flashingTimerId === timer.id;

        return (
          <div key={timer.id} className={`timer-ring ${isFlashing ? 'flash' : ''}`}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                className="timer-ring-bg"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth="8"
                fill="none"
              />
              <circle
                className="timer-ring-progress"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="timer-center">
              <p className="timer-value">{formatTime(remainingSeconds)}</p>
              <p className="timer-label">{timer.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
