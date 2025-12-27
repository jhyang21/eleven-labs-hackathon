export default function TimerPanel({ timers }) {
  return (
    <div className="timer-panel">
      <h3>Active timers</h3>
      {timers.length === 0 ? (
        <p className="muted">No active timers yet.</p>
      ) : (
        <ul>
          {timers.map((timer) => (
            <li key={timer.id}>
              <div>
                <p className="timer-label">{timer.label}</p>
                <p className="timer-remaining">{timer.remainingLabel}</p>
              </div>
              <span className={timer.isExpired ? 'badge expired' : 'badge active'}>
                {timer.isExpired ? 'Done' : 'Running'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
