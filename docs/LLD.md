# TrackIt-AI — Low-Level Design (LLD)

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Project Structure](#2-project-structure)
3. [Database Schema (ERD)](#3-database-schema-erd)
4. [High-Level Component Architecture](#4-high-level-component-architecture)
5. [Multi-Agent System Architecture](#5-multi-agent-system-architecture)
6. [Receipt Processing Pipeline](#6-receipt-processing-pipeline)
7. [Natural Language Query Pipeline](#7-natural-language-query-pipeline)
8. [Conversation Memory Architecture](#8-conversation-memory-architecture)
9. [External Service Integrations](#9-external-service-integrations)
10. [API Endpoint Summary](#10-api-endpoint-summary)
11. [Key Design Patterns](#11-key-design-patterns)

---

## 1. System Overview

TrackIt-AI is an **agentic AI-powered personal expense tracker** built with a FastAPI backend. It allows users to upload receipt images, automatically extract structured data using OCR + LLM pipelines, and query their expense data using natural language through a **multi-agent conversational AI system**.

**Core Capabilities:**

- Receipt image processing (OCR + LLM extraction + auto-categorization)
- Natural language to SQL querying with explanation generation
- Multi-turn conversational AI with memory and context awareness
- Multi-agent routing (SQL Agent, Analysis Agent, Hybrid)

---

## 2. Project Structure

```
backend/
├── main.py                        # FastAPI app entry point, CORS, router registration
├── requirements.txt               # Python dependencies
│
├── routers/                       # API layer (controllers)
│   ├── users.py                   #   POST /users/signup, /users/login
│   ├── receipts.py                #   POST /receipts/extract, /receipts/save
│   │                              #   GET  /receipts/user/{user_id}, /{receipt_id}/items
│   ├── query.py                   #   POST /query/ask  (legacy stateless NL→SQL)
│   └── conversations.py           #   CRUD /conversations + POST /{id}/chat
│
├── schemas/                       # Pydantic request/response models
│   ├── receipts.py                #   ExtractedReceipt, ReceiptOut, ItemOut, etc.
│   └── conversation.py            #   ChatMessage, ChatResponse, ConversationResponse
│
├── services/                      # Business logic layer
│   ├── user_service.py            #   create_user(), authenticate()
│   ├── ocr_service.py             #   do_ocr()  — Mistral OCR / Tesseract fallback
│   ├── llm_service.py             #   call_extract_details(), call_expense_category()
│   ├── receipt_service.py         #   save_receipt(), get_receipts(), get_items()
│   ├── query_service.py           #   validate_question(), get_sql_from_question(),
│   │                              #   execute_sql_in_supabase(), explain_query_2()
│   ├── query_agent.py             #   QueryClassifier, SQLAgent, AnalysisAgent,
│   │                              #   ConversationalQueryEngine (orchestrator)
│   ├── conversation_service.py    #   ConversationMemory, CRUD for conversations/messages
│   ├── groq_client.py             #   Singleton Groq client
│   ├── supabase_client.py         #   Singleton Supabase client + hash_password()
│   └── s3_client.py               #   upload_image_to_s3()
│
├── prompts/                       # LLM prompt templates
│   ├── receipt_extract.py         #   get_receipt_parser_prompt(), get_enhanced_category_prompt()
│   └── prompts.py                 #   VALIDATE_PROMPT, SQLCODER_PROMPT_TEMPLATE, EXPLAIN_PROMPT
│
├── constants/
│   └── schemas.py                 #   JSON schemas for structured output, expense_categories[]
│
└── models/
    ├── schemas.sql                #   PostgreSQL DDL (5 tables)
    └── dummy_data.sql             #   Test data
```

---

## 3. Database Schema (ERD)

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
        text merchant_address
        text merchant_phone
        text merchant_email
        date transaction_date
        numeric subtotal_amount
        numeric tax_amount
        numeric total_amount
        text expense_category
        text payment_method
        text image_url
        timestamptz created_at
    }

    receipt_items {
        serial id PK
        integer receipt_id FK
        text description
        numeric unit_price
        numeric quantity
        numeric line_total "generated: unit_price * quantity"
    }

    conversations {
        uuid id PK
        uuid user_id FK
        text title
        timestamptz created_at
        timestamptz updated_at
        integer message_count
        boolean is_active
    }

    conversation_messages {
        uuid id PK
        uuid conversation_id FK
        text role "enum: user | assistant | system"
        text content
        jsonb metadata
        timestamptz created_at
    }

    users ||--o{ receipts : "has"
    users ||--o{ conversations : "has"
    receipts ||--o{ receipt_items : "contains"
    conversations ||--o{ conversation_messages : "contains"
```

---

## 4. High-Level Component Architecture

```mermaid
flowchart TB
    subgraph Frontend
        FE["Next.js Frontend<br/>(localhost:3000)"]
    end

    subgraph FastAPI["FastAPI Application (main.py)"]
        direction LR
        UR["Users<br/>Router"]
        RR["Receipts<br/>Router"]
        QR["Query<br/>Router"]
        CR["Conversations<br/>Router"]
    end

    subgraph Services["Service Layer"]
        US["user_service"]
        OS["ocr_service"]
        LS["llm_service"]
        RS["receipt_service"]
        QS["query_service"]
        CS["conversation_service"]
        QA["query_agent<br/>(orchestrator)"]
    end

    subgraph External["External Services"]
        SUP["Supabase<br/>PostgreSQL"]
        S3["AWS S3<br/>Image Storage"]
        GROQ["Groq API<br/>LLM"]
        MIST["Mistral AI<br/>OCR"]
        CF["Cloudflare<br/>Workers AI"]
    end

    FE -->|"HTTP / REST"| FastAPI
    UR --> US
    RR --> OS
    RR --> LS
    RR --> RS
    QR --> QS
    CR --> CS
    CR --> QA

    US --> SUP
    RS --> SUP
    RS --> S3
    OS --> MIST
    LS --> GROQ
    QS --> CF
    QS --> SUP
    QA --> QS
    QA --> GROQ
    QA --> CS
    CS --> SUP
```

---

## 5. Multi-Agent System Architecture

This is the heart of the agentic AI design — the `query_agent.py` module.

### 5.1 Agent Routing Flow

```mermaid
flowchart TD
    A["User Query + conversation_id"] --> B["ConversationalQueryEngine<br/>(Orchestrator)"]

    B --> B1["1. Load ConversationMemory<br/>from DB"]
    B1 --> B2["2. QueryClassifier.classify_query()<br/>Groq Llama 3.1 8B"]
    B2 --> B3{"Agent Route?"}

    B3 -->|"agent = sql"| SQL["SQLAgent"]
    B3 -->|"agent = analysis"| ANA["AnalysisAgent"]
    B3 -->|"agent = hybrid"| HYB["Hybrid Mode"]

    SQL --> SQL1["1. Enhance query with<br/>conversation context"]
    SQL1 --> SQL2["2. validate_question()<br/>Groq Llama 3.1 8B"]
    SQL2 --> SQL3["3. get_sql_from_question()<br/>CF SQLCoder-7B"]
    SQL3 --> SQL4["4. execute_sql_in_supabase()<br/>Supabase RPC"]
    SQL4 --> SQL5["5. explain_query_2()<br/>CF Llama 4 Scout"]
    SQL5 --> RES["Unified Result"]

    ANA --> ANA1["1. Fetch 90-day spending<br/>summary by category"]
    ANA1 --> ANA2["2. Fetch top 10<br/>merchants"]
    ANA2 --> ANA3["3. Build analysis prompt<br/>with data context"]
    ANA3 --> ANA4["4. Generate insights<br/>Groq Llama 4 Maverick"]
    ANA4 --> RES

    HYB --> HYB1["Run SQLAgent +<br/>AnalysisAgent"]
    HYB1 --> HYB2["Merge results"]
    HYB2 --> RES
```

### 5.2 Query Classification Detail

```mermaid
flowchart LR
    Q["User Query"] --> CC["QueryClassifier"]

    CC --> CX["extract_context_from_query()<br/>Heuristic reference detection"]
    CC --> LLM["LLM Classification<br/>Groq Llama 3.1 8B<br/>temp=0.1"]

    CX --> REF{"References found?<br/>(this, that, more,<br/>previous, etc.)"}
    REF -->|Yes| CTX["requires_context = true<br/>complexity >= 2"]
    REF -->|No| NOCTX["requires_context = false"]

    LLM --> OUT["Classification Output"]
    CTX --> OUT
    NOCTX --> OUT

    OUT --> J["{ agent, complexity,<br/>requires_context,<br/>query_type, reasoning }"]
```

### 5.3 Agent Specifications

| Component | Role | LLM Used | Temperature |
|---|---|---|---|
| `QueryClassifier` | Classifies intent & complexity (1-3), picks agent route | Groq Llama 3.1 8B Instant | 0.1 |
| `SQLAgent` | Data retrieval — NL to SQL, execute, explain | Cloudflare SQLCoder-7B + CF Llama 4 Scout | — |
| `AnalysisAgent` | Financial insights, patterns, recommendations | Groq Llama 4 Maverick 17B | 0.3 |
| `ConversationalQueryEngine` | Orchestrator — memory loading, routing, result assembly | — | — |

**Classification Complexity Levels:**

| Level | Description | Example |
|---|---|---|
| 1 | Simple data retrieval (basic SQL) | "How much did I spend last week?" |
| 2 | Context-aware follow-ups | "Break that down by category" |
| 3 | Complex analysis (insights, patterns) | "What are my spending trends?" |

---

## 6. Receipt Processing Pipeline

```mermaid
flowchart TD
    A["Image Upload<br/>POST /receipts/extract"] --> B["OCR Service<br/>ocr_service.do_ocr()"]

    B --> C{"Mistral API<br/>available?"}
    C -->|Yes| D["Mistral OCR<br/>(mistral-ocr-latest)<br/>image → base64 → API → markdown"]
    C -->|No| E["Pytesseract<br/>(local fallback)<br/>image → PIL → text"]
    D -->|error| E

    D --> F["raw_text"]
    E --> F

    F --> G["Parallel LLM Calls<br/>asyncio.gather()"]

    G --> H["call_extract_details()<br/>Groq Llama 4 Scout 17B<br/>temp=0.2<br/>JSON schema enforced"]
    G --> I["call_expense_category()<br/>Groq Llama 4 Scout 17B<br/>temp=0.1<br/>JSON schema enforced"]

    H --> J["Structured Receipt Data<br/>merchant, date, items,<br/>amounts, payment method"]
    I --> K["Expense Category<br/>(from 11 predefined categories)"]

    J --> L["Merge Results"]
    K --> L

    L --> M["ExtractedReceipt<br/>(Pydantic model)<br/>returned to frontend for review"]

    M -->|"User confirms"| N["POST /receipts/save"]

    N --> O["Upload to S3<br/>s3_client.upload_image_to_s3()"]
    N --> P["INSERT into receipts table"]
    N --> Q["INSERT into receipt_items table"]

    O --> R["Saved Receipt<br/>(ReceiptOut)"]
    P --> R
    Q --> R
```

### 6.1 Expense Categories

| Category | Description |
|---|---|
| Groceries | Supermarkets, grocery stores, food markets |
| Dining | Restaurants, cafes, fast food, food delivery |
| Transportation | Gas stations, parking, ride-sharing, public transit |
| Utilities | Electric, water, gas, internet, phone bills |
| Entertainment | Movies, concerts, streaming, games, books |
| Travel | Hotels, flights, car rentals, vacation expenses |
| Health & Wellness | Pharmacy, medical, fitness, beauty |
| Office Supplies | Stationery, computer supplies, business materials |
| Shopping | Clothing, electronics, home goods, general retail |
| Services | Professional services, repairs, maintenance |
| Other | Everything else not fitting above categories |

---

## 7. Natural Language Query Pipeline

### 7.1 Legacy Stateless Query (POST /query/ask)

```mermaid
flowchart TD
    A["User Question<br/>POST /query/ask<br/>{ q, user_id }"] --> B["1. validate_question()<br/>Groq Llama 3.1 8B<br/>→ YES / NO"]

    B -->|NO| ERR1["400: Invalid question"]
    B -->|YES| C["2. get_sql_from_question()<br/>Cloudflare Workers AI<br/>SQLCoder-7B-2"]

    C --> D["Generated SQL<br/>(cleaned, no backticks)"]
    D --> E["3. execute_sql_in_supabase()<br/>Supabase RPC: run_sql()"]
    E --> F["Result rows[]"]
    F --> G["4. explain_query_2()<br/>Cloudflare Workers AI<br/>Llama 4 Scout 17B"]

    G --> H["{ sql, result, answer }"]
```

### 7.2 Conversational Query (POST /conversations/{id}/chat)

```mermaid
sequenceDiagram
    participant U as User
    participant R as Conversations Router
    participant E as ConversationalQueryEngine
    participant CL as QueryClassifier
    participant MEM as ConversationMemory
    participant AG as Agent (SQL/Analysis/Hybrid)
    participant DB as Supabase DB

    U->>R: POST /{id}/chat { message }
    R->>R: Verify conversation exists
    R->>E: process_conversational_query(query, user_id, conv_id)

    E->>MEM: load_conversation_memory(conv_id)
    MEM->>DB: SELECT from conversation_messages
    DB-->>MEM: Recent messages
    MEM-->>E: Hydrated ConversationMemory

    E->>CL: classify_query(query, memory)
    CL->>CL: extract_context_from_query() (heuristic)
    CL->>CL: LLM classification (Groq Llama 3.1 8B)
    CL-->>E: { agent, complexity, requires_context, ... }

    E->>AG: process_query(query, user_id, memory, classification)
    AG->>AG: Execute agent-specific pipeline
    AG-->>E: { success, answer, agent, metadata }

    E-->>R: Unified result

    R->>DB: Save user message
    R->>DB: Save assistant response + metadata
    R-->>U: ChatResponse { response, agent_used, classification }
```

---

## 8. Conversation Memory Architecture

```mermaid
flowchart TD
    subgraph Per-Request["Per-Request (In-Memory)"]
        CM["ConversationMemory"]
        CM --> F1["conversation_id: str"]
        CM --> F2["messages: List[Dict]<br/>max 20 messages"]
        CM --> F3["get_conversation_context()<br/>→ last 10 messages formatted"]
        CM --> F4["get_recent_queries()<br/>→ last 6 messages"]
    end

    subgraph Persistence["Persistence (Supabase)"]
        CT["conversations table"]
        MT["conversation_messages table"]
    end

    A["POST /{id}/chat"] --> B["load_conversation_memory()"]
    B --> MT
    MT -->|"hydrate"| CM

    CM -->|"used by"| QC["QueryClassifier"]
    CM -->|"used by"| SA["SQLAgent"]
    CM -->|"used by"| AA["AnalysisAgent"]

    QC --> RES["Response generated"]
    SA --> RES
    AA --> RES

    RES --> SAVE["save_message()"]
    SAVE --> MT
    SAVE --> UPD["update_conversation_activity()<br/>timestamp + message_count"]
    UPD --> CT
```

**Conversation Lifecycle:**

1. `POST /conversations/` — creates session, returns `conversation_id`
2. `POST /conversations/{id}/chat` — sends message, triggers multi-agent pipeline
3. Both user message and assistant response are persisted to `conversation_messages`
4. On each chat request, memory is rehydrated from DB (last 50 messages, context window = last 10)
5. `POST /conversations/quick-query` — creates ephemeral conversation for one-off questions

---

## 9. External Service Integrations

| Service | Client | Purpose | Models / Endpoints |
|---|---|---|---|
| **Groq** | `groq.Groq` | Primary LLM provider | `llama-3.1-8b-instant` (validation, classification) |
| | | | `llama-4-scout-17b-16e-instruct` (receipt parsing, categorization) |
| | | | `llama-4-maverick-17b-128e-instruct` (analysis, explanations) |
| **Cloudflare Workers AI** | `requests.post()` | Text-to-SQL + query explanation | `@cf/defog/sqlcoder-7b-2` (NL → SQL) |
| | | | `@cf/meta/llama-4-scout-17b-16e-instruct` (explain results) |
| **Mistral AI** | `mistralai.Mistral` | Primary OCR | `mistral-ocr-latest` |
| **Pytesseract** | `pytesseract` | Fallback OCR (local) | Tesseract engine |
| **Supabase** | `supabase-py` | PostgreSQL database | REST API + RPC (`run_sql`) |
| **AWS S3** | `boto3` | Receipt image storage | `put_object` to configured bucket/folder |

### Environment Variables Required

```
SUPABASE_URL, SUPABASE_KEY
GROQ_API_KEY
MISTRAL_API_KEY
CLOUDFLARE_AUTH_TOKEN, CLOUDFLARE_ACCOUNT_ID
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME, S3_FOLDER
PW_SALT
```

---

## 10. API Endpoint Summary

| Method | Endpoint | Router | Description |
|---|---|---|---|
| `POST` | `/users/signup` | users | Create user account |
| `POST` | `/users/login` | users | Authenticate user |
| `POST` | `/receipts/extract` | receipts | OCR + LLM extraction (no save) |
| `POST` | `/receipts/save` | receipts | Save extracted receipt + S3 upload |
| `GET` | `/receipts/user/{user_id}` | receipts | List user's receipts (paginated) |
| `GET` | `/receipts/{receipt_id}/items` | receipts | Get line items for a receipt |
| `POST` | `/query/ask` | query | Stateless NL → SQL query (legacy) |
| `POST` | `/conversations/` | conversations | Create conversation session |
| `GET` | `/conversations/user/{user_id}` | conversations | List user's conversations |
| `GET` | `/conversations/{id}` | conversations | Get conversation details |
| `GET` | `/conversations/{id}/messages` | conversations | Get message history |
| `POST` | `/conversations/{id}/chat` | conversations | Send chat message (multi-agent) |
| `DELETE` | `/conversations/{id}` | conversations | Soft-delete conversation |
| `POST` | `/conversations/quick-query` | conversations | One-off query (ephemeral session) |

---

## 11. Key Design Patterns

### 11.1 Multi-Agent Routing

`QueryClassifier` determines which agent handles the query based on LLM-powered intent classification with heuristic fallback. Three routes exist: `sql` (data retrieval), `analysis` (insights), and `hybrid` (both in parallel).

### 11.2 Parallel LLM Calls

Receipt extraction runs detail parsing and category classification concurrently via `asyncio.gather()`, reducing total latency.

### 11.3 Graceful Degradation

Multiple fallback chains are in place:

- **OCR:** Mistral API → Pytesseract (local)
- **Query explanation:** LLM response → raw JSON dump of rows
- **Classification:** LLM classification → heuristic keyword matching

### 11.4 Sync-to-Async Bridge

Blocking LLM/S3 SDK calls are wrapped in `asyncio.get_running_loop().run_in_executor()` to avoid blocking the FastAPI event loop.

### 11.5 Schema-Enforced LLM Output

Groq's `response_format: { type: "json_schema", json_schema: ... }` ensures structured, parseable output from receipt extraction and categorization — eliminating brittle regex parsing.

### 11.6 Sliding Window Memory

Conversation context is capped at **20 stored messages** with a **10-message context window** passed to LLMs, preventing token overflow while maintaining relevant context.

### 11.7 Two-Phase Receipt Flow

Extract (preview) and Save are separate endpoints, allowing user review and correction of OCR/LLM results before persistence — critical for data accuracy.
