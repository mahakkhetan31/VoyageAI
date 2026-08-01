import { useState, type FormEvent, type KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

function ChatInput({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <div className="chat-input__wrapper">
        <textarea
          id="chat-input-field"
          className="chat-input__field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message VoyageAI..."
          rows={1}
          disabled={disabled}
        />
        <button
          type="submit"
          className="chat-input__send"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="chat-input__hint">
        Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
      </p>
    </form>
  );
}

export default ChatInput;
