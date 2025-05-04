# TrackIt‑AI

This project turns incoming receipt images into structured expense data, stores it in SQL database, and lets users ask about their spendings with natural language and get the insights.

---

## Stack / Technologies

| Layer        | Tech                                                                 |
|--------------|----------------------------------------------------------------------|
| **LLM (receipt parsing & categorization)** | Groq‑hosted **`meta‑llama/llama‑4‑scout‑17b‑16e‑instruct`** |
| **Text‑to‑SQL** | sqlcoder-7b-2    |
| **OCR**      | Tesseract                                                            |
| **Backend API** | Python + FastAPI + asyncio                                       |
| **Database** | Supabase PostgresSQL                |
| **Frontend** | Next.js + Tailwind / shadcn                  |

---
### Demo Images 
<img width="1710" alt="Screenshot 2025-04-22 at 12 00 10 PM" src="https://github.com/user-attachments/assets/c112ecbf-d3b6-47d5-a9d5-e9ac20edf0b7" />
<img width="1710" alt="Screenshot 2025-04-22 at 12 00 26 PM" src="https://github.com/user-attachments/assets/18aa4b03-7c33-42c6-912f-6b10111c54cc" />
<img width="1710" alt="Screenshot 2025-04-22 at 12 03 36 PM" src="https://github.com/user-attachments/assets/bb757277-cd51-4702-8dbf-f647e7d8ee94" />
---

## API Routes

| Method | Path                          | Purpose                                      |
|--------|-------------------------------|----------------------------------------------|
| `POST` | `/users/signup`               | create user `{email,password,name}`          |
| `POST` | `/users/login`                | returns `{id,email,name}`                    |
| `POST` | `/receipts/upload` _(multipart)_ | upload receipt `file` + `user_id`        |
| `GET`  | `/receipts/user/{user_id}`    | list receipts by user                        |
| `POST` | `/receipts/extract`           | extract data without saving                  |
| `POST` | `/receipts/save`              | save structured receipt JSON                 |
| `POST` | `/query`                      | NL ➜ SQL ➜ Supabase (with `user_id`)         |

---

## Project Road‑Map

1. ✅ Auth + receipt ingestion + DB save  
2. ✅ List receipts per user  
3. ✅ NL query ➜ text‑to‑SQL  
4. ✅ Telegram bot integration  
5. ⏳ Budget alerts & email/WA notifications

## Local Setup (dev)

```bash
git clone https://github.com/your‑handle/trackit-ai
cd trackit-ai

# ---------- backend ----------
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload             # API → http://localhost:8000

# ---------- frontend ----------
cd frontend
npm install
npm dev                                       # Web → http://localhost:3000
```

# ---------- telegram-bot ----------
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py


Environment variables you’ll need:

```
# backend/.env
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=service_role_or_anon_key

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

# telegram-bot/.env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

