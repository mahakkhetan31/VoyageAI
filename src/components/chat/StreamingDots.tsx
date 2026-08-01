function StreamingDots() {
  return (
    <div className="chat-message chat-message--assistant">
      <div className="chat-message__avatar">V</div>
      <div className="chat-message__bubble">
        <div className="chat-message__role">VoyageAI</div>
        <div className="streaming-dots">
          <span className="streaming-dots__dot" />
          <span className="streaming-dots__dot" />
          <span className="streaming-dots__dot" />
        </div>
      </div>
    </div>
  );
}

export default StreamingDots;
