// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.OLLAMA_API_KEY;
const MODEL = process.env.OLLAMA_MODEL || "gemma4:31b";
const ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const MAX_HISTORY = 12; // most recent messages sent to the model
const MAX_CONTENT = 4000; // characters per message
const REQUEST_TIMEOUT_MS = 60_000;

app.use(cors({ origin: ORIGINS }));
app.use(express.json({ limit: "100kb" }));

// ---- Minimal in-memory rate limiter (per IP, 30 requests / minute) ----
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + 60_000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 30) {
    return res.status(429).json({
      error: "Too many messages. Please wait a minute and try again.",
    });
  }
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) if (entry.reset < now) hits.delete(key);
}, 60_000).unref();

const BASE_PROMPT =
  "You are a helpful customer-support assistant. " +
  "Be polite and concise. Do not invent order status, " +
  "refund outcomes, company policies, or account details. " +
  "If business-specific information is unavailable, say so " +
  "and offer to connect the customer with a human agent.";

const LANGUAGE_PROMPTS = {
  en: "Reply in English.",
  te: "Reply in Telugu (తెలుగు) unless the customer clearly writes in another language.",
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", configured: Boolean(API_KEY), model: MODEL });
});

app.post("/api/chat", rateLimit, async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "Server configuration is missing the Ollama API key.",
      });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Please provide at least one message." });
    }

    // Allow only supported roles and plain-text content.
    const allowedRoles = new Set(["user", "assistant"]);
    const validMessages = messages
      .slice(-MAX_HISTORY)
      .filter(
        (m) =>
          m &&
          allowedRoles.has(m.role) &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, MAX_CONTENT),
      }));

    if (
      validMessages.length === 0 ||
      validMessages[validMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "The latest message must be a valid user message.",
      });
    }

    const lang = LANGUAGE_PROMPTS[req.body?.language] ? req.body.language : "en";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch("https://ollama.com/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: `${BASE_PROMPT} ${LANGUAGE_PROMPTS[lang]}` },
            ...validMessages,
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      // Log only the status code; never log API keys or private messages.
      console.error("Ollama Cloud request failed:", response.status);
      return res.status(502).json({
        error: "The AI service could not complete the request. Please try again.",
      });
    }

    const data = await response.json();
    const reply = data?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({ error: "The AI service returned an empty response." });
    }

    return res.json({ reply: reply.trim() });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "The AI service took too long to respond. Please try again.",
      });
    }
    console.error("Chat endpoint error:", error.message);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Chatbot backend running on http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn("OLLAMA_API_KEY is not set. Copy server/.env.example to server/.env.");
  }
});
