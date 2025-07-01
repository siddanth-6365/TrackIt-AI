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

<img width="400" alt="Screenshot 2025-07-01 at 9 44 53 PM" src="https://github.com/user-attachments/assets/f983f6c3-aefd-4e06-953f-7b1c59691cc1" />
<img width="400" alt="Screenshot 2025-07-01 at 9 46 41 PM" src="https://github.com/user-attachments/assets/d89f8602-d6d1-4231-a361-47fd45db8165" />
<img width="400" alt="Screenshot 2025-07-01 at 9 46 09 PM" src="https://github.com/user-attachments/assets/16aa0a36-8fb7-4afd-97f6-ef5462973260" />
<img width="400" alt="Screenshot 2025-07-01 at 9 45 39 PM" src="https://github.com/user-attachments/assets/4947b744-49d8-4593-8c0b-bdcf3d3d51a0" />

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
