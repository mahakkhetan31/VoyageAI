import { useState, useEffect, useRef, type FormEvent, type DragEvent } from "react";
import { documentsApi, type DocumentResponse, type AskResponse } from "../api/documents";
import { useToast } from "../context/ToastContext";

function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    documentsApi
      .list()
      .then((res) => setDocuments(res.data))
      .catch(() => {});
  }, []);

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Only PDF files are accepted", "error");
      return;
    }
    setUploading(true);
    try {
      const res = await documentsApi.upload(file);
      setDocuments((prev) => [res.data, ...prev]);
      setSelectedDoc(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Upload failed";
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    if (!selectedDoc || !question.trim()) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await documentsApi.ask(selectedDoc.id, question.trim());
      setAnswer(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to get answer";
      showToast(msg, "error");
    } finally {
      setAsking(false);
    }
  }

  async function handleDelete(docId: number) {
    try {
      await documentsApi.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setAnswer(null);
      }
      showToast("Document deleted", "success");
    } catch {
      showToast("Failed to delete document", "error");
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="docs-page">
      <div className="docs-container">
        {/* Header */}
        <header className="docs-header">
          <h1 className="docs-header__title">📄 Documents</h1>
          <p className="docs-header__subtitle">Upload PDFs and ask questions about them</p>
        </header>

        {/* Upload Area */}
        <div
          className={`docs-upload ${dragActive ? "docs-upload--active" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="docs-upload__input"
          />
          {uploading ? (
            <div className="docs-upload__status">
              <div className="docs-upload__spinner" />
              <span>Processing PDF...</span>
            </div>
          ) : (
            <>
              <div className="docs-upload__icon">📎</div>
              <p className="docs-upload__text">
                Drag & drop a PDF here, or <span className="docs-upload__link">click to browse</span>
              </p>
            </>
          )}
        </div>

        {/* Document List */}
        <div className="docs-grid">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`docs-card ${selectedDoc?.id === doc.id ? "docs-card--selected" : ""}`}
              onClick={() => { setSelectedDoc(doc); setAnswer(null); setQuestion(""); }}
            >
              <div className="docs-card__icon">📄</div>
              <div className="docs-card__info">
                <h3 className="docs-card__name">{doc.original_name}</h3>
                <div className="docs-card__meta">
                  <span>{formatSize(doc.file_size)}</span>
                  <span>·</span>
                  <span>{doc.page_count} pages</span>
                  <span>·</span>
                  <span>{doc.chunk_count} chunks</span>
                </div>
                <span className={`docs-card__status docs-card__status--${doc.status}`}>
                  {doc.status}
                </span>
              </div>
              <button
                className="docs-card__delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                aria-label="Delete document"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Q&A Interface */}
        {selectedDoc && selectedDoc.status === "ready" && (
          <div className="docs-qa">
            <h2 className="docs-qa__title">
              Ask about: <span>{selectedDoc.original_name}</span>
            </h2>
            <form className="docs-qa__form" onSubmit={handleAsk}>
              <input
                type="text"
                className="docs-qa__input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about this document?"
                disabled={asking}
              />
              <button type="submit" className="docs-qa__btn" disabled={asking || !question.trim()}>
                {asking ? "Thinking..." : "Ask"}
              </button>
            </form>

            {answer && (
              <div className="docs-qa__answer">
                <h3 className="docs-qa__answer-label">Answer</h3>
                <p className="docs-qa__answer-text">{answer.answer}</p>

                {answer.source_chunks.length > 0 && (
                  <details className="docs-qa__sources">
                    <summary className="docs-qa__sources-label">
                      📚 {answer.source_chunks.length} source chunks
                    </summary>
                    <div className="docs-qa__sources-list">
                      {answer.source_chunks.map((chunk, i) => (
                        <blockquote key={i} className="docs-qa__chunk">
                          {chunk}
                        </blockquote>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;
