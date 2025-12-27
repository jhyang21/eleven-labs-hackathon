export default function LandingScreen({ recipeUrl, onChangeRecipeUrl, onSubmit, isParsing }) {
  return (
    <div className="landing">
      <div className="landing-card">
        <h1>Voice AI Cooking Assistant</h1>
        <p className="subtitle">Paste a recipe link to begin a hands-free cooking session.</p>
        <div className="input-stack">
          <input
            type="url"
            placeholder="Paste a recipe link"
            value={recipeUrl}
            onChange={(event) => onChangeRecipeUrl(event.target.value)}
          />
          <button type="button" onClick={onSubmit} disabled={isParsing}>
            {isParsing ? 'Preparing…' : 'Start cooking'}
          </button>
        </div>
        {isParsing && <p className="hint">Preparing your cooking session…</p>}
      </div>
    </div>
  );
}
