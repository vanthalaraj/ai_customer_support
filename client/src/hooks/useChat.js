import { useCallback, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";
let counter = 0;
const newId = () => `m${Date.now()}-${counter++}`;

/**
 * Holds the conversation and talks to POST /api/chat.
 * The full history is sent each time; the server trims it to the latest messages.
 */
export function useChat(language) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(
    async (history) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            language,
          }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch {
          /* non-JSON error body */
        }
        if (!res.ok) throw new Error(data.error || "Unable to get a response.");

        setMessages([...history, { id: newId(), role: "assistant", content: data.reply }]);
      } catch (err) {
        setError(
          err instanceof TypeError
            ? "Can't reach the server. Make sure the backend is running on port 3001."
            : err.message || "Network error. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  const send = useCallback(
    (text) => {
      const content = text.trim();
      if (!content || loading) return false;
      const next = [...messages, { id: newId(), role: "user", content }];
      setMessages(next);
      request(next);
      return true;
    },
    [messages, loading, request]
  );

  const retry = useCallback(() => {
    if (loading || messages.length === 0) return;
    if (messages[messages.length - 1].role === "user") request(messages);
  }, [messages, loading, request]);

  const clear = useCallback(() => {
    if (loading) return;
    setMessages([]);
    setError("");
  }, [loading]);

  return { messages, loading, error, send, retry, clear };
}
