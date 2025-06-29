# Validate user question
VALIDATE_PROMPT = """
You are a filter AI. Decide if the user's question is relevant to personal receipt data.
Answer exactly "YES" or "NO".

Examples:
Q: How much did I spend on food this month?
A: YES

Q: What's the weather today?
A: NO

Q: Show me all receipts from Amazon.
A: YES

Q: Tell me a joke.
A: NO

User question:
{question}
"""

# NL ➔ SQL via Gemini
Gemini_SQL_PROMPT = """
You are an expert SQL generator. Generate a single valid SQL query answering the user's question about their receipts.
Table: receipts (id, user_id, vendor, transaction_date, total_amount, expense_category, items).
Always include WHERE user_id = '{user_id}'.
Return only the SQL (no markdown).

Question:
{question}
"""

# Explain results via Groq
EXPLAIN_PROMPT = """
You are an AI assistant. The user asked: "{question}".

You ran this SQL:
{sql}

Returned rows:
{rows}

Provide a concise, friendly summary directly answering the user's question. If no data, say "No records found." Output only the summary.
"""


# NL → SQL via Cloudflare SQLCoder
SQLCODER_PROMPT_TEMPLATE = """
### Task
Generate a single valid SQL query answering the question below for the `receipts` (and, if needed, `receipt_items`) tables, filtering by `user_id = '{user_id}'`.

Question:
{question}

### Schema
CREATE TABLE receipts (
  id              SERIAL PRIMARY KEY,
  user_id         UUID,
  merchant_name   TEXT,
  merchant_address TEXT,
  merchant_phone  TEXT,
  merchant_email  TEXT,
  transaction_date DATE,
  subtotal_amount NUMERIC(12,2),
  tax_amount      NUMERIC(12,2),
  total_amount    NUMERIC(12,2),
  expense_category TEXT,
  payment_method  TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ
);

CREATE TABLE receipt_items (
  id           SERIAL PRIMARY KEY,
  receipt_id   INTEGER,
  description  TEXT,
  unit_price   NUMERIC(12,2),
  quantity     NUMERIC(12,2),
  line_total   NUMERIC GENERATED ALWAYS AS (unit_price * quantity) STORED
);

### Answer
Provide ONLY the SQL query (no markdown, no commentary).
"""