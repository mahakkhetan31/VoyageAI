function ChatWelcome() {
  return (
    <div className="chat-welcome">
      <div className="chat-welcome__icon">✈️</div>
      <h2 className="chat-welcome__title">VoyageAI</h2>
      <p className="chat-welcome__subtitle">Your AI travel planning assistant</p>
      <div className="chat-welcome__suggestions">
        <button className="chat-welcome__suggestion">
          🗺️ Plan a 5-day trip to Tokyo
        </button>
        <button className="chat-welcome__suggestion">
          🏖️ Best beaches in Southeast Asia
        </button>
        <button className="chat-welcome__suggestion">
          💰 Budget travel tips for Europe
        </button>
        <button className="chat-welcome__suggestion">
          🎒 Packing list for a hiking trip
        </button>
      </div>
    </div>
  );
}

export default ChatWelcome;
