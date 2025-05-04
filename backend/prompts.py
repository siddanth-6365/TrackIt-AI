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
Generate a single valid SQL query answering the question below for the 'receipts' table, filtering by user_id = '{user_id}'.

Question:
{question}

### Schema
CREATE TABLE receipts (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  vendor TEXT,
  transaction_date DATE,
  total_amount NUMERIC,
  expense_category TEXT,
  items JSONB
);

### Answer
Provide ONLY the SQL query without any markdown or extra text.
"""