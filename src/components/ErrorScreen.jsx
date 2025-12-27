export default function ErrorScreen({ onRetry }) {
  return (
    <div className="error-screen">
      <div className="error-card">
        <h1>We couldn’t read this recipe</h1>
        <p>Try another link or a different site</p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
