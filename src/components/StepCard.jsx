export default function StepCard({ step, phase, note }) {
  return (
    <section className="step-card">
      <p className="phase">{phase}</p>
      <p className="step-label">Current step</p>
      <p className="step-text">{step || 'Paste a recipe to start cooking.'}</p>
      {note ? <p className="step-note">{note}</p> : null}
    </section>
  );
}
