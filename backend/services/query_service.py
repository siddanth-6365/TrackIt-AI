from dotenv import load_dotenv
import os
import google.generativeai as genai
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Build a prompt template with user_id placeholder
PROMPT_TEMPLATE = """
You are an expert in converting English questions to SQL queries!
The SQL database is named receipts, with columns:
  id, user_id, vendor, transaction_date, total_amount, expense_category, items.

Always include a WHERE clause filtering by user_id = '{user_id}'.

Examples:
Q: How many receipts are there?
A: SELECT COUNT(*) FROM receipts WHERE user_id = '{user_id}';

Q: Show all receipts from Amazon.
A: SELECT * FROM receipts
   WHERE user_id = '{user_id}'
     AND vendor = 'Amazon';

Q: What is the total amount spent on Food?
A: SELECT SUM(total_amount) FROM receipts
   WHERE user_id = '{user_id}'
     AND expense_category = 'Food';

Return ONLY the SQL—no markdown, no extra text.
"""

def get_gemini_response(question: str, user_id: str) -> str:
    # Fill in the user_id in the prompt
    prompt = PROMPT_TEMPLATE.format(user_id=user_id)
    model = genai.GenerativeModel(model_name="models/gemini-1.5-pro-latest")
    response = model.generate_content([prompt, question])
    return response.text.strip()

def execute_sql_in_supabase(supabase, sql: str):
    """
    Executes the given SQL statement using Supabase's run_sql RPC.
    Returns the response data or raises an exception on error.
    """
    try:
        resp = supabase.rpc("run_sql", {"query_text": sql}).execute()
    except Exception as e:
        # Optionally, log the error here
        raise RuntimeError(f"Supabase RPC error: {e}") from e
    return resp.data or []
  
  
EXPLAIN_PROMPT = """
You are an AI assistant. Given the SQL query and its returned data rows, provide a concise, human-readable summary of the result.

Rows (JSON array):
{rows}

Write your summary as a natural language answer to the user's original question.
"""

def explain_query(rows: list) -> str:
    # fill prompt
    prompt = EXPLAIN_PROMPT.format(rows=rows)
    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_completion_tokens=512,
            top_p=1,
            stream=True,
        )
        text = ""
        for chunk in completion:
            text += chunk.choices[0].delta.content or ""
        return text.strip()
    except GroqError as e:
        raise RuntimeError(f"Groq API error: {e}") from e