import { useState } from "react";

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  onToggle,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="chat-sidebar-overlay" onClick={onToggle} />}

      <aside className={`chat-sidebar ${isOpen ? "chat-sidebar--open" : ""}`}>
        <div className="chat-sidebar__header">
          <h2 className="chat-sidebar__title">Chats</h2>
          <button className="chat-sidebar__close" onClick={onToggle} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        <button className="chat-sidebar__new-btn" onClick={onNewChat}>
          <span className="chat-sidebar__new-icon">+</span>
          New Chat
        </button>

        <nav className="chat-sidebar__list">
          {sessions.length === 0 && (
            <p className="chat-sidebar__empty">No conversations yet</p>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`chat-sidebar__item ${
                session.id === activeSessionId ? "chat-sidebar__item--active" : ""
              }`}
              onClick={() => onSelectSession(session.id)}
              onMouseEnter={() => setHoveredId(session.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span className="chat-sidebar__item-icon">💬</span>
              <div className="chat-sidebar__item-content">
                <span className="chat-sidebar__item-title">{session.title}</span>
                <span className="chat-sidebar__item-date">{session.updatedAt}</span>
              </div>
              {hoveredId === session.id && (
                <span className="chat-sidebar__item-indicator">›</span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default ChatSidebar;
