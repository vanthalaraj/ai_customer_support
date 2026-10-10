import { useState } from "react";
import RichText from "./RichText.jsx";

export default function Message({ message, t }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <article className={`message ${message.role}`}>
      <div className="message-meta">
        <span>{isUser ? t.you : t.assistant}</span>
        {!isUser && (
          <button type="button" className="link-btn" onClick={copy}>
            {copied ? t.copied : t.copy}
          </button>
        )}
      </div>
      <div className="bubble">
        {isUser ? <p>{message.content}</p> : <RichText text={message.content} />}
      </div>
    </article>
  );
}
