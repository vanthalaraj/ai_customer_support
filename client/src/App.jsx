import { useEffect, useRef, useState } from "react";
import { STRINGS } from "./i18n.js";
import { useChat } from "./hooks/useChat.js";
import { useServerStatus } from "./hooks/useServerStatus.js";
import Sidebar from "./components/Sidebar.jsx";
import Message from "./components/Message.jsx";
import Composer from "./components/Composer.jsx";

export default function App() {
  const [language, setLanguage] = useState("en");
  const t = STRINGS[language];
  const status = useServerStatus();
  const { messages, loading, error, send, retry, clear } = useChat(language);
  const endRef = useRef(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  function download() {
    const lines = messages.map(
      (m) => `${m.role === "user" ? t.you : t.assistant}: ${m.content}`
    );
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "support-chat.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const empty = messages.length === 0;
  const canRetry = !loading && error && messages[messages.length - 1]?.role === "user";

  return (
    <div className="app">
      <Sidebar
        t={t}
        language={language}
        onLanguage={setLanguage}
        status={status}
        hasMessages={!empty}
        loading={loading}
        onClear={clear}
        onDownload={download}
      />

      <main className="chat">
        <div className="messages" aria-live="polite">
          {empty && (
            <section className="welcome">
              <h2>{t.heading}</h2>
              <p>{t.sub}</p>
              <p className="side-label">{t.suggestionsLabel}</p>
              <ul className="suggestions">
                {t.suggestions.map((q) => (
                  <li key={q}>
                    <button type="button" onClick={() => send(q)}>
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {messages.map((m) => (
            <Message key={m.id} message={m} t={t} />
          ))}

          {loading && (
            <div className="typing" role="status" aria-label={t.thinking}>
              <span />
              <span />
              <span />
            </div>
          )}

          {error && (
            <div className="error" role="alert">
              <p>{error}</p>
              {canRetry && (
                <button type="button" className="link-btn" onClick={retry}>
                  {t.retry}
                </button>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <Composer t={t} loading={loading} onSend={send} />
      </main>
    </div>
  );
}
