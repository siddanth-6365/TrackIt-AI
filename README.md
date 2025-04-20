# TrackIt‑AI

A learning‑focused side‑project that turns incoming receipt images (web upload or WhatsApp) into structured expense data, stores it in Supabase Postgres, and lets users query their spending with natural language.

---

## Stack / Technologies

| Layer | Tech |
|-------|------|
| **OCR** | Tesseract (fallback) or doctr (vision transformer) |
| **LLM (receipt parsing & categorization)** | Groq‑hosted **`meta‑llama/llama‑4‑scout‑17b‑16e‑instruct`** |
| **Text‑to‑SQL** | Google **`gemini‑1.5‑pro‑latest`** (planned) |
| **Backend API** | Python + FastAPI + asyncio |
| **Database** | Supabase Postgres (REST interface via supabase‑py) |
| **Frontend** | Next.js (React 18, App Router) + Tailwind / shadcn |
| **Messaging** | Twilio WhatsApp Webhook (future) |

---

## Local Setup (dev)

```bash
git clone https://github.com/your‑handle/trackit-ai
cd trackit-ai

# ---------- backend ----------
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env          # add keys
uvicorn backend.main:app --reload             # API → http://localhost:8000

# ---------- frontend ----------
cd frontend
pnpm install
cp .env.local.example .env.local              # NEXT_PUBLIC_API_URL etc.
pnpm dev                                       # Web → http://localhost:3000
```

Environment variables you’ll need:

```
# backend/.env
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=service_role_or_anon_key
PW_SALT=some_random_string

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Routes (current MVP)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/users/signup` | create user `{email,password,name}` |
| `POST` | `/users/login`  | returns `{id,email,name}` |
| `POST` | `/receipts/upload` _(multipart)_ | upload receipt `file` + `user_id` |
| `GET`  | `/receipts/user/{user_id}` | list receipts (limit/offset) |

More routes (text‑query, budgets, WhatsApp webhook) coming next.

---

## Project Road‑Map

1. ✅ Auth + receipt ingestion + DB save  
2. ✅ List receipts per user  
3. ⏳  NL query ➜ Gemini text‑to‑SQL  
4. ⏳  WhatsApp gateway integration  
5. ⏳  Budget alerts & email/WA notifications  
