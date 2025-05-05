# TrackIt‑AI

This project turns receipt images into structured expense data, stores it in Supabase Postgres, and lets users ask natural‑language questions about their spending — now also accessible via Telegram.

---

## Stack / Technologies

| Layer                               | Tech                                                                                         |
|-------------------------------------|----------------------------------------------------------------------------------------------|
| **LLM (receipt parsing & categorization)** |  **`meta‑llama/llama‑4` models API**                             |
| **Text‑to‑SQL**                     | **`sqlcoder-7b-2`** via Cloudflare AI (HuggingFace: defog/sqlcoder-7b-2)                      |
| **OCR**                             | Tesseract                                                                           |
| **Backend API**                     | Python + FastAPI + asyncio                                                                    |
| **Database**                        | Supabase Postgres                                                    |
| **Frontend**                        | Next.js + Tailwind / shadcn                                            |
| **Messaging**                       | Telegram Bot integration via `python‑telegram‑bot`                                            |

---

### Demo Images

<img src="https://github.com/user-attachments/assets/c112ecbf-d3b6-47d5-a9d5-e9ac20edf0b7" alt="Screenshot 1" width="500" />
<img src="https://github.com/user-attachments/assets/18aa4b03-7c33-42c6-912f-6b10111c54cc" alt="Screenshot 2" width="500" />
<img width="500" alt="Screenshot 2025-05-05 at 12 43 07 PM" src="https://github.com/user-attachments/assets/9ac2c56e-d2e6-47fc-a5ec-0a8498b43841" />
<img width="500" alt="Screenshot 2025-05-05 at 12 23 36 PM" src="https://github.com/user-attachments/assets/1d45ffa9-f7e3-4b1c-ab76-e94dd93ac678" />

---

## API Routes

| Method | Path                          | Purpose                                      |
|--------|-------------------------------|----------------------------------------------|
| `GET`  | `/receipts/user/{user_id}`    | list receipts by user                        |
| `POST` | `/receipts/extract`           | extract data only (preview)                  |
| `POST` | `/receipts/save`              | save structured receipt JSON                 |
| `POST` | `/receipts/telegram_upload`   | OCR + LLM extract → save via Telegram bot     |
| `POST` | `/query/ask`                  | NL query → SQLCoder → execute → summary       |

---

## Project Road‑Map

1. ✅ Auth + receipt ingestion + DB save  
2. ✅ List receipts per user  
3. ✅ NL query → text‑to‑SQL via **sqlcoder‑7b‑2**  
4. ✅ Telegram bot integration (upload & query)  
5. ⏳ Budget alerts & email/WhatsApp notifications

---

## Local Setup (dev)

```bash
git clone https://github.com/your-handle/trackit-ai
d
# ---------- backend ----------
cd trackit-ai/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000

# ---------- frontend ----------
cd ../frontend
npm install
npm run dev               # http://localhost:3000

# ---------- telegram‑bot ----------
cd ../telegram-bot
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py            # runs the Telegram bot
```

### Env Variables

**backend/.env**
```
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_KEY=service_role_or_anon_key
PW_SALT=random_string
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**telegram-bot/.env**
```
TELEGRAM_BOT_TOKEN=your_bot_token
```
