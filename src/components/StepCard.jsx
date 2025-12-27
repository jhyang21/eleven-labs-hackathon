export default function StepCard({ step, phaseLabel, readyPromptVisible }) {
  return (
    <div className="step-card">
      <p className="phase-label">{phaseLabel}</p>
      <p className="step-label">CURRENT STEP</p>
      {step ? (
        <p className="step-text">{step}</p>
      ) : (
        <p className="muted">Paste a recipe to start cooking.</p>
      )}
      {readyPromptVisible && <p className="ready-prompt">Ready when you are.</p>}
    </div>
  );
}
