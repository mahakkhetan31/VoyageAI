import client from "./client";

export interface DocumentResponse {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface AskResponse {
  answer: string;
  source_chunks: string[];
}

export const documentsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post<DocumentResponse>("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  list: () => client.get<DocumentResponse[]>("/documents/"),

  ask: (documentId: number, question: string) =>
    client.post<AskResponse>(`/documents/${documentId}/ask`, { question }),

  delete: (documentId: number) =>
    client.delete(`/documents/${documentId}`),
};
