# TrackIt‑AI

A personal project that transforms receipt images into structured expense data and provides a conversational AI assistant for exploring and analyzing your spending.
### Demo: [Watch the project demo video](https://youtu.be/ki9gguv20kc)

## Key Features

- Receipt Extraction: Upload a photo of a receipt and receive a parsed JSON with merchant, items, amounts, and category.
- Conversational AI Assistant: Chat with your own expense assistant to ask questions, run SQL queries, and get data-driven insights.

## Tech Stack

| Layer                               | Tech                                                                                         |
|-------------------------------------|----------------------------------------------------------------------------------------------|
| **LLM (receipt parsing & categorization)** |  **`meta‑llama/llama‑4` models via API**                             |
| **Text‑to‑SQL**                     |[ **`sqlcoder-7b-2`**](https://huggingface.co/defog/sqlcoder-7b-2) via workers AI             |
| **Agents & Routing**             |   Custom multi-agent system (SQLAgent, AnalysisAgent)                                                  |
| **OCR**                             | Mistral OCR (fallback: tesseract)                                                             |
| **Backend API**                     | Python + FastAPI + asyncio                                                                    |
| **Database**                        | Supabase Postgres                                                    |
| **Frontend**                        | Next.js + Tailwind / shadcn                                            |

---

### Demo Images

<img src="https://github.com/user-attachments/assets/c112ecbf-d3b6-47d5-a9d5-e9ac20edf0b7" alt="Screenshot 1" width="500" />
<img src="https://github.com/user-attachments/assets/18aa4b03-7c33-42c6-912f-6b10111c54cc" alt="Screenshot 2" width="500" />
<img width="500" alt="Screenshot 2025-05-05 at 12 43 07 PM" src="https://github.com/user-attachments/assets/9ac2c56e-d2e6-47fc-a5ec-0a8498b43841" />
<img width="500" alt="Screenshot 2025-05-05 at 12 23 36 PM" src="https://github.com/user-attachments/assets/1d45ffa9-f7e3-4b1c-ab76-e94dd93ac678" />

---
### Receipt Extraction Workflow

1. **Upload** a receipt image to `POST /receipts/extract`.
2. **OCR**: `ocr_service.do_ocr` uses Mistral OCR to extract raw text.
3. **LLM Parsing**:

   * `call_extract_details` maps lines to structured fields (date, total, items).
   * `call_expense_category` classifies the receipt category.
4. **Response**: Returns an `ExtractedReceipt` JSON with all fields.

---

### Saving Receipts

* Endpoint: `POST /receipts/save` accepts extracted JSON and image file.
* **Upload image** to S3.
* **Persist** structured data into two tables: `receipts` and `receipt_items`.
* Returns a full `ReceiptOut` model with all stored fields.

---

### Conversational AI Assistant

* **Endpoints** under `/conversations` to create, fetch, and delete chat sessions.
* **Chat**: `POST /conversations/{id}/chat`

  * **ConversationMemory** loads history.
  * **QueryClassifier** determines if a question is SQL, analysis, or hybrid.
  * **SQLAgent** uses `sqlcoder-7b` to generate SQL, runs it against Supabase, and formats results.
  * **AnalysisAgent** pulls summary data (last 90 days) and uses LLM to generate insights and recommendations.
  * **ConversationalQueryEngine** orchestrates routing and returns responses with metadata (SQL used, agent, row count).
---

## Local Setup (dev)

```bash
git clone https://github.com/your-handle/trackit-ai

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
