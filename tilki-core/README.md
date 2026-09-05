# TILKI CORE

Jarvis-inspired personal AI command center with voice input, spoken replies, a task queue, persistent memory, safe local tools, and optional OpenAI Responses API integration.

## Run locally

Requires Node.js 20+.

```bash
cd tilki-core
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## Enable OpenAI mode

Edit `.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
PORT=3000
```

`.env` is git-ignored. Never commit the API key.

## Test

```bash
npm test
```

## Current capabilities

- Browser voice recognition in Chrome/Edge
- Browser text-to-speech
- Local task creation and completion
- Persistent notes/memory
- Activity feed
- Open GitHub, Gmail, Calendar, LinkedIn, ChatGPT
- Optional OpenAI tool-using conversation
- Server-side key isolation

## Next target

Use GitHub Copilot cloud agent from branch `tilki-core-v1` to harden this into a deployable personal agent. See the repository issue titled **Make TILKI CORE production-ready personal AI agent**.
