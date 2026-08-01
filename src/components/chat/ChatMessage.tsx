import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTypewriter } from '../../hooks/useTypewriter';

interface Props {
  role: "user" | "assistant";
  content: string;
  animate?: boolean;
}

function ChatMessage({ role, content, animate = false }: Props) {
  const isAssistant = role === "assistant";
  const { displayedText, isTyping } = useTypewriter(content, 20, isAssistant && animate);

  return (
    <div className={`chat-message chat-message--${role}`}>
      <div className="chat-message__avatar">
        {role === "user" ? "Y" : "V"}
      </div>
      <div className="chat-message__bubble">
        <div className="chat-message__role">
          {role === "user" ? "You" : "VoyageAI"}
        </div>
        <div className={`chat-message__content ${isTyping ? 'typing' : ''}`}>
          {isAssistant ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedText + (isTyping ? " ▍" : "")}
            </ReactMarkdown>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
