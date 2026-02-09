# TrackIt-AI — Architecture (LLD)

> Agentic AI-powered personal expense tracker with receipt OCR, natural language querying, and a multi-agent conversational assistant.

---

## 1. System Overview

TrackIt-AI lets users photograph receipts, automatically extract and categorize expense data, and ask questions about their spending in plain English. The backend is built around three AI-driven pipelines:

| Pipeline | What it does |
|---|---|
| **Receipt Processing** | Image → OCR → LLM extraction + auto-categorization → structured data |
| **NL Query** | Natural language question → SQL generation → execution → friendly explanation |
| **Conversational Agent** | Multi-turn chat with memory, routing queries to specialized agents |

### Tech Stack

- **API:** FastAPI + Uvicorn (async Python)
- **Database:** Supabase (PostgreSQL)
- **Storage:** AWS S3 (receipt images)
- **LLMs:** Groq (Llama family), Cloudflare Workers AI (SQLCoder, Llama 4 Scout)
- **OCR:** Mistral AI (primary), Pytesseract (fallback)
- **Frontend:** Next.js

---

## 2. Component Architecture

```mermaid
flowchart TB
    FE["Frontend (Next.js)"] -->|HTTP / REST| API

    subgraph API["FastAPI Application"]
        direction LR
        R1["Users Router"]
        R2["Receipts Router"]
        R3["Query Router"]
        R4["Conversations Router"]
    end

    subgraph SVC["Service Layer"]
        US["user_service"]
        OCR["ocr_service"]
        LLM["llm_service"]
        RS["receipt_service"]
        QS["query_service"]
        CS["conversation_service"]
        QA["query_agent\n(orchestrator)"]
    end

    subgraph EXT["External Services"]
        DB[("Supabase\nPostgreSQL")]
        S3[("AWS S3")]
        GROQ["Groq API"]
        MIST["Mistral AI"]
        CF["Cloudflare\nWorkers AI"]
    end

    R1 --> US
    R2 --> OCR & LLM & RS
    R3 --> QS
    R4 --> CS & QA

    US & RS & CS --> DB
    RS --> S3
    OCR --> MIST
    LLM & QA --> GROQ
    QS --> CF & DB
    QA --> QS & CS
```

---

## 3. Database Schema

```mermaid
erDiagram
    users {
        uuid id PK
        text email UK
        text password_hash
        text name
    }
    receipts {
        serial id PK
        uuid user_id FK
        text merchant_name
        date transaction_date
        numeric total_amount
        text expense_category
        text image_url
    }
    receipt_items {
        serial id PK
        int receipt_id FK
        text description
        numeric unit_price
        numeric quantity
        numeric line_total "generated"
    }
    conversations {
        uuid id PK
        uuid user_id FK
        text title
        timestamptz updated_at
        int message_count
        boolean is_active
    }
    conversation_messages {
        uuid id PK
        uuid conversation_id FK
        text role "user · assistant · system"
        text content
        jsonb metadata
    }

    users ||--o{ receipts : "has"
    users ||--o{ conversations : "has"
    receipts ||--o{ receipt_items : "contains"
    conversations ||--o{ conversation_messages : "contains"
```

---

## 4. Receipt Processing Pipeline

Two-phase flow: **Extract** (preview for user review) → **Save** (persist after confirmation).

```mermaid
flowchart LR
    IMG["Receipt Image"] --> OCR_SVC{"OCR Service"}

    OCR_SVC -->|primary| MIST["Mistral OCR"]
    OCR_SVC -->|fallback| TESS["Pytesseract"]

    MIST --> TXT["Raw Text"]
    TESS --> TXT

    TXT --> PAR["asyncio.gather()"]

    PAR --> EXT["Detail Extraction\nGroq Llama 4 Scout\n(schema-enforced JSON)"]
    PAR --> CAT["Category Classification\nGroq Llama 4 Scout\n(11 categories)"]

    EXT --> MERGE["Merge → ExtractedReceipt"]
    CAT --> MERGE

    MERGE -->|user reviews| SAVE["Save"]
    SAVE --> S3["S3 Upload"]
    SAVE --> DB["DB Insert\nreceipts + receipt_items"]
```

**Key details:**
- OCR runs in a thread pool (`run_in_executor`) to avoid blocking the async event loop.
- Extraction and categorization run as **parallel LLM calls** to cut latency.
- LLM output uses **JSON schema enforcement** — no brittle regex parsing.

---

## 5. Multi-Agent Conversational System

This is the core agentic architecture. A central orchestrator classifies each user query and routes it to the right specialized agent.

### 5.1 Agent Routing

```mermaid
flowchart TD
    Q["User sends message\nPOST /conversations/{id}/chat"]
    Q --> LOAD["Load ConversationMemory\n(last 50 msgs from DB)"]
    LOAD --> CLASSIFY["QueryClassifier\nGroq Llama 3.1 8B · temp 0.1"]
    CLASSIFY --> ROUTE{"Route by\nagent type"}

    ROUTE -->|sql| SQL["SQLAgent"]
    ROUTE -->|analysis| ANA["AnalysisAgent"]
    ROUTE -->|hybrid| HYB["Both agents\nin parallel"]

    subgraph sql_path [" "]
        SQL --> V["Validate question\n(relevance gate)"]
        V --> GEN["NL → SQL\nCF SQLCoder-7B"]
        GEN --> EXEC["Execute SQL\nSupabase RPC"]
        EXEC --> EXP["Explain result\nCF Llama 4 Scout"]
    end

    subgraph analysis_path [" "]
        ANA --> FETCH["Fetch 90-day\nspending context"]
        FETCH --> INSIGHT["Generate insights\nGroq Llama 4 Maverick\ntemp 0.3"]
    end

    EXP --> RESULT["Unified Response\n+ save to conversation history"]
    INSIGHT --> RESULT
    HYB --> sql_path & analysis_path
```

### 5.2 Agent Specifications

| Agent | Responsibility | LLM | Temp |
|---|---|---|---|
| **QueryClassifier** | Intent classification, complexity scoring (1–3), agent routing | Groq Llama 3.1 8B | 0.1 |
| **SQLAgent** | Data retrieval — validate → NL-to-SQL → execute → explain | CF SQLCoder-7B + CF Llama 4 Scout | — |
| **AnalysisAgent** | Financial patterns, insights, recommendations using aggregated data | Groq Llama 4 Maverick 17B | 0.3 |
| **Orchestrator** | Memory loading, classification dispatch, result assembly | — | — |

### 5.3 Classification Schema

The classifier outputs a structured JSON decision:

```json
{
  "agent": "sql | analysis | hybrid",
  "complexity": 1,
  "requires_context": false,
  "query_type": "data_retrieval | analysis | recommendation | follow_up",
  "reasoning": "..."
}
```

| Complexity | Meaning | Example |
|---|---|---|
| 1 | Simple data retrieval | *"How much did I spend last week?"* |
| 2 | Context-aware follow-up | *"Break that down by category"* |
| 3 | Complex analysis | *"What are my spending trends?"* |

A heuristic layer detects reference words (*"this", "that", "more", "previous"*) and overrides complexity to >= 2 when conversational context is needed.

---

## 6. Conversation Memory

```mermaid
flowchart LR
    subgraph DB["Supabase"]
        CM_TBL["conversation_messages"]
    end

    subgraph MEM["Per-Request Memory"]
        MEM_OBJ["ConversationMemory\n• stores last 20 msgs\n• context window: last 10\n• recent queries: last 6"]
    end

    CHAT["Chat request"] --> HYDRATE["load_conversation_memory()"]
    HYDRATE --> CM_TBL -->|hydrate| MEM_OBJ

    MEM_OBJ --> AGENTS["Classifier + Agents\nuse context for prompts"]
    AGENTS --> RESP["Response"]
    RESP --> PERSIST["save_message()\nuser msg + assistant msg\n+ agent metadata"]
    PERSIST --> CM_TBL
```

Memory is **rehydrated from the database on every request** (stateless server), with a sliding window to keep LLM prompts within token limits.

---

## 7. Request Flow — Conversational Query (end-to-end)

```mermaid
sequenceDiagram
    participant U as User
    participant R as Conversations Router
    participant E as Orchestrator
    participant CL as QueryClassifier
    participant AG as Agent (SQL / Analysis)
    participant DB as Supabase
    participant LLM as Groq / Cloudflare

    U->>R: POST /{id}/chat { message }
    R->>R: Verify conversation exists
    R->>E: process_conversational_query()

    E->>DB: Load conversation messages
    DB-->>E: ConversationMemory (hydrated)

    E->>CL: classify_query(query, memory)
    CL->>LLM: Classification prompt
    LLM-->>CL: { agent, complexity, ... }
    CL-->>E: Route decision

    alt SQL Agent
        E->>AG: SQLAgent.process_query()
        AG->>LLM: validate → NL→SQL → explain
        AG->>DB: execute SQL (RPC)
    else Analysis Agent
        E->>AG: AnalysisAgent.process_query()
        AG->>DB: Fetch spending aggregates
        AG->>LLM: Generate insights
    end

    AG-->>E: { answer, metadata }
    E-->>R: Unified result

    R->>DB: Save user message
    R->>DB: Save assistant response + metadata
    R-->>U: ChatResponse
```

---

## 8. API Surface

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/users/signup` | Create account |
| `POST` | `/users/login` | Authenticate |
| `POST` | `/receipts/extract` | OCR + LLM extraction (preview) |
| `POST` | `/receipts/save` | Persist receipt + S3 upload |
| `GET` | `/receipts/user/{user_id}` | List receipts (paginated) |
| `GET` | `/receipts/{id}/items` | Get line items |
| `POST` | `/query/ask` | One-shot NL → SQL query |
| `POST` | `/conversations/` | Create conversation |
| `GET` | `/conversations/user/{user_id}` | List conversations |
| `POST` | `/conversations/{id}/chat` | Send message (multi-agent) |
| `POST` | `/conversations/quick-query` | One-off query (ephemeral session) |
| `DELETE` | `/conversations/{id}` | Soft-delete conversation |

---

## 9. Key Design Decisions

| Pattern | How it's applied |
|---|---|
| **Multi-Agent Routing** | LLM-powered classifier picks between SQL, Analysis, or Hybrid agents per query |
| **Parallel LLM Calls** | Receipt extraction + categorization run concurrently via `asyncio.gather()` |
| **Graceful Degradation** | OCR: Mistral → Tesseract; Explanation: LLM → raw JSON; Classification: LLM → heuristic |
| **Schema-Enforced Output** | Groq `json_schema` response format guarantees parseable structured output |
| **Sliding Window Memory** | 20-message store, 10-message context window prevents token overflow |
| **Two-Phase Receipt Flow** | Extract (preview) and Save are separate — user can review/correct before persisting |
| **Sync-to-Async Bridge** | Blocking SDK calls wrapped in `run_in_executor()` to keep the event loop non-blocking |
