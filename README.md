# AI-Based Customer Support Chatbot

React JS + Node.js/Express + Ollama Cloud API.

```
Browser (React) → Express backend (/api/chat) → https://ollama.com/api/chat
```

The API key lives only on the server (`server/.env`). The browser never sees it.

## Features

- Chat window with user and assistant messages, typing indicator and error state with **Try again**
- Suggested questions, **Enter** to send (**Shift+Enter** for a new line), auto-growing input
- English / Telugu reply language switch (UI text switches too)
- Recent conversation sent as context (last 12 messages, 4000 characters each)
- Live server status (online / API key missing / offline)
- Copy an answer, download the transcript, clear the chat
- Backend: input validation, request size limit, per-IP rate limit, 60 s timeout, controlled error messages
- The assistant is instructed not to invent order status, refunds, policies or account details

## Setup

Requires **Node.js 18+** and an Ollama account with an API key.

```bash
# 1. Install everything (root, server and client)
npm run install:all

# 2. Add your key
cp server/.env.example server/.env      # Windows: copy server\.env.example server\.env
#    then open server/.env and set OLLAMA_API_KEY (and OLLAMA_MODEL if needed)

# 3. Run backend and frontend together
npm run dev
```

Open http://localhost:5173. The backend runs on http://localhost:3001
(check `http://localhost:3001/api/health`).

To run them separately: `npm run server` and `npm run client` in two terminals.

## Project structure

```
customer-support-chatbot/
├── package.json            # root scripts (install:all, dev)
├── server/
│   ├── server.js           # Express API: POST /api/chat, GET /api/health
│   ├── package.json
│   └── .env.example        # copy to .env
└── client/
    ├── index.html
    ├── vite.config.js      # proxies /api to the backend in development
    └── src/
        ├── App.jsx
        ├── App.css
        ├── i18n.js         # English + Telugu text and suggestions
        ├── hooks/
        │   ├── useChat.js          # conversation state + API calls
        │   └── useServerStatus.js  # health polling
        └── components/
            ├── Sidebar.jsx
            ├── Message.jsx
            ├── RichText.jsx        # safe bold/list rendering (no HTML injection)
            └── Composer.jsx
```

## Configuration (`server/.env`)

| Variable         | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `OLLAMA_API_KEY` | Your Ollama API key (required)                       |
| `OLLAMA_MODEL`   | Cloud model name, default `gemma4:31b`               |
| `PORT`           | Backend port, default `3001`                         |
| `CLIENT_ORIGIN`  | Allowed browser origin(s), default `http://localhost:5173` |

Model availability and usage limits can change. Confirm your model in Ollama's
cloud documentation.

## Test checklist (from the project documentation)

- Greeting, general question, follow-up question (context)
- Ask in Telugu (switch the language toggle)
- Empty message (Send stays disabled)
- Stop the backend → friendly error appears
- Remove the API key → status shows "Server needs an API key" and sending returns a configuration error
- Ask "Where is my order?" → the bot should say it cannot verify, not invent a status

## Before deploying publicly

Add authentication where appropriate, production CORS (`CLIENT_ORIGIN`), HTTPS,
a persistent rate limiter, monitoring, and serve the built client
(`npm run build`) from a host that forwards `/api` to the backend
(or set `VITE_API_URL` at build time).
