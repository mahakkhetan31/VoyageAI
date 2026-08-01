import client from "./client";

export interface ChatSessionResponse {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSessionDetailResponse extends ChatSessionResponse {
  messages: MessageResponse[];
}

export const chatApi = {
  createSession: (title = "New Chat") =>
    client.post<ChatSessionResponse>("/chat/sessions", { title }),

  listSessions: () =>
    client.get<ChatSessionResponse[]>("/chat/sessions"),

  getSession: (sessionId: number) =>
    client.get<ChatSessionDetailResponse>(`/chat/sessions/${sessionId}`),

  deleteSession: (sessionId: number) =>
    client.delete(`/chat/sessions/${sessionId}`),

  sendMessage: (sessionId: number, content: string) =>
    client.post<MessageResponse>(`/chat/sessions/${sessionId}/messages`, { content }),

  getMessages: (sessionId: number) =>
    client.get<MessageResponse[]>(`/chat/sessions/${sessionId}/messages`),
};
