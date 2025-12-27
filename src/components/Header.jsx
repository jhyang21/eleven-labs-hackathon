export default function Header({ status }) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">Voice AI Cooking Assistant</p>
        <h1>Hands-free recipe guidance</h1>
        <p className="status">Status: {status}</p>
      </div>
      <div className="chip">ElevenLabs Voice Agent Ready</div>
    </header>
  );
}
