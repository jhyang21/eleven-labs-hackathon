const radius = 72;
const stroke = 8;
const circumference = 2 * Math.PI * radius;

export default function TimerRing({ timer }) {
  const dashOffset = circumference * (1 - timer.progress);

  return (
    <section className="timer-ring">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#F59E0B"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="timer-center">
        <p className="timer-label">{timer.label}</p>
        <p className="timer-value">{timer.remainingSeconds}s</p>
      </div>
    </section>
  );
}
