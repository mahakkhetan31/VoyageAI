import { useState, useRef, useEffect, useCallback } from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import ChatWelcome from "../components/chat/ChatWelcome";
import StreamingDots from "../components/chat/StreamingDots";
import { chatApi, type MessageResponse, type ChatSessionResponse } from "../api/chat";
import { useToast } from "../context/ToastContext";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface LocalSession {
  id: number;
  title: string;
  updatedAt: string;
  messages: LocalMessage[];
}

function toLocalMessage(m: MessageResponse): LocalMessage {
  return { id: String(m.id), role: m.role, content: m.content };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  return d.toLocaleDateString();
}

function ChatPage() {
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages.length, isStreaming, scrollToBottom]);

  // Load sessions from backend on mount
  useEffect(() => {
    chatApi
      .listSessions()
      .then((res) => {
        const loaded = res.data.map((s: ChatSessionResponse) => ({
          id: s.id,
          title: s.title,
          updatedAt: formatDate(s.updated_at),
          messages: [],
        }));
        setSessions(loaded);
        setBackendAvailable(true);
      })
      .catch(() => {
        setBackendAvailable(false);
        showToast("Backend unavailable, using local mock mode.", "info");
      });
  }, []);

  // Load messages when switching sessions
  useEffect(() => {
    if (!activeSessionId || !backendAvailable) return;

    const session = sessions.find((s) => s.id === activeSessionId);
    if (session && session.messages.length > 0) return; // already loaded

    chatApi
      .getMessages(activeSessionId)
      .then((res) => {
        const msgs = res.data.map(toLocalMessage);
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, messages: msgs } : s))
        );
      })
      .catch(() => {
        showToast("Failed to load messages for this session.", "error");
      }); 
  }, [activeSessionId, backendAvailable, sessions]);

  async function createNewChat() {
    if (backendAvailable) {
      try {
        const res = await chatApi.createSession();
        const newSession: LocalSession = {
          id: res.data.id,
          title: res.data.title,
          updatedAt: "Just now",
          messages: [],
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setSidebarOpen(false);
        return;
      } catch {
        showToast("Failed to create chat on server. Using local mode.", "error");
        // fallback to local
      }
    }

    // Local fallback
    const localId = -Date.now();
    const newSession: LocalSession = {
      id: localId,
      title: "New Chat",
      updatedAt: "Just now",
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(localId);
    setSidebarOpen(false);
  }

  async function handleSend(content: string) {
    if (!activeSessionId) return;

    // Optimistic: show user message immediately
    const tempUserMsg: LocalMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: [...s.messages, tempUserMsg],
          updatedAt: "Just now",
          title: s.messages.length === 0 ? content.slice(0, 40) : s.title,
        };
      })
    );

    setIsStreaming(true);

    if (backendAvailable) {
      try {
        // Backend stores user message, builds conversation context,
        // and returns the assistant response
        await chatApi.sendMessage(activeSessionId, content);

        // Reload messages to get the stored user message with real ID
        const msgRes = await chatApi.getMessages(activeSessionId);
        const allMessages = msgRes.data.map(toLocalMessage);

        // Reload session to get updated title
        const sessionRes = await chatApi.getSession(activeSessionId);

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: allMessages, title: sessionRes.data.title, updatedAt: "Just now" }
              : s
          )
        );

        setIsStreaming(false);
        return;
      } catch {
        showToast("Failed to send message to server. Using local mock.", "error");
        // fallback to local mock
      }
    }

    // Local fallback with mock response
    setTimeout(() => {
      const mockResponses = [
        "That sounds like an amazing trip! Let me help you plan the perfect itinerary.",
        "Great question! I'd suggest allocating your budget carefully for this destination.",
        "I'd love to help with that! Let me consider the best options for you.",
      ];
      const reply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const assistantMsg: LocalMessage = {
        id: `temp-${Date.now() + 1}`,
        role: "assistant",
        content: reply,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, assistantMsg] }
            : s
        )
      );
      setIsStreaming(false);
    }, 1200);
  }

  const handleDeleteSession = useCallback(async (sessionId: number) => {
    if (backendAvailable) {
      try {
        await chatApi.deleteSession(sessionId);
        showToast("Chat deleted successfully.", "success");
      } catch {
        showToast("Failed to delete chat on server.", "error");
        // continue with local removal
      }
    }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }, [backendAvailable, activeSessionId]);

  // Will be wired to sidebar delete button
  void handleDeleteSession;

  return (
    <div className="chat-layout">
      <ChatSidebar
        sessions={sessions.map(({ id, title, updatedAt }) => ({
          id: String(id),
          title,
          updatedAt,
        }))}
        activeSessionId={activeSessionId !== null ? String(activeSessionId) : null}
        onSelectSession={(id) => {
          setActiveSessionId(Number(id));
          setSidebarOpen(false);
        }}
        onNewChat={createNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="chat-main">
        {/* Mobile header */}
        <header className="chat-header">
          <button
            className="chat-header__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="chat-header__title">
            {activeSession?.title || "VoyageAI"}
          </h1>
          <button className="chat-header__new" onClick={createNewChat} aria-label="New chat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </header>

        {/* Messages area */}
        <div className="chat-messages">
          {activeSession && activeSession.messages.length === 0 && !isStreaming && (
            <ChatWelcome />
          )}

          {activeSession?.messages.map((msg, index) => (
            <ChatMessage 
              key={msg.id} 
              role={msg.role} 
              content={msg.content} 
              animate={msg.role === 'assistant' && index === activeSession.messages.length - 1} 
            />
          ))}

          {isStreaming && <StreamingDots />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </main>
    </div>
  );
}

export default ChatPage;
