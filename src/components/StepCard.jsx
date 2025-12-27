export default function StepCard({ step, stepIndex, totalSteps, onNext, onRepeat }) {
  return (
    <div className="step-card">
      <h2>Current step</h2>
      {step ? (
        <>
          <p className="step-index">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <p className="step-text">{step}</p>
        </>
      ) : (
        <p className="muted">Parse a recipe to start cooking.</p>
      )}
      <div className="step-actions">
        <button type="button" onClick={onRepeat} disabled={!step}>
          Repeat step
        </button>
        <button type="button" onClick={onNext} disabled={!step}>
          Next step
        </button>
      </div>
    </div>
  );
}
